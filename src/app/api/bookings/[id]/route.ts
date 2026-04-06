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

// PUT - Full update of a booking
export async function PUT(
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
    const {
      guestId,
      firstName,
      lastName,
      email,
      phone,
      roomId,
      checkIn,
      checkOut,
      adults,
      children,
      nightlyRate,
      totalPrice,
      source,
      guestNotes,
    } = body

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

    // Validate dates
    if (new Date(checkIn) >= new Date(checkOut)) {
      return NextResponse.json(
        { error: "La date de départ doit être après la date d'arrivée" },
        { status: 400 }
      )
    }

    // Check for conflicts with other bookings (excluding current one)
    const conflictingBooking = await db.booking.findFirst({
      where: {
        id: { not: id },
        roomId,
        guestHouseId: session.user.guestHouseId,
        status: { notIn: ["cancelled", "no_show"] },
        OR: [
          {
            checkIn: { lt: new Date(checkOut) },
            checkOut: { gt: new Date(checkIn) },
          },
        ],
      },
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { error: "Cette chambre n'est pas disponible pour ces dates" },
        { status: 400 }
      )
    }

    // Handle guest
    let finalGuestId = guestId

    if (!finalGuestId && firstName && lastName) {
      // Check if guest with same email exists
      if (email) {
        const existingGuest = await db.guest.findFirst({
          where: {
            guestHouseId: session.user.guestHouseId,
            email,
          },
        })
        if (existingGuest) {
          finalGuestId = existingGuest.id
        }
      }

      // Create new guest if needed
      if (!finalGuestId) {
        const newGuest = await db.guest.create({
          data: {
            guestHouseId: session.user.guestHouseId,
            firstName,
            lastName,
            email: email || null,
            phone: phone || null,
          },
        })
        finalGuestId = newGuest.id
      }
    }

    if (!finalGuestId) {
      return NextResponse.json(
        { error: "Informations client requises" },
        { status: 400 }
      )
    }

    // Update booking
    const booking = await db.booking.update({
      where: { id },
      data: {
        guestId: finalGuestId,
        roomId,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        adults: parseInt(adults) || 1,
        children: parseInt(children) || 0,
        nightlyRate: parseFloat(nightlyRate) || 0,
        totalPrice: parseFloat(totalPrice) || 0,
        grandTotal: parseFloat(totalPrice) || 0,
        source: source || "direct",
        guestNotes: guestNotes || null,
      },
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

// PATCH - Update booking status (check-in, check-out, cancel)
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
    const { status } = body

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

      if (status === "checked_in") {
        updateData.actualCheckIn = new Date()
        updateData.checkedInBy = session.user.id

        await db.room.update({
          where: { id: existingBooking.roomId },
          data: { status: "occupied" },
        })
      }

      if (status === "checked_out") {
        updateData.actualCheckOut = new Date()
        updateData.checkedOutBy = session.user.id

        await db.room.update({
          where: { id: existingBooking.roomId },
          data: { status: "available" },
        })
      }

      if (status === "cancelled") {
        updateData.cancelledAt = new Date()
        updateData.cancelledBy = session.user.id
      }
    }

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

// DELETE - Delete a booking
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

    // Actually delete the booking
    await db.booking.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression réservation:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
