// ──────────────────────────────────────────────────────────────────
// Housekeeping Auto-Assignment Engine
// ──────────────────────────────────────────────────────────────────
// Called after a guest checks out.
// Finds the best available housekeeping agent and creates a CleaningTask.
// ──────────────────────────────────────────────────────────────────

import { db } from "@/lib/db"

// ── Checklist template (same as in tasks/route.ts) ────────────────

const CLEANING_CHECKLIST = [
  { label: "Objets perdus / oubliés (recherche sous le lit, tiroirs, placard, salle de bain)", category: "verification" },
  { label: "Détection de dégradations (mobilier, murs, literie, équipements)", category: "verification" },
  { label: "Gestion du linge (retrait des draps, serviettes, tri éventuel)", category: "linge" },
  { label: "Nettoyage poussière (meubles, plinthes, interrupteurs, cadres)", category: "nettoyage" },
  { label: "Vitres et miroirs sans traces", category: "nettoyage" },
  { label: "Aspirateur (sols, sous le lit, recoins)", category: "nettoyage" },
  { label: "Désinfection salle de bain (lavabo, douche/baignoire, WC, robinetterie, joints)", category: "salle_de_bain" },
  { label: "Réapprovisionnement des consommables (savon, shampoing, papier toilette, café, eau, etc.)", category: "consommables" },
  { label: "Mise en place du linge propre (draps, housse de couette, serviettes)", category: "linge" },
  { label: "Contrôle final (lumière, odeur, fonctionnement TV/clim/prises)", category: "verification" },
]

// ── Housekeeping roles ────────────────────────────────────────────

const HOUSEKEEPING_ROLES = ["femmeDeMenage", "gouvernant", "gouvernante"]

// ── Day-of-week labels (French) ───────────────────────────────────

export const DAY_LABELS: Record<number, string> = {
  0: "Dimanche",
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
}

export const DAY_SHORT: Record<number, string> = {
  0: "Dim",
  1: "Lun",
  2: "Mar",
  3: "Mer",
  4: "Jeu",
  5: "Ven",
  6: "Sam",
}

// ── Helper: get current time as "HH:MM" ──────────────────────────

function getCurrentTimeStr(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
}

// ── Helper: is time1 <= time2 ? ──────────────────────────────────

function timeLeq(a: string, b: string): boolean {
  const [ah, am] = a.split(":").map(Number)
  const [bh, bm] = b.split(":").map(Number)
  return ah * 60 + am <= bh * 60 + bm
}

// ── Helper: count active tasks for a user ─────────────────────────

async function countActiveTasks(userId: string, guestHouseId: string): Promise<number> {
  return db.cleaningTask.count({
    where: {
      guestHouseId,
      assignedToId: userId,
      status: { in: ["pending", "in_progress"] },
    },
  })
}

// ── Core: find the best agent for a room ──────────────────────────

