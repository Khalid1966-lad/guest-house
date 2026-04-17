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

// GET - Return completed cleaning tasks for a specific room
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")

    if (!roomId) {
      return NextResponse.json(
        { error: "roomId requis" },
        { status: 400 }
      )
    }

    // Verify room belongs to this guesthouse
    const room = await db.room.findFirst({
      where: {
        id: roomId,
        guestHouseId: session.user.guestHouseId,
      },
      select: { id: true, number: true, name: true },
    })

    if (!room) {
      return NextResponse.json({ error: "Chambre introuvable" }, { status: 404 })
    }

    // Optional pagination
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const skip = (page - 1) * limit

    // Fetch completed cleaning tasks for this room
    const [tasks, total] = await Promise.all([
      db.cleaningTask.findMany({
        where: {
          roomId,
          guestHouseId: session.user.guestHouseId,
          status: { in: ["completed", "verified", "needs_repair"] },
        },
        orderBy: { completedAt: "desc" },
        skip,
        take: limit,
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
        },
      }),
      db.cleaningTask.count({
        where: {
          roomId,
          guestHouseId: session.user.guestHouseId,
          status: { in: ["completed", "verified", "needs_repair"] },
        },
      }),
    ])

    // Enrich with computed progress
    const tasksWithProgress = tasks.map((task) => {
      const totalItems = task.items.length
      const checkedItems = task.items.filter((i) => i.checked).length

      // Group items by category with check summary
      const categories = task.items.reduce<
        Record<string, { total: number; checked: number; items: typeof task.items }>
      >((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = { total: 0, checked: 0, items: [] }
        }
        acc[item.category].total++
        if (item.checked) acc[item.category].checked++
        acc[item.category].items.push(item)
        return acc
      }, {})

      return {
        id: task.id,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo,
        verifiedBy: task.verifiedBy,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        verifiedAt: task.verifiedAt,
        notes: task.notes,
        damageNotes: task.damageNotes,
        hasDamage: task.hasDamage,
        createdAt: task.createdAt,
        progress: { checked: checkedItems, total: totalItems },
        totalItems,
        checkedItems,
        categories,
      }
    })

    return NextResponse.json({
      room: {
        id: room.id,
        number: room.number,
        name: room.name,
      },
      tasks: tasksWithProgress,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching cleaning history:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique" },
      { status: 500 }
    )
  }
}
