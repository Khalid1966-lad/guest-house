import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import zlib from "zlib"
import { createId } from "@paralleldrive/cuid2"
import { getBackupConfig, toModelName, DEPENDENCIES } from "@/lib/backup-models"

// Force dynamic rendering (no caching)
export const dynamic = "force-dynamic"
// Vercel: max allowed on Hobby=10s, Pro=60s
export const maxDuration = 60

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
  const config = getBackupConfig(db)
  const issues: string[] = []
  const stats: Record<string, { rows: number; columns: number }> = {}

  for (const modelName of config.insertOrder) {
    const rows = tables[modelName] || []
    const columns = rows.length > 0 ? Object.keys(rows[0] as object).length : 0

    stats[modelName] = { rows: rows.length, columns }

    if (rows.length > 0 && columns === 0) {
      issues.push(`${modelName}: ${rows.length} lignes mais aucune colonne détectée`)
    }
  }

  // Check for tables in backup that don't exist in current schema (new since backup)
  const backupTables = Object.keys(tables).filter(k => tables[k]?.length > 0)
  const currentTables = new Set(config.insertOrder)
  const newTables = backupTables.filter(t => !currentTables.has(t))
  if (newTables.length > 0) {
    issues.push(`Tables dans la sauvegarde mais pas dans le schéma actuel: ${newTables.join(", ")} (elles seront ignorées à la restauration)`)
  }

  // Check for tables in current schema that aren't in backup
  const missingTables = config.insertOrder.filter(t => !backupTables.includes(t) && (tables[t]?.length ?? 0) === 0)
  if (missingTables.length > 0) {
    issues.push(`Tables manquantes dans la sauvegarde: ${missingTables.join(", ")} (elles resteront vides)`)
  }

  const totalRecords = Object.values(stats).reduce((sum, s) => sum + s.rows, 0)
  if (totalRecords === 0) {
    issues.push("La sauvegarde est vide — aucune donnée à restaurer")
  }

  return { issues, stats, totalRecords, tableCount: Object.values(stats).filter(s => s.rows > 0).length }
}

// ============================================
// Export current DB state as safety backup (dynamic)
// ============================================
async function createSafetyBackup(userId: string): Promise<string> {
  const config = getBackupConfig(db)
  const tables: Record<string, unknown[]> = {}
  const tableSummary: Record<string, number> = {}
  let guestHouseList: { id: string; name: string; slug: string }[] = []

  for (const modelName of config.insertOrder) {
    const dbKey = toModelName(modelName) as keyof typeof db
    const modelClient = db[dbKey]
    if (!modelClient || typeof modelClient.findMany !== "function") continue

    try {
      const rows = await modelClient.findMany()
      tables[modelName] = rows
      tableSummary[modelName] = rows.length
      if (modelName === "GuestHouse") {
        guestHouseList = (rows as any[]).map(r => ({ id: r.id, name: r.name, slug: r.slug }))
      }
    } catch {
      tables[modelName] = []
      tableSummary[modelName] = 0
    }
  }

  const payload = JSON.stringify({
    version: "safety",
    exportedAt: new Date().toISOString(),
    safetyOf: "pre-restore",
    tables,
  })

  const compressed = zlib.gzipSync(Buffer.from(payload))
  const compressedBase64 = compressed.toString("base64")
  const sizeKo = Math.round(Buffer.byteLength(compressedBase64, "base64") / 1024)
  const id = createId()

  await db.$executeRaw`
    INSERT INTO "Backup" ("id", "label", "type", "compressedData", "sizeKo", "tableCount", "tableSummary", "guestHouseList", "createdBy", "createdAt")
    VALUES (${id}, ${'[SAFETY] Avant restauration'}, ${'auto'}, ${compressedBase64}, ${sizeKo}, ${config.insertOrder.length}, ${JSON.stringify(tableSummary)}, ${JSON.stringify(guestHouseList)}, ${userId}, NOW())
  `

  return id
}

