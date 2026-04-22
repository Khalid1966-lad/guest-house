import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

// PATCH - Remove image from a service
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    const { id } = await params

    // Ownership check
    const service = await db.service.findFirst({
      where: { id, guestHouseId: session.user.guestHouseId },
      select: { id: true },
    })

    if (!service) {
      return NextResponse.json({ error: "Service non trouvé" }, { status: 404 })
    }

    const updatedService = await db.service.update({
      where: { id },
      data: { image: null },
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error("Erreur suppression image service:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'image" },
      { status: 500 }
    )
  }
}
