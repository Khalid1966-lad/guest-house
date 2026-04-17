import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import zlib from "zlib"
import { createId } from "@paralleldrive/cuid2"
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
// GET - List all backups (RAW SQL - bypass Prisma model)
// ============================================
export async function GET() {
  const user = await requireSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    const backups = await db.$queryRaw<Array<{
      id: string
      label: string | null
      type: string
      sizeKo: number
      tableCount: number
      tableSummary: string
      guestHouseList: string
      createdBy: string
      createdAt: Date
    }>>`
      SELECT "id", "label", "type", "sizeKo", "tableCount", "tableSummary", "guestHouseList", "createdBy", "createdAt"
      FROM "Backup"
      ORDER BY "createdAt" DESC
    `

    const parsedBackups = backups.map((b) => ({
      id: b.id,
      label: b.label,
      type: b.type,
      sizeKo: b.sizeKo,
      tableCount: b.tableCount,
      tableSummary: JSON.parse(b.tableSummary || "{}"),
      guestHouseList: JSON.parse(b.guestHouseList || "[]"),
      createdBy: b.createdBy,
      createdAt: b.createdAt.toISOString(),
    }))

    return NextResponse.json({ backups: parsedBackups }, {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    })
  } catch (error) {
    console.error("Erreur récupération backups:", error)
    return NextResponse.json({ 
      error: "Erreur interne du serveur",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// ============================================
// POST - Create a backup (RAW SQL for Backup table)
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

    // Generate ID
    const id = createId()

    // Insert using raw SQL
    await db.$executeRaw`
      INSERT INTO "Backup" ("id", "label", "type", "compressedData", "sizeKo", "tableCount", "tableSummary", "guestHouseList", "createdBy", "createdAt")
      VALUES (${id}, ${label || null}, ${type}, ${compressedBase64}, ${sizeKo}, ${TABLES_ORDER.length}, ${JSON.stringify(tableSummary)}, ${JSON.stringify(guestHouseList)}, ${user.id}, NOW())
    `

    // Auto cleanup: keep max 5 auto backups
    if (type === "auto") {
      const autoBackups = await db.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Backup" WHERE "type" = 'auto' ORDER BY "createdAt" DESC
      `
      if (autoBackups.length > 5) {
        const toDeleteIds = autoBackups.slice(5)
        for (const b of toDeleteIds) {
          await db.$executeRaw`DELETE FROM "Backup" WHERE "id" = ${b.id}`
        }
      }
    }

    return NextResponse.json({
      success: true,
      backup: {
        id,
        label: label || null,
        type,
        sizeKo,
        tableCount: TABLES_ORDER.length,
        tableSummary,
        guestHouseList,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
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

    // Check existence with raw SQL
    const existing = await db.$queryRaw<Array<{ id: string; label: string | null }>>`
      SELECT "id", "label" FROM "Backup" WHERE "id" = ${id}
    `

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Backup non trouvé" }, { status: 404 })
    }

    await db.$executeRaw`DELETE FROM "Backup" WHERE "id" = ${id}`

    return NextResponse.json({
      success: true,
      message: `Backup "${existing[0].label || existing[0].id}" supprimé avec succès`,
    })
  } catch (error) {
    console.error("Erreur suppression backup:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
