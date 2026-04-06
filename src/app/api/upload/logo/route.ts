import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// POST - Upload guesthouse logo (base64)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!["owner", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("logo") as File | null

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF." },
        { status: 400 }
      )
    }

    // Validate file size (max 500KB)
    const maxSize = 500 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Fichier trop volumineux. Maximum 500 Ko." },
        { status: 400 }
      )
    }

    // Convert to base64 data URL
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    // Save to database
    const guestHouse = await db.guestHouse.update({
      where: { id: session.user.guestHouseId },
      data: { logo: dataUrl },
      select: { logo: true, name: true },
    })

    return NextResponse.json({
      logo: guestHouse.logo,
      message: "Logo mis à jour avec succès",
    })
  } catch (error) {
    console.error("Error uploading logo:", error)
    return NextResponse.json(
      { error: "Erreur lors du téléchargement du logo" },
      { status: 500 }
    )
  }
}

// DELETE - Remove guesthouse logo
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!["owner", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      )
    }

    await db.guestHouse.update({
      where: { id: session.user.guestHouseId },
      data: { logo: null },
    })

    return NextResponse.json({ message: "Logo supprimé" })
  } catch (error) {
    console.error("Error deleting logo:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du logo" },
      { status: 500 }
    )
  }
}
