import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import zlib from "zlib"
import { APP_VERSION } from "@/lib/version"

// Force dynamic rendering (no caching)
export const dynamic = "force-dynamic"

// ============================================
// Super Admin guard
// ============================================
async function requireSuperAdmin() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "super_admin") {
      return null
    }
    return session.user
  } catch (error) {
    console.error("Erreur session backup:", error)
    return null
  }
}

// ============================================
// Table export order (dependency-safe for insert)
// ============================================
const TABLES_ORDER = [
  "GuestHouse",
  "GuestHouseSetting",
  "User",
  "Role",
  "Room",
  "RoomPrice",
  "Amenity",
  "Guest",
  "Booking",
  "Invoice",
  "InvoiceItem",
  "Payment",
  "MenuItem",
  "RestaurantOrder",
  "OrderItem",
  "Expense",
  "CleaningTask",
  "CleaningTaskItem",
  "Notification",
  "AuditLog",
]

// ============================================
// Table delete order (reverse dependencies)
// ============================================
const TABLES_DELETE_ORDER = [
  "Notification",
  "AuditLog",
  "CleaningTaskItem",
  "CleaningTask",
  "Expense",
  "OrderItem",
  "RestaurantOrder",
  "Payment",
  "InvoiceItem",
  "Invoice",
  "Booking",
  "Guest",
  "MenuItem",
  "RoomPrice",
  "Amenity",
  "Room",
  "Role",
  "GuestHouseSetting",
  "User",
  "GuestHouse",
]

// ============================================
// Export all data using Prisma queries (portable)
// ============================================
async function exportAllData() {
  const tables: Record<string, unknown[]> = {}
  const tableSummary: Record<string, number> = {}
  let guestHouseList: { id: string; name: string; slug: string }[] = []

  // Use Prisma model queries — portable across SQLite and PostgreSQL
  const queries: Record<string, () => Promise<unknown[]>> = {
    GuestHouse: () => db.guestHouse.findMany(),
    GuestHouseSetting: () => db.guestHouseSetting.findMany(),
    User: () => db.user.findMany(),
    Role: () => db.role.findMany(),
    Room: () => db.room.findMany(),
    RoomPrice: () => db.roomPrice.findMany(),
    Amenity: () => db.amenity.findMany(),
    Guest: () => db.guest.findMany(),
    Booking: () => db.booking.findMany(),
    Invoice: () => db.invoice.findMany(),
    InvoiceItem: () => db.invoiceItem.findMany(),
    Payment: () => db.payment.findMany(),
    MenuItem: () => db.menuItem.findMany(),
    RestaurantOrder: () => db.restaurantOrder.findMany(),
    OrderItem: () => db.orderItem.findMany(),
    Expense: () => db.expense.findMany(),
    CleaningTask: () => db.cleaningTask.findMany(),
    CleaningTaskItem: () => db.cleaningTaskItem.findMany(),
    Notification: () => db.notification.findMany(),
    AuditLog: () => db.auditLog.findMany(),
  }

  for (const table of TABLES_ORDER) {
    const query = queries[table]
    if (!query) continue
    try {
      const rows = await query()
      tables[table] = rows as unknown[]
      tableSummary[table] = rows.length

      if (table === "GuestHouse") {
        guestHouseList = (rows as Record<string, unknown>[]).map((r) => ({
          id: r.id as string,
          name: r.name as string,
          slug: r.slug as string,
        }))
      }
    } catch (err) {
      console.error(`Erreur export table ${table}:`, err)
      tables[table] = []
      tableSummary[table] = 0
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
      tableSummary: JSON.parse(b.tableSummary || "{}"),
      guestHouseList: JSON.parse(b.guestHouseList || "[]"),
    }))

    return NextResponse.json({ backups: parsedBackups }, {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    })
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
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      tables,
      meta: {
        tableSummary,
        guestHouseList,
      },
    }

    // Compress with gzip → base64
    const jsonString = JSON.stringify(payload)
    const compressed = zlib.gzipSync(Buffer.from(jsonString))
    const compressedBase64 = compressed.toString("base64")

    // Calculate size in Ko
    const sizeKo = Math.round(Buffer.byteLength(compressedBase64, "base64") / 1024)

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
    const message = error instanceof Error ? error.message : "Erreur interne du serveur"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ============================================
// DELETE - Delete a backup (by query param ?id=)
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

    const backup = await db.backup.findUnique({
      where: { id },
      select: { id: true, label: true, createdAt: true },
    })

    if (!backup) {
      return NextResponse.json({ error: "Backup non trouvé" }, { status: 404 })
    }

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
