import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET - Get a single service booking with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    const { id } = await params

    const booking = await db.serviceBooking.findFirst({
      where: { id, guestHouseId: session.user.guestHouseId },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            image: true,
            category: true,
            priceType: true,
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error("Erreur récupération réservation service:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la réservation" },
      { status: 500 }
    )
  }
}

// PATCH - Update a service booking
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
    const existing = await db.serviceBooking.findFirst({
      where: { id, guestHouseId: session.user.guestHouseId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 })
    }

    const data = await request.json()
    const updateData: Record<string, unknown> = {}

    if (data.status !== undefined) {
      updateData.status = data.status
    }

    if (data.paymentStatus !== undefined) {
      updateData.paymentStatus = data.paymentStatus
    }

    if (data.scheduledDate !== undefined) {
      updateData.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null
    }

    if (data.scheduledTime !== undefined) {
      updateData.scheduledTime = data.scheduledTime || null
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes || null
    }

    // If quantity changes, recalculate totalPrice
    if (data.quantity !== undefined) {
      const quantity = Number(data.quantity)
      if (isNaN(quantity) || quantity < 1) {
        return NextResponse.json(
          { error: "La quantité doit être un nombre entier positif" },
          { status: 400 }
        )
      }
      updateData.quantity = quantity
      updateData.totalPrice = existing.unitPrice * quantity
    }

    const booking = await db.serviceBooking.update({
      where: { id },
      data: updateData,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            image: true,
            category: true,
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error("Erreur mise à jour réservation service:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la réservation" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a service booking (only if pending or cancelled)
export async function DELETE(
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
    const existing = await db.serviceBooking.findFirst({
      where: { id, guestHouseId: session.user.guestHouseId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 })
    }

    // Only allow deletion if status is pending or cancelled
    if (existing.status !== "pending" && existing.status !== "cancelled") {
      return NextResponse.json(
        {
          error: `Impossible de supprimer une réservation avec le statut "${existing.status}". Seules les réservations en attente ou annulées peuvent être supprimées.`,
        },
        { status: 409 }
      )
    }

    await db.serviceBooking.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Réservation supprimée" })
  } catch (error) {
    console.error("Erreur suppression réservation service:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la réservation" },
      { status: 500 }
    )
  }
}
