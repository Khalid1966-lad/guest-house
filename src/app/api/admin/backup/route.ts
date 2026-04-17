import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import zlib from "zlib"

// ============================================
// Super Admin guard
// ============================================
async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "super_admin") {
    return null
  }
  return session.user
}

// ============================================
// Table export order (dependency-safe)
// ============================================
const TABLES_ORDER = [
  'GuestHouse', 'GuestHouseSetting', 'User', 'Role', 'Room', 'RoomPrice',
  'Amenity', 'Guest', 'Booking', 'Invoice', 'InvoiceItem', 'Payment',
  'MenuItem', 'RestaurantOrder', 'OrderItem', 'Expense',
  'CleaningTask', 'CleaningTaskItem', 'Notification', 'AuditLog',
]

// ============================================
// Export all data from every table
// ============================================
async function exportAllData() {
  const tables: Record<string, unknown[]> = {}
  const tableSummary: Record<string, number> = {}
  let guestHouseList: { id: string; name: string; slug: string }[] = []

  for (const table of TABLES_ORDER) {
    const rows = await db.$queryRawUnsafe<{ data: unknown }[]>(
      `SELECT row_to_json(t) as data FROM "${table}" t`
    )
    tables[table] = rows.map((r) => r.data)
    tableSummary[table] = rows.length

    // Extract guest house list from the GuestHouse table
    if (table === "GuestHouse") {
      guestHouseList = rows.map((r) => {
        const row = r.data as Record<string, unknown>
        return {
          id: row.id as string,
          name: row.name as string,
          slug: row.slug as string,
        }
      })
    }
  }

  return { tables, tableSummary, guestHouseList }
}

// ============================================
// GET - List all backups
// ============================================
export async function GET() {
  const user = await requireSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    const backups = await db.backup.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        type: true,
        sizeKo: true,
        tableCount: true,
        tableSummary: true,
        guestHouseList: true,
        createdBy: true,
        createdAt: true,
      },
    })

    // Parse JSON fields
    const parsedBackups = backups.map((b) => ({
      ...b,
      tableSummary: JSON.parse(b.tableSummary),
      guestHouseList: JSON.parse(b.guestHouseList),
    }))

    return NextResponse.json({ backups: parsedBackups })
  } catch (error) {
    console.error("Erreur récupération backups:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// ============================================
// POST - Create a backup
// ============================================
export async function POST(request: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const label: string | undefined = body.label
    const type: "manual" | "auto" = body.type || "manual"

    // Export all data
    const { tables, tableSummary, guestHouseList } = await exportAllData()

    // Build backup payload
    const payload = {
      version: "v2.5.0",
      exportedAt: new Date().toISOString(),
      tables,
      meta: {
        tableSummary,
        guestHouseList,
      },
    }

    // Compress with gzip + base64
    const jsonString = JSON.stringify(payload)
    const compressed = zlib.gzipSync(Buffer.from(jsonString))
    const compressedBase64 = compressed.toString("base64")

    // Calculate size in Ko from base64 string length
    const sizeKo = Math.round(compressedBase64.length / 1024)

    // Save to DB
    const backup = await db.backup.create({
      data: {
        label: label || null,
        type,
        compressedData: compressedBase64,
        sizeKo,
        tableCount: TABLES_ORDER.length,
        tableSummary: JSON.stringify(tableSummary),
        guestHouseList: JSON.stringify(guestHouseList),
        createdBy: user.id,
      },
    })

    // Auto cleanup: keep max 5 auto backups
    if (type === "auto") {
      const autoBackups = await db.backup.findMany({
        where: { type: "auto" },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      })

      if (autoBackups.length > 5) {
        const toDelete = autoBackups.slice(5)
        await db.backup.deleteMany({
          where: { id: { in: toDelete.map((b) => b.id) } },
        })
      }
    }

    return NextResponse.json({
      success: true,
      backup: {
        id: backup.id,
        label: backup.label,
        type: backup.type,
        sizeKo: backup.sizeKo,
        tableCount: backup.tableCount,
        tableSummary,
        guestHouseList,
        createdBy: backup.createdBy,
        createdAt: backup.createdAt,
      },
    })
  } catch (error) {
    console.error("Erreur création backup:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// ============================================
// DELETE - Delete a backup
// ============================================
export async function DELETE(request: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 })
    }

    // Verify backup exists
    const backup = await db.backup.findUnique({
      where: { id },
      select: { id: true, label: true, createdAt: true },
    })

    if (!backup) {
      return NextResponse.json({ error: "Backup non trouvé" }, { status: 404 })
    }

    // Delete
    await db.backup.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: `Backup "${backup.label || backup.id}" supprimé avec succès`,
    })
  } catch (error) {
    console.error("Erreur suppression backup:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
