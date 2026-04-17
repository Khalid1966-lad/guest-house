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
// Validate backup structure (dry-run)
// ============================================
function validateBackupStructure(tables: Record<string, unknown[]>) {
  const issues: string[] = []
  const stats: Record<string, { rows: number; columns: number; sampleColumns: string[] }> = {}

  for (const tableName of TABLES_INSERT_ORDER) {
    const rows = tables[tableName] || []
    const sampleColumns = rows.length > 0 ? Object.keys(rows[0] as object) : []

    stats[tableName] = {
      rows: rows.length,
      columns: sampleColumns.length,
      sampleColumns: sampleColumns.slice(0, 5),
    }

    if (rows.length > 0 && sampleColumns.length === 0) {
      issues.push(`${tableName}: ${rows.length} lignes mais aucune colonne détectée`)
    }

    // Check critical fields
    if (rows.length > 0) {
      if (tableName === "GuestHouse" && !sampleColumns.includes("id")) {
        issues.push("GuestHouse: colonne 'id' manquante")
      }
      if (tableName === "User" && !sampleColumns.includes("email")) {
        issues.push("User: colonne 'email' manquante")
      }
      if (tableName === "GuestHouse" && !sampleColumns.includes("slug")) {
        issues.push("GuestHouse: colonne 'slug' manquante")
      }
    }
  }

  // Check total record count
  const totalRecords = Object.values(stats).reduce((sum, s) => sum + s.rows, 0)
  if (totalRecords === 0) {
    issues.push("La sauvegarde est vide — aucune donnée à restaurer")
  }

  return { issues, stats, totalRecords, tableCount: Object.values(stats).filter(s => s.rows > 0).length }
}

// ============================================
// Delete all data (full clear)
// ============================================
async function clearAllTables(tx: typeof db) {
  const deleteOps: Record<string, () => Promise<unknown>> = {
    Notification: () => tx.notification.deleteMany(),
    AuditLog: () => tx.auditLog.deleteMany(),
    CleaningTaskItem: () => tx.cleaningTaskItem.deleteMany(),
    CleaningTask: () => tx.cleaningTask.deleteMany(),
    Expense: () => tx.expense.deleteMany(),
    OrderItem: () => tx.orderItem.deleteMany(),
    RestaurantOrder: () => tx.restaurantOrder.deleteMany(),
    Payment: () => tx.payment.deleteMany(),
    InvoiceItem: () => tx.invoiceItem.deleteMany(),
    Invoice: () => tx.invoice.deleteMany(),
    Booking: () => tx.booking.deleteMany(),
    Guest: () => tx.guest.deleteMany(),
    MenuItem: () => tx.menuItem.deleteMany(),
    RoomPrice: () => tx.roomPrice.deleteMany(),
    Amenity: () => tx.amenity.deleteMany(),
    Room: () => tx.room.deleteMany(),
    Role: () => tx.role.deleteMany(),
    GuestHouseSetting: () => tx.guestHouseSetting.deleteMany(),
    User: () => tx.user.deleteMany(),
    GuestHouse: () => tx.guestHouse.deleteMany(),
  }

  const errors: string[] = []

  for (const table of TABLES_DELETE_ORDER) {
    const op = deleteOps[table]
    if (op) {
      try {
        await op()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`${table}: ${msg}`)
        console.error(`[restore] Erreur suppression table ${table}:`, err)
      }
    }
  }

  return errors
}

