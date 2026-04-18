import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { toModelName, getBackupConfig } from "@/lib/backup-models"
import { createId } from "@paralleldrive/cuid2"
import zlib from "zlib"
import { APP_VERSION } from "@/lib/version"

export const dynamic = "force-dynamic"
// Vercel: allow up to 300s for large DB backup exports
export const maxDuration = 300

export async function POST(request: Request) {
  // Auth via shared secret
  // 1. BACKUP_CRON_SECRET: our custom secret (for manual/testing calls)
  // 2. CRON_SECRET: Vercel Cron's built-in secret (MUST be set in Vercel env vars)
  const authHeader = request.headers.get("authorization")
  const backupSecret = process.env.BACKUP_CRON_SECRET
  const vercelCronSecret = process.env.CRON_SECRET

  const isValid =
    (backupSecret && authHeader === `Bearer ${backupSecret}`) ||
    (vercelCronSecret && authHeader === `Bearer ${vercelCronSecret}`)

  if (!isValid) {
    console.warn("[cron-backup] Auth failed — CRON_SECRET or BACKUP_CRON_SECRET not configured or mismatch")
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const startTime = Date.now()

  try {
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
          guestHouseList = (rows as any[]).map((r) => ({ id: r.id, name: r.name, slug: r.slug }))
        }
      } catch (err) {
        console.error(`[cron-backup] Error exporting ${modelName}:`, err)
        tables[modelName] = []
        tableSummary[modelName] = 0
      }
    }

    const payload = JSON.stringify({
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      tables,
      meta: { tableSummary, guestHouseList },
    })

    const compressed = zlib.gzipSync(Buffer.from(payload))
    const compressedBase64 = compressed.toString("base64")
    const sizeKo = Math.round(Buffer.byteLength(compressedBase64, "base64") / 1024)
    const id = createId()

    // Insert using raw SQL
    await db.$executeRaw`
      INSERT INTO "Backup" ("id", "label", "type", "compressedData", "sizeKo", "tableCount", "tableSummary", "guestHouseList", "createdBy", "createdAt")
      VALUES (${id}, ${'Sauvegarde automatique quotidienne'}, ${'auto'}, ${compressedBase64}, ${sizeKo}, ${config.insertOrder.length}, ${JSON.stringify(tableSummary)}, ${JSON.stringify(guestHouseList)}, ${'system'}, NOW())
    `

    // Cleanup: keep only last 7 auto backups
    const autoBackups = await db.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Backup" WHERE "type" = 'auto' ORDER BY "createdAt" DESC
    `
    if (autoBackups.length > 7) {
      const toDelete = autoBackups.slice(7)
      for (const b of toDelete) {
        await db.$executeRaw`DELETE FROM "Backup" WHERE "id" = ${b.id}`
      }
    }

    const duration = Date.now() - startTime
    const totalRecords = Object.values(tableSummary).reduce((a, b) => a + b, 0)
    console.log(`[cron-backup] ✅ Auto backup created in ${duration}ms: ${id} (${sizeKo} Ko, ${config.insertOrder.length} tables, ${totalRecords} records)`)

    return NextResponse.json({
      success: true,
      id,
      sizeKo,
      tableCount: config.insertOrder.length,
      totalRecords,
      durationMs: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[cron-backup] ❌ Error after ${duration}ms:`, error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
