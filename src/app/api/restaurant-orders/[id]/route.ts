import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Récupérer une commande
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const order = await db.restaurantOrder.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Erreur récupération commande:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// PATCH - Mettre à jour le statut de la commande
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

    const existingOrder = await db.restaurantOrder.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 })
    }

    const body = await request.json()
    const { status, paymentStatus } = body

    const updateData: {
      status?: string
      paymentStatus?: string
      readyAt?: Date
      deliveredAt?: Date
    } = {}

    if (status) {
      updateData.status = status
      if (status === "ready") {
        updateData.readyAt = new Date()
      }
      if (status === "delivered") {
        updateData.deliveredAt = new Date()
      }
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus
    }

    const order = await db.restaurantOrder.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Erreur mise à jour commande:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer une commande
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const existingOrder = await db.restaurantOrder.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 })
    }

    // Supprimer les items d'abord
    await db.orderItem.deleteMany({
      where: { orderId: id },
    })

    // Supprimer la commande
    await db.restaurantOrder.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression commande:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
