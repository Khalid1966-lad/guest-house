import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const ALLOWED_ROLES = [
  "owner",
  "admin",
  "manager",
  "housekeeping",
  "gouvernant",
  "gouvernante",
  "femmeDeMenage",
]

// Roles that can verify tasks, assign staff, and change any status
const FULL_ACCESS_ROLES = ["owner", "admin", "manager", "gouvernant", "gouvernante"]

// Valid task statuses and their allowed transitions
const VALID_STATUSES = ["pending", "in_progress", "completed", "verified", "needs_repair"]

const VALID_PRIORITIES = ["low", "normal", "high"]

// Helper: authenticate and check role
async function authenticate(request: Request, requireFullAccess = false) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }), session: null }
  }

  if (!session.user.guestHouseId) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }), session: null }
  }

  const allowed = requireFullAccess ? FULL_ACCESS_ROLES : ALLOWED_ROLES
  if (!allowed.includes(session.user.role)) {
    return { error: NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 }), session: null }
  }

  return { error: null, session }
}

// GET - Get a single task with all checklist items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await authenticate(request)
    if (error) return error
    if (!session) return error

    const { id } = await params

    const task = await db.cleaningTask.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            checkedBy: {
              select: { id: true, name: true, firstName: true, lastName: true },
            },
          },
        },
        assignedTo: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
        verifiedBy: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
        room: {
          select: { id: true, number: true, name: true, type: true, floor: true },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 })
    }

    // Add computed progress
    const total = task.items.length
    const checked = task.items.filter((i) => i.checked).length
    const progress = total > 0 ? Math.round((checked / total) * 100) : 0

    return NextResponse.json({
      task: {
        ...task,
        progress,
        totalItems: total,
        checkedItems: checked,
      },
    })
  } catch (error) {
    console.error("Error fetching cleaning task:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la tâche" },
      { status: 500 }
    )
  }
}

// PATCH - Update task (assign staff, change status, add notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await authenticate(request)
    if (error) return error
    if (!session) return error

    const { id } = await params
    const body = await request.json()
    const {
      assignedToId,
      status,
      priority,
      notes,
      damageNotes,
      hasDamage,
    } = body

    // Verify task belongs to this guesthouse
    const existingTask = await db.cleaningTask.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
      include: {
        room: {
          select: { id: true, number: true },
        },
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    // Assign staff — only full access roles can reassign
    if (assignedToId !== undefined) {
      if (!FULL_ACCESS_ROLES.includes(session.user.role)) {
        return NextResponse.json(
          { error: "Permissions insuffisantes pour réassigner" },
          { status: 403 }
        )
      }
      if (assignedToId !== null) {
        const assignee = await db.user.findFirst({
          where: {
            id: assignedToId,
            guestHouseId: session.user.guestHouseId,
          },
        })
        if (!assignee) {
          return NextResponse.json(
            { error: "Utilisateur assigné introuvable" },
            { status: 404 }
          )
        }
      }
      updateData.assignedToId = assignedToId
    }

    // Change priority — only full access roles
    if (priority !== undefined) {
      if (!FULL_ACCESS_ROLES.includes(session.user.role)) {
        return NextResponse.json(
          { error: "Permissions insuffisantes pour modifier la priorité" },
          { status: 403 }
        )
      }
      if (!VALID_PRIORITIES.includes(priority)) {
        return NextResponse.json({ error: "Priorité invalide" }, { status: 400 })
      }
      updateData.priority = priority
    }

    // Change status
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
      }

      // femmeDeMenage can only: mark as in_progress, completed, or needs_repair
      if (session.user.role === "femmeDeMenage") {
        const allowedTransitions = ["in_progress", "completed", "needs_repair"]
        if (!allowedTransitions.includes(status)) {
          return NextResponse.json(
            { error: "Permissions insuffisantes pour ce changement de statut" },
            { status: 403 }
          )
        }
      }

      // Only full access roles can set verified status
      if (status === "verified" && !FULL_ACCESS_ROLES.includes(session.user.role)) {
        return NextResponse.json(
          { error: "Seuls les superviseurs peuvent vérifier une tâche" },
          { status: 403 }
        )
      }

      updateData.status = status

      // Set timestamps based on status transitions
      if (status === "in_progress" && !existingTask.startedAt) {
        updateData.startedAt = new Date()
      }

      if (status === "completed" || status === "verified") {
        updateData.completedAt = new Date()
      }

      if (status === "verified") {
        updateData.verifiedById = session.user.id
        updateData.verifiedAt = new Date()
      }
    }

    // Update notes
    if (notes !== undefined) {
      updateData.notes = notes
    }

    // Update damage info
    if (damageNotes !== undefined) {
      updateData.damageNotes = damageNotes
    }
    if (hasDamage !== undefined) {
      updateData.hasDamage = hasDamage
    }

    // If hasDamage is true, auto-set status to needs_repair
    if (hasDamage === true && !status) {
      updateData.status = "needs_repair"
      updateData.completedAt = new Date()
    }

    // Update the task
    const updatedTask = await db.cleaningTask.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
        assignedTo: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
        verifiedBy: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
        room: {
          select: { id: true, number: true, name: true, type: true, floor: true },
        },
      },
    })

    // Update the Room's cleaningStatus based on task status
    const roomStatusMap: Record<string, string> = {
      pending: "departure",
      in_progress: "cleaning",
      completed: "clean",
      verified: "verified",
      needs_repair: "turnover",
    }

    const newRoomStatus = roomStatusMap[updatedTask.status]
    if (newRoomStatus) {
      await db.room.update({
        where: { id: updatedTask.roomId },
        data: {
          cleaningStatus: newRoomStatus,
          cleaningUpdatedAt: new Date(),
        },
      })
    }

    // Compute progress
    const total = updatedTask.items.length
    const checked = updatedTask.items.filter((i) => i.checked).length
    const progress = total > 0 ? Math.round((checked / total) * 100) : 0

    return NextResponse.json({
      task: {
        ...updatedTask,
        progress,
        totalItems: total,
        checkedItems: checked,
      },
    })
  } catch (error) {
    console.error("Error updating cleaning task:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la tâche" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await authenticate(request)
    if (error) return error
    if (!session) return error

    const { id } = await params

    // Verify task belongs to this guesthouse
    const task = await db.cleaningTask.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
      include: {
        room: {
          select: { id: true, number: true },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 })
    }

    // Only full access roles can delete tasks
    if (!FULL_ACCESS_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes pour supprimer une tâche" },
        { status: 403 }
      )
    }

    // Cannot delete completed or verified tasks
    if (task.status === "completed" || task.status === "verified") {
      return NextResponse.json(
        { error: "Impossible de supprimer une tâche terminée ou vérifiée" },
        { status: 400 }
      )
    }

    // Delete the task (cascade will delete items)
    await db.cleaningTask.delete({
      where: { id },
    })

    // If this was the only active task for the room, reset room cleaning status
    const remainingActiveTasks = await db.cleaningTask.count({
      where: {
        roomId: task.roomId,
        status: { in: ["pending", "in_progress"] },
      },
    })

    if (remainingActiveTasks === 0) {
      await db.room.update({
        where: { id: task.roomId },
        data: {
          cleaningStatus: "departure",
          cleaningUpdatedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ success: true, message: "Tâche supprimée" })
  } catch (error) {
    console.error("Error deleting cleaning task:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la tâche" },
      { status: 500 }
    )
  }
}
