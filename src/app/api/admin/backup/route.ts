import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import zlib from "zlib"
import { createId } from "@paralleldrive/cuid2"
import { getBackupConfig, toModelName } from "@/lib/backup-models"
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
// Export all data using dynamic Prisma queries
// ============================================
async function exportAllData() {
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
      tables[modelName] = rows as unknown[]
      tableSummary[modelName] = rows.length

      if (modelName === "GuestHouse") {
        guestHouseList = (rows as any[]).map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
        }))
      }
    } catch (err) {
      console.error(`Erreur export table ${modelName}:`, err)
      tables[modelName] = []
      tableSummary[modelName] = 0
    }
  }

  return { tables, tableSummary, guestHouseList, tableCount: config.insertOrder.length }
}

// ============================================
// GET - List all backups (RAW SQL)
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

    // Export all data (dynamic — picks up new tables automatically)
    const { tables, tableSummary, guestHouseList, tableCount } = await exportAllData()

    // Build backup payload
    const payload = {
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      tables,
      meta: { tableSummary, guestHouseList },
    }

    // Compress with gzip → base64
    const jsonString = JSON.stringify(payload)
    const compressed = zlib.gzipSync(Buffer.from(jsonString))
    const compressedBase64 = compressed.toString("base64")
    const sizeKo = Math.round(Buffer.byteLength(compressedBase64, "base64") / 1024)

    // Generate ID
    const id = createId()

    // Insert using raw SQL
    await db.$executeRaw`
      INSERT INTO "Backup" ("id", "label", "type", "compressedData", "sizeKo", "tableCount", "tableSummary", "guestHouseList", "createdBy", "createdAt")
      VALUES (${id}, ${label || null}, ${type}, ${compressedBase64}, ${sizeKo}, ${tableCount}, ${JSON.stringify(tableSummary)}, ${JSON.stringify(guestHouseList)}, ${user.id}, NOW())
    `

    // Auto cleanup: keep max 7 auto backups
    if (type === "auto") {
      const autoBackups = await db.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Backup" WHERE "type" = 'auto' ORDER BY "createdAt" DESC
      `
      if (autoBackups.length > 7) {
        const toDeleteIds = autoBackups.slice(7)
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
        tableCount,
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
