import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import zlib from "zlib"

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
    console.error("[backup/restore] Session error:", error)
    return null
  }
}

// ============================================
// Table insert order (dependency-safe)
// ============================================
const TABLES_INSERT_ORDER = [
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
// Parse backup data from compressed base64
// ============================================
function parseBackupData(compressedBase64: string) {
  const compressedBuffer = Buffer.from(compressedBase64, "base64")
  const jsonString = zlib.gunzipSync(compressedBuffer).toString("utf-8")
  const payload = JSON.parse(jsonString)
  return {
    tables: payload.tables || {},
    version: payload.version || "unknown",
    exportedAt: payload.exportedAt || new Date().toISOString(),
  }
}

// ============================================
// Delete all data (full clear)
// ============================================
async function clearAllTables() {
  const deleteOps: Record<string, () => Promise<unknown>> = {
    Notification: () => db.notification.deleteMany(),
    AuditLog: () => db.auditLog.deleteMany(),
    CleaningTaskItem: () => db.cleaningTaskItem.deleteMany(),
    CleaningTask: () => db.cleaningTask.deleteMany(),
    Expense: () => db.expense.deleteMany(),
    OrderItem: () => db.orderItem.deleteMany(),
    RestaurantOrder: () => db.restaurantOrder.deleteMany(),
    Payment: () => db.payment.deleteMany(),
    InvoiceItem: () => db.invoiceItem.deleteMany(),
    Invoice: () => db.invoice.deleteMany(),
    Booking: () => db.booking.deleteMany(),
    Guest: () => db.guest.deleteMany(),
    MenuItem: () => db.menuItem.deleteMany(),
    RoomPrice: () => db.roomPrice.deleteMany(),
    Amenity: () => db.amenity.deleteMany(),
    Room: () => db.room.deleteMany(),
    Role: () => db.role.deleteMany(),
    GuestHouseSetting: () => db.guestHouseSetting.deleteMany(),
    User: () => db.user.deleteMany(),
    GuestHouse: () => db.guestHouse.deleteMany(),
  }

  for (const table of TABLES_DELETE_ORDER) {
    const op = deleteOps[table]
    if (op) {
      try {
        await op()
      } catch (err) {
        console.error(`Erreur suppression table ${table}:`, err)
      }
    }
  }
}

// ============================================
// Insert all data (full restore)
// ============================================
async function insertAllTables(tables: Record<string, unknown[]>) {
  const insertOps: Record<string, (rows: unknown[]) => Promise<unknown>> = {
    GuestHouse: (rows) => db.guestHouse.createMany({ data: rows as any[] }),
    GuestHouseSetting: (rows) => db.guestHouseSetting.createMany({ data: rows as any[] }),
    User: (rows) => db.user.createMany({ data: rows as any[] }),
    Role: (rows) => db.role.createMany({ data: rows as any[] }),
    Room: (rows) => db.room.createMany({ data: rows as any[] }),
    RoomPrice: (rows) => db.roomPrice.createMany({ data: rows as any[] }),
    Amenity: (rows) => db.amenity.createMany({ data: rows as any[] }),
    Guest: (rows) => db.guest.createMany({ data: rows as any[] }),
    Booking: (rows) => db.booking.createMany({ data: rows as any[] }),
    Invoice: (rows) => db.invoice.createMany({ data: rows as any[] }),
    InvoiceItem: (rows) => db.invoiceItem.createMany({ data: rows as any[] }),
    Payment: (rows) => db.payment.createMany({ data: rows as any[] }),
    MenuItem: (rows) => db.menuItem.createMany({ data: rows as any[] }),
    RestaurantOrder: (rows) => db.restaurantOrder.createMany({ data: rows as any[] }),
    OrderItem: (rows) => db.orderItem.createMany({ data: rows as any[] }),
    Expense: (rows) => db.expense.createMany({ data: rows as any[] }),
    CleaningTask: (rows) => db.cleaningTask.createMany({ data: rows as any[] }),
    CleaningTaskItem: (rows) => db.cleaningTaskItem.createMany({ data: rows as any[] }),
    Notification: (rows) => db.notification.createMany({ data: rows as any[] }),
    AuditLog: (rows) => db.auditLog.createMany({ data: rows as any[] }),
  }

  let totalInserted = 0
  const details: Record<string, number> = {}

  for (const table of TABLES_INSERT_ORDER) {
    const op = insertOps[table]
    const rows = tables[table] || []
    if (!op || rows.length === 0) {
      details[table] = 0
      continue
    }

    try {
      const BATCH_SIZE = 100
      let inserted = 0
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE)
        const result = await op(batch)
        if (result && typeof result === "object" && "count" in result) {
          inserted += (result as { count: number }).count
        } else {
          inserted += batch.length
        }
      }
      details[table] = inserted
      totalInserted += inserted
    } catch (err) {
      console.error(`Erreur insertion table ${table}:`, err)
      details[table] = 0
    }
  }

  return { totalInserted, details }
}

