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

// Standard cleaning checklist template (order matters)
const CLEANING_CHECKLIST_TEMPLATE = [
  {
    label: "Objets perdus / oubliés (recherche sous le lit, tiroirs, placard, salle de bain)",
    category: "verification",
  },
  {
    label: "Détection de dégradations (mobilier, murs, literie, équipements)",
    category: "verification",
  },
  {
    label: "Gestion du linge (retrait des draps, serviettes, tri éventuel)",
    category: "linge",
  },
  {
    label: "Nettoyage poussière (meubles, plinthes, interrupteurs, cadres)",
    category: "nettoyage",
  },
  {
    label: "Vitres et miroirs sans traces",
    category: "nettoyage",
  },
  {
    label: "Aspirateur (sols, sous le lit, recoins)",
    category: "nettoyage",
  },
  {
    label: "Désinfection salle de bain (lavabo, douche/baignoire, WC, robinetterie, joints)",
    category: "salle_de_bain",
  },
  {
    label: "Réapprovisionnement des consommables (savon, shampoing, papier toilette, café, eau, etc.)",
    category: "consommables",
  },
  {
    label: "Mise en place du linge propre (draps, housse de couette, serviettes)",
    category: "linge",
  },
  {
    label: "Contrôle final (lumière, odeur, fonctionnement TV/clim/prises)",
    category: "verification",
  },
]

// Helper: authenticate and check role
async function authenticate(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }), session: null }
  }

  if (!session.user.guestHouseId) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }), session: null }
  }

  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return { error: NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 }), session: null }
  }

  return { error: null, session }
}

// POST - Create a new cleaning task for a room (auto-generates checklist items)
export async function POST(request: NextRequest) {
  try {
    const { error, session } = await authenticate(request)
    if (error) return error
    if (!session) return error

    const body = await request.json()
    const { roomId, assignedToId, priority, notes } = body

    if (!roomId) {
      return NextResponse.json({ error: "roomId requis" }, { status: 400 })
    }

    // Validate priority
    const validPriorities = ["low", "normal", "high"]
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: "Priorité invalide" }, { status: 400 })
    }

    // Verify room belongs to this guesthouse
    const room = await db.room.findFirst({
      where: {
        id: roomId,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!room) {
      return NextResponse.json({ error: "Chambre introuvable" }, { status: 404 })
    }

    // If assignedToId is provided, verify the user exists and belongs to the same guesthouse
    if (assignedToId) {
      const assignee = await db.user.findFirst({
        where: {
          id: assignedToId,
          guestHouseId: session.user.guestHouseId,
        },
      })
      if (!assignee) {
        return NextResponse.json({ error: "Utilisateur assigné introuvable" }, { status: 404 })
      }
    }

    // Check if there's already an active (non-completed, non-verified, non-needs_repair) task for this room
    const existingActiveTask = await db.cleaningTask.findFirst({
      where: {
        roomId,
        status: { in: ["pending", "in_progress"] },
      },
    })

    if (existingActiveTask) {
      return NextResponse.json(
        { error: "Une tâche de nettoyage est déjà active pour cette chambre", taskId: existingActiveTask.id },
        { status: 409 }
      )
    }

    // Create the cleaning task with auto-generated checklist items
    const cleaningTask = await db.cleaningTask.create({
      data: {
        guestHouseId: session.user.guestHouseId,
        roomId,
        assignedToId: assignedToId || null,
        priority: priority || "normal",
        notes: notes || null,
        items: {
          create: CLEANING_CHECKLIST_TEMPLATE.map((item, index) => ({
            label: item.label,
            category: item.category,
            sortOrder: index + 1,
          })),
        },
      },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
        assignedTo: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
        room: {
          select: { id: true, number: true, name: true },
        },
      },
    })

    // Update room's cleaning status
    await db.room.update({
      where: { id: roomId },
      data: {
        cleaningStatus: "cleaning",
        cleaningUpdatedAt: new Date(),
      },
    })

    return NextResponse.json({ task: cleaningTask }, { status: 201 })
  } catch (error) {
    console.error("Error creating cleaning task:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la tâche" },
      { status: 500 }
    )
  }
}

// GET - List all cleaning tasks with filters (status, roomId, assignedToId)
export async function GET(request: NextRequest) {
  try {
    const { error, session } = await authenticate(request)
    if (error) return error
    if (!session) return error

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const roomId = searchParams.get("roomId")
    const assignedToId = searchParams.get("assignedToId")
    const priority = searchParams.get("priority")

    // Build the where clause
    const where: Record<string, unknown> = {
      guestHouseId: session.user.guestHouseId,
    }

    if (status) {
      where.status = status
    }

    if (roomId) {
      where.roomId = roomId
    }

    if (assignedToId) {
      where.assignedToId = assignedToId
    }

    if (priority) {
      where.priority = priority
    }

    const tasks = await db.cleaningTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

    // Add computed progress for each task
    const tasksWithProgress = tasks.map((task) => {
      const total = task.items.length
      const checked = task.items.filter((i) => i.checked).length
      const progress = total > 0 ? Math.round((checked / total) * 100) : 0

      return {
        ...task,
        progress,
        totalItems: total,
        checkedItems: checked,
      }
    })

    return NextResponse.json({ tasks: tasksWithProgress })
  } catch (error) {
    console.error("Error fetching cleaning tasks:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tâches" },
      { status: 500 }
    )
  }
}