// ============================================
// Insert all data with skipDuplicates (safe insert)
// ============================================
async function insertAllTables(tables: Record<string, unknown[]>, tx: typeof db) {
  const insertOps: Record<string, (rows: unknown[]) => Promise<unknown>> = {
    GuestHouse: (rows) => tx.guestHouse.createMany({ data: rows as any[], skipDuplicates: true }),
    GuestHouseSetting: (rows) => tx.guestHouseSetting.createMany({ data: rows as any[], skipDuplicates: true }),
    User: (rows) => tx.user.createMany({ data: rows as any[], skipDuplicates: true }),
    Role: (rows) => tx.role.createMany({ data: rows as any[], skipDuplicates: true }),
    Room: (rows) => tx.room.createMany({ data: rows as any[], skipDuplicates: true }),
    RoomPrice: (rows) => tx.roomPrice.createMany({ data: rows as any[], skipDuplicates: true }),
    Amenity: (rows) => tx.amenity.createMany({ data: rows as any[], skipDuplicates: true }),
    Guest: (rows) => tx.guest.createMany({ data: rows as any[], skipDuplicates: true }),
    Booking: (rows) => tx.booking.createMany({ data: rows as any[], skipDuplicates: true }),
    Invoice: (rows) => tx.invoice.createMany({ data: rows as any[], skipDuplicates: true }),
    InvoiceItem: (rows) => tx.invoiceItem.createMany({ data: rows as any[], skipDuplicates: true }),
    Payment: (rows) => tx.payment.createMany({ data: rows as any[], skipDuplicates: true }),
    MenuItem: (rows) => tx.menuItem.createMany({ data: rows as any[], skipDuplicates: true }),
    RestaurantOrder: (rows) => tx.restaurantOrder.createMany({ data: rows as any[], skipDuplicates: true }),
    OrderItem: (rows) => tx.orderItem.createMany({ data: rows as any[], skipDuplicates: true }),
    Expense: (rows) => tx.expense.createMany({ data: rows as any[], skipDuplicates: true }),
    CleaningTask: (rows) => tx.cleaningTask.createMany({ data: rows as any[], skipDuplicates: true }),
    CleaningTaskItem: (rows) => tx.cleaningTaskItem.createMany({ data: rows as any[], skipDuplicates: true }),
    Notification: (rows) => tx.notification.createMany({ data: rows as any[], skipDuplicates: true }),
    AuditLog: (rows) => tx.auditLog.createMany({ data: rows as any[], skipDuplicates: true }),
  }

  let totalInserted = 0
  let totalExpected = 0
  const details: Record<string, number> = {}
  const errors: string[] = []

  for (const table of TABLES_INSERT_ORDER) {
    const op = insertOps[table]
    const rows = tables[table] || []
    totalExpected += rows.length

    if (!op || rows.length === 0) {
      details[table] = 0
      continue
    }

    try {
      const BATCH_SIZE = 50 // Smaller batches for safety
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
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${table}: ${msg}`)
      console.error(`[restore] Erreur insertion table ${table}:`, err)
      details[table] = 0
    }
  }

  return { totalInserted, totalExpected, details, errors }
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
// POST - Restore from backup (RAW SQL for Backup fetch)
// ============================================
export async function POST(request: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const id = request.nextUrl.searchParams.get("id")
  const guestHouseId = request.nextUrl.searchParams.get("guestHouseId")
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true"

  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 })
  }

  try {
    // Fetch backup using raw SQL — bypasses Prisma model mapping
    const results = await db.$queryRaw<Array<{
      id: string
      label: string | null
      compressedData: string
    }>>`
      SELECT "id", "label", "compressedData"
      FROM "Backup"
      WHERE "id" = ${id}
    `

    if (!results || results.length === 0) {
      return NextResponse.json({ error: "Backup non trouvé" }, { status: 404 })
    }

    const backup = results[0]
    const { tables, version, exportedAt } = parseBackupData(backup.compressedData)

    // ─── DRY RUN MODE: validate without modifying DB ──────────
    if (dryRun) {
      const validation = validateBackupStructure(tables)

      // If guesthouse mode, also validate the filter
      if (guestHouseId) {
        const filtered = filterByGuestHouse(tables, guestHouseId)
        if (filtered.GuestHouse.length === 0) {
          return NextResponse.json({
            success: false,
            dryRun: true,
            error: `La maison d'hôtes ${guestHouseId} n'existe pas dans cette sauvegarde`,
            validation,
          })
        }
        const filteredValidation = validateBackupStructure(filtered)
        return NextResponse.json({
          success: true,
          dryRun: true,
          message: `Validation OK — ${filteredValidation.totalRecords} enregistrements pour cette maison d'hôtes`,
          mode: "guesthouse",
          validation: filteredValidation,
          backupMeta: { label: backup.label, version, exportedAt },
        })
      }

      return NextResponse.json({
        success: validation.issues.length === 0,
        dryRun: true,
        message: validation.issues.length === 0
          ? `Validation OK — ${validation.totalRecords} enregistrements dans ${validation.tableCount} tables`
          : `${validation.issues.length} problème(s) détecté(s)`,
        validation,
        backupMeta: { label: backup.label, version, exportedAt },
      })
    }

    // ─── ACTUAL RESTORE ──────────────────────────────────────

    if (guestHouseId) {
      // ─── Individual guesthouse restore ───────────────────────
      const filteredTables = filterByGuestHouse(tables, guestHouseId)

      if (filteredTables.GuestHouse.length === 0) {
        return NextResponse.json(
          { error: "Cette maison d'hôtes n'existe pas dans cette sauvegarde" },
          { status: 404 }
        )
      }

      // Wrap in transaction for safety
      const result = await db.$transaction(async (tx) => {
        const existingGh = await tx.guestHouse.findUnique({
          where: { id: guestHouseId },
          select: { id: true },
        })

        if (existingGh) {
          await tx.guestHouse.delete({ where: { id: guestHouseId } })
        }

        return insertAllTables(filteredTables, tx)
      })

      const warnings = result.errors.length > 0 ? result.errors : undefined

      return NextResponse.json({
        success: true,
        message: `Maison d'hôtes "${(filteredTables.GuestHouse[0] as any)?.name || guestHouseId}" restaurée`,
        mode: "guesthouse",
        stats: {
          totalInserted: result.totalInserted,
          totalExpected: result.totalExpected,
          details: result.details,
        },
        warnings,
        meta: { backupLabel: backup.label, backupDate: exportedAt, backupVersion: version },
      })
    } else {
      // ─── Full restore (wrapped in transaction) ───────────────
      const result = await db.$transaction(async (tx) => {
        const deleteErrors = await clearAllTables(tx)
        const insertResult = await insertAllTables(tables, tx)
        return { deleteErrors, insertResult }
      })

      const allErrors = [...result.deleteErrors, ...result.insertResult.errors]
      const warnings = allErrors.length > 0 ? allErrors : undefined

      return NextResponse.json({
        success: true,
        message: "Restauration complète terminée",
        mode: "full",
        stats: {
          totalInserted: result.insertResult.totalInserted,
          totalExpected: result.insertResult.totalExpected,
          details: result.insertResult.details,
        },
        warnings,
        meta: { backupLabel: backup.label, backupDate: exportedAt, backupVersion: version },
      })
    }
  } catch (error) {
    console.error("[backup/restore] Error:", error)
    const message = error instanceof Error ? error.message : "Erreur interne du serveur"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
