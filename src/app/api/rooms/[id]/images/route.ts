import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// PATCH - Remove a specific room image by index, or reorder images
// Body: { action: "remove", index: number } or { action: "reorder", images: string[] }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { action, index, images } = body

    // Verify room belongs to guesthouse
    const room = await db.room.findFirst({
      where: { id, guestHouseId: session.user.guestHouseId },
      select: { images: true },
    })

    if (!room) {
      return NextResponse.json({ error: "Chambre non trouvée" }, { status: 404 })
    }

    const currentImages: string[] = room.images ? JSON.parse(room.images) : []

    if (action === "remove") {
      if (typeof index !== "number" || index < 0 || index >= currentImages.length) {
        return NextResponse.json({ error: "Index d'image invalide" }, { status: 400 })
      }
      const updatedImages = currentImages.filter((_, i) => i !== index)
      await db.room.update({
        where: { id },
        data: { images: updatedImages.length > 0 ? JSON.stringify(updatedImages) : null },
      })
      return NextResponse.json({
        success: true,
        images: updatedImages,
        message: "Image supprimée",
      })
    }

    if (action === "reorder") {
      if (!Array.isArray(images)) {
        return NextResponse.json({ error: "Images invalides" }, { status: 400 })
      }
      await db.room.update({
        where: { id },
        data: { images: images.length > 0 ? JSON.stringify(images) : null },
      })
      return NextResponse.json({
        success: true,
        images,
        message: "Images réordonnées",
      })
    }

    return NextResponse.json({ error: "Action non valide" }, { status: 400 })
  } catch (error) {
    console.error("Erreur gestion images chambre:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
