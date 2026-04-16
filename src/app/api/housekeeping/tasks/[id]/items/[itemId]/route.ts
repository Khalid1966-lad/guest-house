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

// PATCH - Toggle checklist item (check/uncheck with timestamp and user)
export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; itemId: string }>
  }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!session.user.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      )
    }

    const { id, itemId } = await params

    // Verify the task belongs to this guesthouse
    const task = await db.cleaningTask.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!task) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 })
    }

    // Cannot modify items on completed, verified, or needs_repair tasks
    if (["completed", "verified", "needs_repair"].includes(task.status)) {
      return NextResponse.json(
        {
          error:
            "Impossible de modifier les éléments d'une tâche terminée ou vérifiée",
        },
        { status: 400 }
      )
    }

    // Verify the item belongs to this task
    const existingItem = await db.cleaningTaskItem.findFirst({
      where: {
        id: itemId,
        taskId: id,
      },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: "Élément introuvable" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { checked, notes } = body

    // If checked is not provided, toggle
    const newChecked =
      checked !== undefined ? checked : !existingItem.checked

    // Update the item
    const updatedItem = await db.cleaningTaskItem.update({
      where: { id: itemId },
      data: {
        checked: newChecked,
        checkedAt: newChecked ? new Date() : null,
        checkedById: newChecked ? session.user.id : null,
        notes: notes !== undefined ? notes : existingItem.notes,
      },
      include: {
        checkedBy: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
      },
    })

    // Recompute task progress
    const allItems = await db.cleaningTaskItem.findMany({
      where: { taskId: id },
    })

    const total = allItems.length
    const checkedCount = allItems.filter((i) => i.checked).length
    const progress = total > 0 ? Math.round((checkedCount / total) * 100) : 0

    // Auto-update task status if all items are checked
    if (checkedCount === total && total > 0 && task.status === "in_progress") {
      await db.cleaningTask.update({
        where: { id },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      })

      // Update room cleaning status to "clean"
      await db.room.update({
        where: { id: task.roomId },
        data: {
          cleaningStatus: "clean",
          cleaningUpdatedAt: new Date(),
        },
      })

      return NextResponse.json({
        item: updatedItem,
        progress,
        totalItems: total,
        checkedItems: checkedCount,
        autoCompleted: true,
      })
    }

    // If task is still pending and first item is checked, auto-set to in_progress
    if (newChecked && task.status === "pending") {
      await db.cleaningTask.update({
        where: { id },
        data: {
          status: "in_progress",
          startedAt: new Date(),
        },
      })

      // Update room cleaning status to "cleaning"
      await db.room.update({
        where: { id: task.roomId },
        data: {
          cleaningStatus: "cleaning",
          cleaningUpdatedAt: new Date(),
        },
      })

      return NextResponse.json({
        item: updatedItem,
        progress,
        totalItems: total,
        checkedItems: checkedCount,
        autoStarted: true,
      })
    }

    return NextResponse.json({
      item: updatedItem,
      progress,
      totalItems: total,
      checkedItems: checkedCount,
    })
  } catch (error) {
    console.error("Error toggling checklist item:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'élément" },
      { status: 500 }
    )
  }
}
