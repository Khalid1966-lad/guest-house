import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Force dynamic rendering (no caching)
export const dynamic = "force-dynamic"
// Vercel: allow up to 300s for backup operations
export const maxDuration = 300

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
    console.error("[backup/download] Session error:", error)
    return null
  }
}

// ============================================
// GET - Download a backup as .json.gz file (RAW SQL)
// ============================================
export async function GET(request: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const id = request.nextUrl.searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 })
  }

  try {
    // Use raw SQL to fetch backup — bypasses Prisma model mapping
    const results = await db.$queryRaw<Array<{
      id: string
      label: string | null
      compressedData: string
      createdAt: Date
    }>>`
      SELECT "id", "label", "compressedData", "createdAt"
      FROM "Backup"
      WHERE "id" = ${id}
    `

    if (!results || results.length === 0) {
      console.error(`[backup/download] Backup not found for id: ${id}`)
      return NextResponse.json({ 
        error: `Sauvegarde introuvable (id: ${id})`,
        hint: "La sauvegarde n'existe pas ou la table Backup n'est pas accessible.",
      }, { status: 404 })
    }

    const backup = results[0]
    const compressedBuffer = Buffer.from(backup.compressedData, "base64")

    const timestamp = new Date(backup.createdAt).toISOString().replace(/[:.]/g, "-")
    const label = (backup.label || "sauvegarde").replace(/[^a-zA-Z0-9-_]/g, "_")
    const filename = `pms-backup-${label}-${timestamp}.json.gz`

    return new NextResponse(compressedBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": compressedBuffer.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  } catch (error) {
    console.error("[backup/download] Error:", error)
    const message = error instanceof Error ? error.message : "Erreur interne du serveur"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
