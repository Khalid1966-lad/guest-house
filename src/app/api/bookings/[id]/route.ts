import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifyCheckIn, notifyCheckOut, notifyBookingCancelled } from "@/lib/notifications"
import { autoAssignCleaning } from "@/lib/housekeeping-assign"

/**
 * Helper: compute the correct room status based on remaining active bookings.
 * Returns "reserved" if there are confirmed/pending bookings, "occupied" if checked_in, else "available".
 */
async function recomputeRoomStatus(roomId: string, guestHouseId: string): Promise<string> {
  const activeBookings = await db.booking.findMany({
    where: {
      roomId,
      guestHouseId,
      status: { in: ["confirmed", "checked_in", "pending"] },
    },
    select: { status: true },
  })

  if (activeBookings.length === 0) return "available"

  const hasCheckedIn = activeBookings.some((b) => b.status === "checked_in")
  if (hasCheckedIn) return "occupied"

  return "reserved"
}

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
        occupants: {
          orderBy: [{ isMainBooker: "desc" }, { createdAt: "asc" }],
        },
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
        status: { notIn: ["cancelled", "no_show", "checked_out"] },
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

    // Variable to hold housekeeping warning for the response
    let housekeepingWarning: string | null = null

    if (status) {
      updateData.status = status

      if (status === "checked_in") {
        updateData.actualCheckIn = new Date()
        updateData.checkedInBy = session.user.id

        // Update room status to occupied
        await db.room.update({
          where: { id: existingBooking.roomId },
          data: { status: "occupied" },
        })

        // Reset cleaning status on check-in (non-blocking)
        try {
          await db.room.update({
            where: { id: existingBooking.roomId },
            data: {
              cleaningStatus: null,
              cleaningUpdatedAt: null,
            },
          })
        } catch (cleaningErr) {
          console.warn("[checkin] Could not reset cleaningStatus:", (cleaningErr as Error).message)
        }
      }

      if (status === "checked_out") {
        updateData.actualCheckOut = new Date()
        updateData.checkedOutBy = session.user.id

        // Recompute room status (may stay reserved if other bookings exist)
        const newRoomStatus = await recomputeRoomStatus(
          existingBooking.roomId,
          session.user.guestHouseId
        )

        await db.room.update({
          where: { id: existingBooking.roomId },
          data: { status: newRoomStatus },
        })

        // Update cleaning status (non-blocking)
        try {
          await db.room.update({
            where: { id: existingBooking.roomId },
            data: {
              cleaningStatus: "departure",
              cleaningUpdatedAt: new Date(),
            },
          })
        } catch (cleaningErr) {
          console.warn("[checkout] Could not set cleaningStatus:", (cleaningErr as Error).message)
        }

        // Auto-assign housekeeping task
        try {
          const assignResult = await autoAssignCleaning(existingBooking.roomId, session.user.guestHouseId)
          if (assignResult.unassigned && assignResult.warning) {
            housekeepingWarning = assignResult.warning
          }
        } catch (err) {
          console.warn("[checkout] Auto-assign housekeeping failed:", err)
        }
      }

      if (status === "cancelled") {
        updateData.cancelledAt = new Date()
        updateData.cancelledBy = session.user.id

        // Recompute room status (free the room if no other active bookings)
        const newRoomStatus = await recomputeRoomStatus(
          existingBooking.roomId,
          session.user.guestHouseId
        )

        await db.room.update({
          where: { id: existingBooking.roomId },
          data: { status: newRoomStatus },
        })
      }

      if (status === "no_show") {
        // Recompute room status (free the room if no other active bookings)
        const newRoomStatus = await recomputeRoomStatus(
          existingBooking.roomId,
          session.user.guestHouseId
        )

        await db.room.update({
          where: { id: existingBooking.roomId },
          data: { status: newRoomStatus },
        })
      }

      if (status === "confirmed") {
        // When a pending booking is confirmed, set room to reserved
        await db.room.update({
          where: { id: existingBooking.roomId },
          data: { status: "reserved" },
        })
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

    // Trigger notifications based on status change (fire-and-forget)
    const guestName = `${booking.guest.firstName} ${booking.guest.lastName}`
    const roomNumber = booking.room.number
    const notifParams = {
      guestHouseId: session.user.guestHouseId,
      userId: session.user.id,
      bookingId: booking.id,
    }

    if (status === "checked_in") {
      notifyCheckIn({ ...notifParams, guestName, roomNumber }).catch(console.error)
    } else if (status === "checked_out") {
      notifyCheckOut({ ...notifParams, guestName, roomNumber }).catch(console.error)
    } else if (status === "cancelled") {
      notifyBookingCancelled({ ...notifParams, guestName, roomNumber, reason: body.reason }).catch(console.error)
    }

    return NextResponse.json({ booking, housekeepingWarning })
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

    // Recompute room status after deletion (free the room if no other active bookings)
    const newRoomStatus = await recomputeRoomStatus(
      existingBooking.roomId,
      session.user.guestHouseId
    )

    await db.room.update({
      where: { id: existingBooking.roomId },
      data: { status: newRoomStatus },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression réservation:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
