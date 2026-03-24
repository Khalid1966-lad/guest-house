import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Get a single booking
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

    const booking = await db.booking.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
      include: {
        guest: true,
        room: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Erreur récupération réservation:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// PATCH - Update booking (status, check-in, check-out)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId || !session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { status, actualCheckIn, actualCheckOut } = body

    // Verify booking exists and belongs to user's guest house
    const existingBooking = await db.booking.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingBooking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 })
    }

    // Prepare update data
    const updateData: {
      status?: string
      actualCheckIn?: Date
      actualCheckOut?: Date
      checkedInBy?: string
      checkedOutBy?: string
      cancelledAt?: Date
      cancelledBy?: string
    } = {}

    if (status) {
      updateData.status = status

      // Handle check-in
      if (status === "checked_in") {
        updateData.actualCheckIn = actualCheckIn ? new Date(actualCheckIn) : new Date()
        updateData.checkedInBy = session.user.id

        // Update room status
        await db.room.update({
          where: { id: existingBooking.roomId },
          data: { status: "occupied" },
        })
      }

      // Handle check-out
      if (status === "checked_out") {
        updateData.actualCheckOut = actualCheckOut ? new Date(actualCheckOut) : new Date()
        updateData.checkedOutBy = session.user.id

        // Update room status
        await db.room.update({
          where: { id: existingBooking.roomId },
          data: { status: "available" },
        })
      }

      // Handle cancellation
      if (status === "cancelled") {
        updateData.cancelledAt = new Date()
        updateData.cancelledBy = session.user.id
      }
    }

    // Update booking
    const booking = await db.booking.update({
      where: { id },
      data: updateData,
      include: {
        guest: true,
        room: true,
      },
    })

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Erreur mise à jour réservation:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// DELETE - Cancel a booking
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

    // Verify booking exists
    const existingBooking = await db.booking.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingBooking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 })
    }

    // Cancel instead of delete (keep for records)
    const booking = await db.booking.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: session.user.id,
      },
    })

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Erreur suppression réservation:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
