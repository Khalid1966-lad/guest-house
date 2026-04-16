import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  compressImage,
  compressToDataUrl,
  formatBytes,
  isValidImageType,
  convertGifToStatic,
  type ImageCompressPreset,
} from "@/lib/image-compress"

// POST - Upload and compress a generic image (avatar, receipt, room image, menu item image)
// Expects FormData with:
//   - "image": File (required)
//   - "type": "avatar" | "receipt" | "room" | "menu" | "general" (optional, default: "general")
//   - "target": "user" | "expense" | "room" | "menuItem" (required - what entity to update)
//   - "targetId": string (required - ID of the entity to update)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("image") as File | null
    const imageType = (formData.get("type") as ImageCompressPreset) || "general"
    const target = formData.get("target") as string
    const targetId = formData.get("targetId") as string

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
    }

    if (!target || !targetId) {
      return NextResponse.json(
        { error: "Cible et identifiant requis" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!isValidImageType(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF." },
        { status: 400 }
      )
    }

    // Max input size depends on target type
    // Room images: 500KB max input (compressed to ~100KB)
    // Others: 10MB max input
    const maxInputSize = imageType === "room" ? 500 * 1024 : 10 * 1024 * 1024
    const maxLabel = imageType === "room" ? "500 Ko" : "10 Mo"
    if (file.size > maxInputSize) {
      return NextResponse.json(
        { error: `Fichier trop volumineux. Maximum ${maxLabel}.` },
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

    // Validate preset
    const validPresets: ImageCompressPreset[] = ["logo", "avatar", "room", "receipt", "menu", "general"]
    const preset: ImageCompressPreset = validPresets.includes(imageType) ? imageType : "general"

    // Compress the image using sharp
    const compressResult = await compressImage(imageBuffer, preset)
    const dataUrl = compressToDataUrl(compressResult)

    // Update the appropriate entity
    let updatedEntity: Record<string, unknown> = {}

    switch (target) {
      case "user":
        // Only allow updating own avatar
        if (targetId !== session.user.id && !["owner", "admin"].includes(session.user.role)) {
          return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
        }
        updatedEntity = await db.user.update({
          where: { id: targetId },
          data: { avatar: dataUrl },
          select: { id: true, avatar: true, name: true },
        })
        break

      case "expense":
        updatedEntity = await db.expense.update({
          where: { id: targetId, guestHouseId: session.user.guestHouseId },
          data: { receiptImage: dataUrl },
          select: { id: true, receiptImage: true, description: true },
        })
        break

      case "room":
        // Room images is a JSON field - we append to the existing images array
        const room = await db.room.findFirst({
          where: { id: targetId, guestHouseId: session.user.guestHouseId },
          select: { images: true },
        })
        if (!room) {
          return NextResponse.json({ error: "Chambre non trouvée" }, { status: 404 })
        }
        const existingImages: string[] = room.images ? JSON.parse(room.images) : []
        existingImages.push(dataUrl)
        // Keep max 10 images per room
        const trimmedImages = existingImages.slice(-10)
        updatedEntity = await db.room.update({
          where: { id: targetId },
          data: { images: JSON.stringify(trimmedImages) },
          select: { id: true, images: true, number: true },
        })
        break

      case "menuItem":
        updatedEntity = await db.menuItem.update({
          where: { id: targetId, guestHouseId: session.user.guestHouseId },
          data: { image: dataUrl },
          select: { id: true, image: true, name: true },
        })
        break

      default:
        return NextResponse.json({ error: "Type de cible non valide" }, { status: 400 })
    }

    return NextResponse.json({
      image: dataUrl,
      entity: updatedEntity,
      message: "Image mise à jour avec succès",
      compression: {
        originalSize: formatBytes(originalSize),
        compressedSize: formatBytes(compressResult.size),
        compressionRatio: compressResult.compressionRatio,
        dimensions: `${compressResult.width}×${compressResult.height}`,
        format: compressResult.format,
      },
    })
  } catch (error) {
    console.error("Error uploading image:", error)

    // Handle Prisma record not found
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Enregistrement non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Erreur lors du téléchargement de l'image" },
      { status: 500 }
    )
  }
}
