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

// Safe room fields that exist in the base schema (before any housekeeping migration)
const SAFE_ROOM_SELECT = {
  id: true,
  number: true,
  name: true,
  floor: true,
  type: true,
  capacity: true,
  status: true,
  basePrice: true,
  isActive: true,
}

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

function isMissingColumnError(err: unknown): boolean {
  if (err && typeof err === "object") {
    const msg = (err as { message?: string }).message || ""
    return (
      msg.includes("does not exist") ||
      msg.includes("column") && msg.includes("not found") ||
      msg.includes("No such column") ||
      msg.includes("undefined column")
    )
  }
  return false
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

    // Tier 1: Full query with cleaningTasks included + cleaning columns
    let rooms
    let hasCleaningTasks = true
    let hasCleaningColumns = true

    try {
      rooms = await db.room.findMany({
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
                select: { id: true, name: true, firstName: true, lastName: true, avatar: true },
              },
            },
          },
        },
      })
    } catch (queryError: unknown) {
      console.warn("[housekeeping] Full query failed:", (queryError as Error).message)

      // Tier 2: Try without cleaningTasks include (tables may not exist)
      try {
        hasCleaningTasks = false
        rooms = await db.room.findMany({
          where: { guestHouseId },
          orderBy: [{ floor: "asc" }, { number: "asc" }],
        })
      } catch (fallbackError: unknown) {
        console.warn("[housekeeping] Fallback query failed:", (fallbackError as Error).message)

        if (isMissingColumnError(fallbackError)) {
          // Tier 3: Even Room.cleaningStatus column doesn't exist — use safe select
          hasCleaningColumns = false
          rooms = await db.room.findMany({
            where: { guestHouseId },
            orderBy: [{ floor: "asc" }, { number: "asc" }],
            select: SAFE_ROOM_SELECT,
          })
        } else {
          throw fallbackError
        }
      }
    }

    // Build response — handle all three tiers safely
    const roomsWithTasks = (rooms as Record<string, unknown>[]).map((room) => {
      // Safely read cleaning columns (may be undefined)
      const cleaningStatus = hasCleaningColumns
        ? (room.cleaningStatus as string | null) ?? null
        : null
      const cleaningUpdatedAt = hasCleaningColumns
        ? (room.cleaningUpdatedAt as Date | null) ?? null
        : null
      const cleaningNotes = hasCleaningColumns
        ? (room.cleaningNotes as string | null) ?? null
        : null

      // Safely read active task
      const tasks = hasCleaningTasks ? (room.cleaningTasks as Array<Record<string, unknown>> | undefined) : undefined
      const activeTask = tasks && tasks.length > 0 ? tasks[0] : null

      const taskItems = activeTask
        ? (activeTask.items as Array<{ checked: boolean }> | undefined)
        : undefined
      const totalItems = taskItems ? taskItems.length : 0
      const checkedItems = taskItems ? taskItems.filter((i) => i.checked).length : 0

      return {
        id: room.id,
        number: room.number,
        name: room.name,
        floor: room.floor,
        type: room.type,
        capacity: room.capacity,
        status: room.status,
        cleaningStatus,
        cleaningUpdatedAt,
        cleaningNotes,
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

    return NextResponse.json({
      rooms: roomsWithTasks,
      hasCleaningTasks: hasCleaningTasks && hasCleaningColumns,
    })
  } catch (error) {
    console.error("Error fetching housekeeping data:", error)
    const message = error instanceof Error ? error.message : "Erreur lors de la récupération des données"
    return NextResponse.json(
      { error: message },
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
        cleaningNotes: cleaningNotes !== undefined ? cleaningNotes : (room as Record<string, unknown>).cleaningNotes as string | null,
      },
    })

    return NextResponse.json({ room: updatedRoom })
  } catch (error) {
    console.error("Error updating cleaning status:", error)
    const message = error instanceof Error ? error.message : "Erreur lors de la mise à jour"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
