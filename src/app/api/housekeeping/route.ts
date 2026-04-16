import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const VALID_CLEANING_STATUSES = ["departure", "turnover", "cleaning", "clean", "verified"]

const ALLOWED_ROLES = [
  "owner",
  "admin",
  "manager",
  "housekeeping",
  "gouvernant",
  "gouvernante",
  "femmeDeMenage",
]

const CAN_VERIFY_ROLES = ["owner", "admin", "manager", "gouvernant", "gouvernante"]

// Helper: auth + role check
async function authenticate(request: Request, requireVerify = false) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }), session: null }
  }

  if (!session.user.guestHouseId) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }), session: null }
  }

  const allowed = requireVerify ? CAN_VERIFY_ROLES : ALLOWED_ROLES
  if (!allowed.includes(session.user.role)) {
    return { error: NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 }), session: null }
  }

  return { error: null, session }
}

// GET - List rooms with their active cleaning tasks and progress
export async function GET() {
  try {
    const { error, session } = await authenticate(
      {} as Request,
      false
    )
    if (error) return error
    if (!session) return error

    const guestHouseId = session.user.guestHouseId

    // Fetch all rooms
    const rooms = await db.room.findMany({
      where: { guestHouseId },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
      include: {
        cleaningTasks: {
          where: {
            status: { in: ["pending", "in_progress", "completed"] },
          },
          orderBy: { createdAt: "desc" },
          include: {
            items: true,
            assignedTo: {
              select: { id: true, name: true, firstName: true, lastName: true },
            },
          },
        },
      },
    })

    // Enrich each room with active task summary
    const roomsWithTasks = rooms.map((room) => {
      const activeTask = room.cleaningTasks[0] || null

      const totalItems = activeTask ? activeTask.items.length : 0
      const checkedItems = activeTask ? activeTask.items.filter((i) => i.checked).length : 0

      return {
        id: room.id,
        number: room.number,
        name: room.name,
        floor: room.floor,
        type: room.type,
        capacity: room.capacity,
        status: room.status,
        cleaningStatus: room.cleaningStatus,
        cleaningUpdatedAt: room.cleaningUpdatedAt,
        cleaningNotes: room.cleaningNotes,
        activeTask: activeTask
          ? {
              id: activeTask.id,
              status: activeTask.status,
              priority: activeTask.priority,
              assignedTo: activeTask.assignedTo,
              startedAt: activeTask.startedAt,
              completedAt: activeTask.completedAt,
              createdAt: activeTask.createdAt,
              progress: { checked: checkedItems, total: totalItems },
            }
          : null,
      }
    })

    return NextResponse.json({ rooms: roomsWithTasks })
  } catch (error) {
    console.error("Error fetching housekeeping data:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    )
  }
}

// PATCH - Update room cleaning status (simple status change)
export async function PATCH(request: Request) {
  try {
    const { error, session } = await authenticate(request)
    if (error) return error
    if (!session) return error

    const body = await request.json()
    const { roomId, cleaningStatus, cleaningNotes } = body

    if (!roomId) {
      return NextResponse.json({ error: "roomId requis" }, { status: 400 })
    }

    // Validate cleaningStatus
    if (
      cleaningStatus !== null &&
      cleaningStatus !== undefined &&
      !VALID_CLEANING_STATUSES.includes(cleaningStatus)
    ) {
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