// ============================================
// Delete all data (sequential, no transaction)
// ============================================
async function clearAllTables() {
  const config = getBackupConfig(db)
  const errors: string[] = []

  for (const modelName of config.deleteOrder) {
    const dbKey = toModelName(modelName) as keyof typeof db
    const modelClient = db[dbKey]
    if (!modelClient || typeof modelClient.deleteMany !== "function") continue

    try {
      await modelClient.deleteMany()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${modelName}: ${msg}`)
      console.error(`[restore] Erreur suppression table ${modelName}:`, err)
    }
  }

  return errors
}

// ============================================
// Insert all data (sequential, skipDuplicates, dynamic)
// ============================================
async function insertAllTables(tables: Record<string, unknown[]>) {
  const config = getBackupConfig(db)
  let totalInserted = 0
  let totalExpected = 0
  const details: Record<string, number> = {}
  const errors: string[] = []

  for (const modelName of config.insertOrder) {
    const rows = tables[modelName] || []
    totalExpected += rows.length

    if (rows.length === 0) {
      details[modelName] = 0
      continue
    }

    const dbKey = toModelName(modelName) as keyof typeof db
    const modelClient = db[dbKey]
    if (!modelClient || typeof modelClient.createMany !== "function") {
      details[modelName] = 0
      continue
    }

    try {
      const BATCH_SIZE = 50
      let inserted = 0
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE)
        const result = await modelClient.createMany({ data: batch as any[], skipDuplicates: true })
        inserted += result.count
      }
      details[modelName] = inserted
      totalInserted += inserted
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${modelName}: ${msg}`)
      console.error(`[restore] Erreur insertion table ${modelName}:`, err)
      details[modelName] = 0
    }
  }

  return { totalInserted, totalExpected, details, errors }
}