async function findBestAgent(
  guestHouseId: string,
  roomId: string,
  roomFloor: number | null,
  mode: "zone" | "round_robin"
): Promise<{ id: string; name: string | null } | null> {
  // 1. Fetch all active housekeeping staff in this GH
  const staff = await db.user.findMany({
    where: {
      guestHouseId,
      role: { in: HOUSEKEEPING_ROLES },
      isActive: true,
    },
    select: { id: true, name: true },
  })

  if (staff.length === 0) return null

  // 2. Filter by schedule (who is working right now?)
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun ... 6=Sat
  const currentTime = getCurrentTimeStr()

  // Fetch all schedules for these staff members for today
  const schedules = await db.staffSchedule.findMany({
    where: {
      userId: { in: staff.map((s) => s.id) },
      dayOfWeek,
    },
  })

  // Staff IDs that have a schedule for today and are within working hours
  const availableStaffIds = new Set(
    schedules
      .filter((s) => s.isAvailable && timeLeq(s.startTime, currentTime) && timeLeq(currentTime, s.endTime))
      .map((s) => s.userId)
  )

  // If no one has a schedule at all, consider everyone available (schedule feature not set up yet)
  const hasAnySchedule = schedules.length > 0

  let candidates: typeof staff
  if (hasAnySchedule) {
    candidates = staff.filter((s) => availableStaffIds.has(s.id))
    if (candidates.length === 0) return null // Nobody available right now
  } else {
    candidates = staff // No schedule configured = everyone available
  }

  // 3. Zone-based matching (if mode is "zone")
  if (mode === "zone") {
    // Fetch all zones for this guesthouse
    const zones = await db.housekeepingZone.findMany({
      where: { guestHouseId },
      include: { user: { select: { id: true, name: true } } },
    })

    if (zones.length > 0) {
      // Priority 1: Room-specific assignment
      const roomZone = zones.find((z) => {
        if (z.zoneType !== "room") return false
        try {
          const ids: string[] = JSON.parse(z.roomIds)
          return ids.includes(roomId)
        } catch {
          return false
        }
      })

      if (roomZone) {
        const agent = candidates.find((c) => c.id === roomZone.user.id)
        if (agent) return agent
      }

      // Priority 2: Floor-specific assignment
      if (roomFloor !== null) {
        const floorZone = zones.find(
          (z) => z.zoneType === "floor" && z.floorNumber === roomFloor
        )
        if (floorZone) {
          const agent = candidates.find((c) => c.id === floorZone.user.id)
          if (agent) return agent
        }
      }
    }
  }

  // 4. Fallback: round-robin — pick the agent with the fewest active tasks
  let bestCandidate: { id: string; name: string | null } | null = null
  let lowestCount = Infinity

  for (const candidate of candidates) {
    const count = await countActiveTasks(candidate.id, guestHouseId)
    if (count < lowestCount) {
      lowestCount = count
      bestCandidate = candidate
    }
  }

  return bestCandidate
}

// ── Public API: called from checkout route ────────────────────────

export async function autoAssignCleaning(roomId: string, guestHouseId: string): Promise<{
  success: boolean
  taskId?: string
  assignedTo?: string | null
  message?: string
}> {
  try {
    // 1. Check if auto-assign is enabled
    const settings = await db.guestHouseSetting.findUnique({
      where: { guestHouseId },
      select: {
        autoAssignHousekeeping: true,
        autoAssignMode: true,
        autoStartCleaning: true,
        defaultCleaningPriority: true,
      },
    })

    if (!settings || !settings.autoAssignHousekeeping) {
      return { success: false, message: "Auto-assignation désactivée" }
    }

    // 2. Check if there's already an active task for this room
    const existingTask = await db.cleaningTask.findFirst({
      where: {
        roomId,
        guestHouseId,
        status: { in: ["pending", "in_progress"] },
      },
    })

    if (existingTask) {
      return { success: false, message: "Une tâche est déjà active pour cette chambre" }
    }

    // 3. Get room info (for floor)
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true, number: true, floor: true },
    })

    if (!room) {
      return { success: false, message: "Chambre introuvable" }
    }

    // 4. Find the best agent
    const agent = await findBestAgent(
      guestHouseId,
      roomId,
      room.floor,
      (settings.autoAssignMode as "zone" | "round_robin") || "zone"
    )

    if (!agent) {
      return { success: false, message: "Aucun agent de ménage disponible" }
    }

    // 5. Create the CleaningTask with checklist
    const task = await db.cleaningTask.create({
      data: {
        guestHouseId,
        roomId,
        assignedToId: agent.id,
        priority: settings.defaultCleaningPriority || "normal",
        status: settings.autoStartCleaning ? "in_progress" : "pending",
        startedAt: settings.autoStartCleaning ? new Date() : null,
        items: {
          create: CLEANING_CHECKLIST.map((item, index) => ({
            label: item.label,
            category: item.category,
            sortOrder: index + 1,
          })),
        },
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        room: { select: { id: true, number: true, name: true } },
      },
    })

    // 6. Update room cleaning status
    const newStatus = settings.autoStartCleaning ? "cleaning" : "departure"
    await db.room.update({
      where: { id: roomId },
      data: {
        cleaningStatus: newStatus,
        cleaningUpdatedAt: new Date(),
      },
    })

    console.log(
      `[housekeeping-auto] Task ${task.id} created for room ${room.number}, ` +
      `assigned to ${agent.name || agent.id}, status: ${task.status}`
    )

    return {
      success: true,
      taskId: task.id,
      assignedTo: agent.name,
    }
  } catch (error) {
    console.error("[housekeeping-auto] Error:", error)
    return { success: false, message: "Erreur lors de l'auto-assignation" }
  }
}
