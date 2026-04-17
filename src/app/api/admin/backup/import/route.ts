import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import zlib from "zlib"
import { createId } from "@paralleldrive/cuid2"

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
    console.error("Erreur session backup import:", error)
    return null
  }
}

// ============================================
// POST - Import a backup from uploaded .json.gz file (RAW SQL for Backup insert)
// ============================================
export async function POST(request: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const label = formData.get("label") as string | null

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
    }

    // Check file type
    if (!file.name.endsWith(".json.gz") && !file.name.endsWith(".gz")) {
      return NextResponse.json(
        { error: "Le fichier doit être un .json.gz" },
        { status: 400 }
      )
    }

    // Check file size (max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas dépasser 50 Mo" },
        { status: 400 }
      )
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Try to decompress gzip
    let jsonString: string
    try {
      jsonString = zlib.gunzipSync(buffer).toString("utf-8")
    } catch {
      // Maybe it's not gzipped, try plain JSON
      try {
        jsonString = buffer.toString("utf-8")
        JSON.parse(jsonString) // validate it's JSON
      } catch {
        return NextResponse.json(
          { error: "Fichier invalide: impossible de lire les données" },
          { status: 400 }
        )
      }
    }

    // Parse and validate JSON structure
    const payload = JSON.parse(jsonString)

    if (!payload.tables || typeof payload.tables !== "object") {
      return NextResponse.json(
        { error: "Structure de sauvegarde invalide: 'tables' manquant" },
        { status: 400 }
      )
    }

    // Build table summary
    const tableSummary: Record<string, number> = {}
    let guestHouseList: { id: string; name: string; slug: string }[] = []

    const tables = payload.tables as Record<string, unknown[]>
    for (const [tableName, rows] of Object.entries(tables)) {
      tableSummary[tableName] = Array.isArray(rows) ? rows.length : 0
    }

    // Extract guesthouse list
    if (tables.GuestHouse && Array.isArray(tables.GuestHouse)) {
      guestHouseList = tables.GuestHouse.map((r: any) => ({
        id: r.id,
        name: r.name || "Sans nom",
        slug: r.slug || "",
      }))
    }

    // Compress back to gzip base64 for storage
    const compressedBuffer = zlib.gzipSync(Buffer.from(jsonString))
    const compressedBase64 = compressedBuffer.toString("base64")
    const sizeKo = Math.round(buffer.length / 1024)

    // Count non-empty tables
    const tableCount = Object.values(tableSummary).filter((c) => c > 0).length

    // Generate ID and insert using raw SQL
    const id = createId()

    await db.$executeRaw`
      INSERT INTO "Backup" ("id", "label", "type", "compressedData", "sizeKo", "tableCount", "tableSummary", "guestHouseList", "createdBy", "createdAt")
      VALUES (${id}, ${label || `Import: ${file.name}`}, ${'manual'}, ${compressedBase64}, ${sizeKo}, ${tableCount}, ${JSON.stringify(tableSummary)}, ${JSON.stringify(guestHouseList)}, ${user.id}, NOW())
    `

    return NextResponse.json({
      success: true,
      message: "Sauvegarde importée avec succès",
      backup: {
        id,
        label: label || `Import: ${file.name}`,
        type: "manual",
        sizeKo,
        tableCount,
        tableSummary,
        guestHouseList,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      },
      meta: {
        originalFilename: file.name,
        originalSizeKo: Math.round(file.size / 1024),
        backupVersion: payload.version || "inconnu",
        exportedAt: payload.exportedAt || null,
      },
    })
  } catch (error) {
    console.error("Erreur import backup:", error)
    return NextResponse.json(
      { error: `Erreur lors de l'import: ${error instanceof Error ? error.message : "Erreur interne"}` },
      { status: 500 }
    )
  }
}