// ============================================
// Filter tables by guestHouseId (dynamic with DEPENDENCIES)
// ============================================
function filterByGuestHouse(
  tables: Record<string, unknown[]>,
  guestHouseId: string
): Record<string, unknown[]> {
  const filtered: Record<string, unknown[]> = {}

  // First pass: collect all top-level IDs with guestHouseId
  const guestHouseRow = (tables.GuestHouse || []).find((r: any) => r.id === guestHouseId)
  if (!guestHouseRow) return filtered

  filtered.GuestHouse = [guestHouseRow]

  // Collect referenced IDs for cascading
  const roomIds = new Set<string>()
  const guestIds = new Set<string>()
  const invoiceIds = new Set<string>()
  const orderIds = new Set<string>()
  const taskIds = new Set<string>()
  const menuItemIds = new Set<string>()

  // Dynamic filter: check if table has guestHouseId or cascading FK
  const collect = (modelName: string, rows: any[]) => {
    const deps = DEPENDENCIES[modelName]
    if (!deps) return rows

    for (const row of rows) {
      // Keep rows that belong to this guesthouse
      if (row.guestHouseId === guestHouseId) {
        if (modelName === "Room") roomIds.add(row.id)
        if (modelName === "Guest") guestIds.add(row.id)
        if (modelName === "Invoice") invoiceIds.add(row.id)
        if (modelName === "RestaurantOrder") orderIds.add(row.id)
        if (modelName === "CleaningTask") taskIds.add(row.id)
        if (modelName === "MenuItem") menuItemIds.add(row.id)
        return true
      }
      // Keep rows that reference a collected FK
      if (roomIds.has(row.roomId)) return true
      if (guestIds.has(row.guestId)) return true
      if (invoiceIds.has(row.invoiceId)) return true
      if (orderIds.has(row.orderId)) return true
      if (taskIds.has(row.taskId)) return true
      if (menuItemIds.has(row.menuItemId)) return true
      if (deps.has("GuestHouse") && row.guestHouseId === guestHouseId) return true
    }

    return rows.filter(() => false) // no match
  }

  const config = getBackupConfig(db)
  for (const modelName of config.insertOrder) {
    if (modelName === "GuestHouse") continue // already handled
    const rows = tables[modelName] || []
    const deps = DEPENDENCIES[modelName]

    if (!deps || !deps.has("GuestHouse")) {
      // Table without guestHouseId FK — skip for guesthouse restore
      filtered[modelName] = []
      continue
    }

    const matched: any[] = []
    for (const row of rows) {
      if (row.guestHouseId === guestHouseId) {
        if (modelName === "Room") roomIds.add(row.id)
        if (modelName === "Guest") guestIds.add(row.id)
        if (modelName === "Invoice") invoiceIds.add(row.id)
        if (modelName === "RestaurantOrder") orderIds.add(row.id)
        if (modelName === "CleaningTask") taskIds.add(row.id)
        if (modelName === "MenuItem") menuItemIds.add(row.id)
        matched.push(row)
        continue
      }

      // Check cascading FKs
      if (modelName === "RoomPrice" && roomIds.has(row.roomId)) { matched.push(row); continue }
      if (modelName === "InvoiceItem" && invoiceIds.has(row.invoiceId)) { matched.push(row); continue }
      if (modelName === "OrderItem" && orderIds.has(row.orderId)) { matched.push(row); continue }
      if (modelName === "CleaningTaskItem" && taskIds.has(row.taskId)) { matched.push(row); continue }
    }

    filtered[modelName] = matched
  }

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
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true"

  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 })
  }

  try {
    // Fetch backup using raw SQL
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

    // ─── DRY RUN MODE ──────────────────────────────────────────
    if (dryRun) {
      const validation = validateBackupStructure(tables)

      if (guestHouseId) {
        const filtered = filterByGuestHouse(tables, guestHouseId)
        if (filtered.GuestHouse?.length !== 1) {
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
      // ─── Guesthouse restore (small — transaction OK) ─
      const filteredTables = filterByGuestHouse(tables, guestHouseId)

      if (filteredTables.GuestHouse?.length !== 1) {
        return NextResponse.json(
          { error: "Cette maison d'hôtes n'existe pas dans cette sauvegarde" },
          { status: 404 }
        )
      }

      const result = await db.$transaction(async (tx) => {
        // Delete existing guesthouse and cascade
        try {
          await tx.guestHouse.delete({ where: { id: guestHouseId } })
        } catch {
          // Might not exist — that's OK
        }

        // Insert filtered data using transaction client
        const config = getBackupConfig(tx)
        let totalInserted = 0
        let totalExpected = 0
        const details: Record<string, number> = {}
        const errors: string[] = []

        for (const modelName of config.insertOrder) {
          const rows = filteredTables[modelName] || []
          totalExpected += rows.length
          if (rows.length === 0) { details[modelName] = 0; continue }

          const dbKey = toModelName(modelName) as keyof typeof tx
          const modelClient = tx[dbKey]
          if (!modelClient || typeof modelClient.createMany !== "function") {
            details[modelName] = 0; continue
          }

          try {
            const res = await modelClient.createMany({ data: rows as any[], skipDuplicates: true })
            details[modelName] = res.count
            totalInserted += res.count
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            errors.push(`${modelName}: ${msg}`)
            details[modelName] = 0
          }
        }

        return { totalInserted, totalExpected, details, errors }
      }, { timeout: 60_000 })

      return NextResponse.json({
        success: true,
        message: `Maison d'hôtes "${(filteredTables.GuestHouse[0] as any)?.name || guestHouseId}" restaurée`,
        mode: "guesthouse",
        stats: { totalInserted: result.totalInserted, totalExpected: result.totalExpected, details: result.details },
        warnings: result.errors.length > 0 ? result.errors : undefined,
        meta: { backupLabel: backup.label, backupDate: exportedAt, backupVersion: version },
      })
    } else {
      // ─── Full restore (NO transaction — sequential) ─
      // Step 1: Safety backup
      let safetyBackupId: string | null = null
      try {
        safetyBackupId = await createSafetyBackup(user.id)
        console.log(`[restore] Safety backup created: ${safetyBackupId}`)
      } catch (err) {
        console.error("[restore] Failed to create safety backup:", err)
      }

      // Step 2: Clear all tables
      const deleteErrors = await clearAllTables()

      // Step 3: Insert all data
      const insertResult = await insertAllTables(tables)

      const allErrors = [...deleteErrors, ...insertResult.errors]
      const isPartial = insertResult.totalInserted < insertResult.totalExpected

      return NextResponse.json({
        success: true,
        message: isPartial
          ? `Restauration partielle — ${insertResult.totalInserted}/${insertResult.totalExpected} enregistrements insérés`
          : "Restauration complète terminée",
        mode: "full",
        stats: { totalInserted: insertResult.totalInserted, totalExpected: insertResult.totalExpected, details: insertResult.details },
        warnings: allErrors.length > 0 ? allErrors : undefined,
        safetyBackupId,
        safetyNote: safetyBackupId
          ? "Sauvegarde de sécurité créée avant la restauration. En cas de problème, restaurez cette sauvegarde pour revenir en arrière."
          : "Impossible de créer la sauvegarde de sécurité.",
        meta: { backupLabel: backup.label, backupDate: exportedAt, backupVersion: version },
      })
    }
  } catch (error) {
    console.error("[backup/restore] Error:", error)
    const message = error instanceof Error ? error.message : "Erreur interne du serveur"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
