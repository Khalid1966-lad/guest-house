import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { autoAssignCleaning } from "@/lib/housekeeping-assign"

/**
 * Helper: compute the correct room status based on remaining active bookings.
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

// PATCH - Transfer a booking from one room to another
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
    const { newRoomId, reason } = body

    if (!newRoomId) {
      return NextResponse.json(
        { error: "La nouvelle chambre est requise" },
        { status: 400 }
      )
    }

    // Verify booking exists
    const existingBooking = await db.booking.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
        status: { in: ["confirmed", "checked_in"] },
      },
      include: {
        room: true,
        guest: true,
      },
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Réservation non trouvée ou statut incompatible (seules les réservations confirmées ou en cours peuvent être transférées)" },
        { status: 404 }
      )
    }

    if (existingBooking.roomId === newRoomId) {
      return NextResponse.json(
        { error: "La nouvelle chambre est la même que l'actuelle" },
        { status: 400 }
      )
    }

    // Verify new room belongs to the same guest house
    const newRoom = await db.room.findFirst({
      where: {
        id: newRoomId,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!newRoom) {
      return NextResponse.json(
        { error: "Nouvelle chambre non trouvée" },
        { status: 404 }
      )
    }

    // Check new room availability (excluding current booking)
    const conflictingBooking = await db.booking.findFirst({
      where: {
        id: { not: id },
        roomId: newRoomId,
        guestHouseId: session.user.guestHouseId,
        status: { notIn: ["cancelled", "no_show", "checked_out"] },
        OR: [
          {
            checkIn: { lt: new Date(existingBooking.checkOut) },
            checkOut: { gt: new Date(existingBooking.checkIn) },
          },
        ],
      },
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { error: "La nouvelle chambre n'est pas disponible pour ces dates" },
        { status: 400 }
      )
    }

    const oldRoomId = existingBooking.roomId
    const wasCheckedIn = existingBooking.status === "checked_in"

    // 1. Update the booking's room
    const booking = await db.booking.update({
      where: { id },
      data: {
        roomId: newRoomId,
        notes: existingBooking.notes
          ? `${existingBooking.notes}\n[Transfert] Ch. ${existingBooking.room.number} → Ch. ${newRoom.number}${reason ? ` — ${reason}` : ""}`
          : `[Transfert] Ch. ${existingBooking.room.number} → Ch. ${newRoom.number}${reason ? ` — ${reason}` : ""}`,
      },
      include: {
        guest: true,
        room: true,
      },
    })

    // 2. Free the old room
    const oldRoomStatus = await recomputeRoomStatus(oldRoomId, session.user.guestHouseId)
    const oldRoomUpdate: { status: string; cleaningStatus?: string | null; cleaningUpdatedAt?: Date | null } = {
      status: oldRoomStatus,
    }

    // If the guest was checked in, set cleaning status on old room
    if (wasCheckedIn) {
      try {
        oldRoomUpdate.cleaningStatus = "departure"
        oldRoomUpdate.cleaningUpdatedAt = new Date()
      } catch {
        // ignore
      }
    }

    await db.room.update({
      where: { id: oldRoomId },
      data: oldRoomUpdate,
    })

    // 3. Set new room status
    if (wasCheckedIn) {
      // Guest is physically moving, new room becomes occupied
      await db.room.update({
        where: { id: newRoomId },
        data: {
          status: "occupied",
          cleaningStatus: null,
          cleaningUpdatedAt: null,
        },
      })
    } else {
      // Confirmed booking transfer, new room becomes reserved
      await db.room.update({
        where: { id: newRoomId },
        data: { status: "reserved" },
      })
    }

    // 4. Auto-assign housekeeping for old room if guest was checked in
    let housekeepingWarning: string | null = null
    if (wasCheckedIn) {
      try {
        const assignResult = await autoAssignCleaning(oldRoomId, session.user.guestHouseId)
        if (assignResult.unassigned && assignResult.warning) {
          housekeepingWarning = assignResult.warning
        }
      } catch (err) {
        console.warn("[transfer] Auto-assign housekeeping failed:", err)
      }
    }

    return NextResponse.json({
      booking,
      transfer: {
        fromRoom: existingBooking.room.number,
        toRoom: newRoom.number,
        housekeepingWarning,
      },
    })
  } catch (error) {
    console.error("Erreur transfert réservation:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
