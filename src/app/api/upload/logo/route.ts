import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { compressImage, compressToDataUrl, formatBytes, isValidImageType, convertGifToStatic } from "@/lib/image-compress"

// POST - Upload guesthouse logo (with automatic compression)
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
    if (!isValidImageType(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF." },
        { status: 400 }
      )
    }

    // Max input size: 10MB (we'll compress it down)
    const maxInputSize = 10 * 1024 * 1024
    if (file.size > maxInputSize) {
      return NextResponse.json(
        { error: "Fichier trop volumineux. Maximum 10 Mo." },
        { status: 400 }
      )
    }

    // Read file bytes
    const bytes = await file.arrayBuffer()
    const originalSize = bytes.byteLength

    // Handle GIF files - convert to static image
    let imageBuffer = Buffer.from(bytes)
    if (file.type === "image/gif") {
      imageBuffer = await convertGifToStatic(imageBuffer)
    }

    // Compress the image using sharp
    const compressResult = await compressImage(imageBuffer, "logo")
    const dataUrl = compressToDataUrl(compressResult)

    // Save to database
    const guestHouse = await db.guestHouse.update({
      where: { id: session.user.guestHouseId },
      data: { logo: dataUrl },
      select: { logo: true, name: true },
    })

    return NextResponse.json({
      logo: guestHouse.logo,
      message: "Logo mis à jour avec succès",
      compression: {
        originalSize: formatBytes(originalSize),
        compressedSize: formatBytes(compressResult.size),
        compressionRatio: compressResult.compressionRatio,
        dimensions: `${compressResult.width}×${compressResult.height}`,
        format: compressResult.format,
      },
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
