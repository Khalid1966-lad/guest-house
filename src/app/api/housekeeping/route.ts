import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const VALID_CLEANING_STATUSES = ["departure", "turnover", "cleaning", "clean", "verified"]

const ALLOWED_ROLES = ["owner", "admin", "manager", "housekeeping"]

// PATCH - Update room cleaning status
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!session.user.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Check role
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
    }

    const body = await request.json()
    const { roomId, cleaningStatus, cleaningNotes } = body

    if (!roomId) {
      return NextResponse.json({ error: "roomId requis" }, { status: 400 })
    }

    // Validate cleaningStatus: must be one of the valid values or null/undefined (to reset)
    if (cleaningStatus !== null && cleaningStatus !== undefined && !VALID_CLEANING_STATUSES.includes(cleaningStatus)) {
      return NextResponse.json(
        { error: "Statut de nettoyage invalide" },
        { status: 400 }
      )
    }

    // Find the room and verify it belongs to this guesthouse
    const room = await db.room.findFirst({
      where: {
        id: roomId,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!room) {
      return NextResponse.json({ error: "Chambre introuvable" }, { status: 404 })
    }

    // Update the room
    const updatedRoom = await db.room.update({
      where: { id: roomId },
      data: {
        cleaningStatus: cleaningStatus || null,
        cleaningUpdatedAt: cleaningStatus ? new Date() : null,
        cleaningNotes: cleaningNotes !== undefined ? cleaningNotes : room.cleaningNotes,
      },
    })

    return NextResponse.json({ room: updatedRoom })
  } catch (error) {
    console.error("Error updating cleaning status:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    )
  }
}