// ============================================
// Filter tables by guestHouseId
// ============================================
function filterByGuestHouse(
  tables: Record<string, unknown[]>,
  guestHouseId: string
): Record<string, unknown[]> {
  const filtered: Record<string, unknown[]> = {}

  const roomIds = new Set<string>()
  const guestIds = new Set<string>()
  const invoiceIds = new Set<string>()
  const orderIds = new Set<string>()
  const taskIds = new Set<string>()
  const menuItemIds = new Set<string>()

  filtered.GuestHouse = (tables.GuestHouse || []).filter((r: any) => r.id === guestHouseId)
  filtered.GuestHouseSetting = (tables.GuestHouseSetting || []).filter((r: any) => r.guestHouseId === guestHouseId)
  filtered.User = (tables.User || []).filter((r: any) => {
    if (r.guestHouseId === guestHouseId) return true
    return false
  })
  filtered.Role = (tables.Role || []).filter((r: any) => r.guestHouseId === guestHouseId)
  filtered.Room = (tables.Room || []).filter((r: any) => {
    if (r.guestHouseId === guestHouseId) { roomIds.add(r.id); return true }
    return false
  })
  filtered.RoomPrice = (tables.RoomPrice || []).filter((r: any) => roomIds.has(r.roomId))
  filtered.Amenity = (tables.Amenity || []).filter((r: any) => r.guestHouseId === guestHouseId)
  filtered.Guest = (tables.Guest || []).filter((r: any) => {
    if (r.guestHouseId === guestHouseId) { guestIds.add(r.id); return true }
    return false
  })
  filtered.Booking = (tables.Booking || []).filter((r: any) => r.guestHouseId === guestHouseId)
  filtered.Invoice = (tables.Invoice || []).filter((r: any) => {
    if (r.guestHouseId === guestHouseId) { invoiceIds.add(r.id); return true }
    return false
  })
  filtered.InvoiceItem = (tables.InvoiceItem || []).filter((r: any) => invoiceIds.has(r.invoiceId))
  filtered.Payment = (tables.Payment || []).filter((r: any) => r.guestHouseId === guestHouseId)
  filtered.MenuItem = (tables.MenuItem || []).filter((r: any) => {
    if (r.guestHouseId === guestHouseId) { menuItemIds.add(r.id); return true }
    return false
  })
  filtered.RestaurantOrder = (tables.RestaurantOrder || []).filter((r: any) => {
    if (r.guestHouseId === guestHouseId) { orderIds.add(r.id); return true }
    return false
  })
  filtered.OrderItem = (tables.OrderItem || []).filter((r: any) => orderIds.has(r.orderId))
  filtered.Expense = (tables.Expense || []).filter((r: any) => r.guestHouseId === guestHouseId)
  filtered.CleaningTask = (tables.CleaningTask || []).filter((r: any) => {
    if (r.guestHouseId === guestHouseId) { taskIds.add(r.id); return true }
    return false
  })
  filtered.CleaningTaskItem = (tables.CleaningTaskItem || []).filter((r: any) => taskIds.has(r.taskId))
  filtered.Notification = (tables.Notification || []).filter((r: any) => r.guestHouseId === guestHouseId)
  filtered.AuditLog = (tables.AuditLog || []).filter((r: any) => r.guestHouseId === guestHouseId)

  return filtered
}

// ============================================
// POST - Restore from backup
// ============================================
export async function POST(request: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const id = request.nextUrl.searchParams.get("id")
  const guestHouseId = request.nextUrl.searchParams.get("guestHouseId")

  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 })
  }

  try {
    const backup = await db.backup.findFirst({
      where: { id },
    })

    if (!backup) {
      return NextResponse.json({ error: "Backup non trouvé" }, { status: 404 })
    }

    const { tables, version, exportedAt } = parseBackupData(backup.compressedData)

    if (guestHouseId) {
      // ─── Individual guesthouse restore ───────────────────────
      const filteredTables = filterByGuestHouse(tables, guestHouseId)

      if (filteredTables.GuestHouse.length === 0) {
        return NextResponse.json(
          { error: "Cette maison d'hôtes n'existe pas dans cette sauvegarde" },
          { status: 404 }
        )
      }

      const existingGh = await db.guestHouse.findUnique({
        where: { id: guestHouseId },
        select: { id: true },
      })

      if (existingGh) {
        await db.guestHouse.delete({ where: { id: guestHouseId } })
      }

      const { totalInserted, details } = await insertAllTables(filteredTables)

      return NextResponse.json({
        success: true,
        message: `Maison d'hôtes "${(filteredTables.GuestHouse[0] as any)?.name || guestHouseId}" restaurée`,
        mode: "guesthouse",
        stats: { totalInserted, details },
        meta: { backupLabel: backup.label, backupDate: exportedAt, backupVersion: version },
      })
    } else {
      // ─── Full restore ─────────────────────────────────────────
      await clearAllTables()
      const { totalInserted, details } = await insertAllTables(tables)

      return NextResponse.json({
        success: true,
        message: "Restauration complète terminée",
        mode: "full",
        stats: { totalInserted, details },
        meta: { backupLabel: backup.label, backupDate: exportedAt, backupVersion: version },
      })
    }
  } catch (error) {
    console.error("[backup/restore] Error:", error)
    const message = error instanceof Error ? error.message : "Erreur interne du serveur"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
