import { db } from "@/lib/db"

// Roles that can be assigned housekeeping tasks
const HOUSEKEEPING_ROLES = [
  "femmeDeMenage",
  "gouvernant",
  "gouvernante",
  "housekeeping",
  "manager",
]

const CLEANING_CHECKLIST_TEMPLATE = [
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

export interface AutoAssignResult {
  success: boolean
  taskId?: string
  assignedToId?: string | null
  assignedToName?: string | null
  error?: string
}

/**
 * Auto-assign a cleaning task after checkout.
 * Called from the checkout PATCH handler.
 */
export async function autoAssignCleaningTask(params: {
  guestHouseId: string
  roomId: string
  roomFloor?: number | null
}): Promise<AutoAssignResult> {
  const { guestHouseId, roomId, roomFloor } = params

  try {
    // 1. Check if auto-assignment is enabled for this guest house
    const settings = await db.guestHouseSetting.findUnique({
      where: { guestHouseId },
    })

    if (!settings?.autoAssignHousekeeping) {
      return { success: false, error: "Auto-assignation désactivée" }
    }

    // 2. Check if there's already an active task for this room
    const existingTask = await db.cleaningTask.findFirst({
      where: {
        roomId,
        status: { in: ["pending", "in_progress"] },
      },
    })

    if (existingTask) {
      return { success: false, error: "Tâche active existe déjà pour cette chambre" }
    }

    // 3. Find the best agent to assign
    const assignedTo = await findBestAgent({
      guestHouseId,
      roomId,
      roomFloor,
      mode: settings.autoAssignMode || "zone",
    })

    // 4. Create the cleaning task
    const taskStatus = settings.autoStartCleaning ? "in_progress" : "pending"
    const priority = settings.defaultCleaningPriority || "normal"

    const taskData: Record<string, unknown> = {
      guestHouseId,
      roomId,
      priority,
      status: taskStatus,
      items: {
        create: CLEANING_CHECKLIST_TEMPLATE.map((item, index) => ({
          label: item.label,
          category: item.category,
          sortOrder: index + 1,
        })),
      },
    }

    if (assignedTo?.userId) {
      taskData.assignedToId = assignedTo.userId
    }

    if (taskStatus === "in_progress") {
      taskData.startedAt = new Date()
    }

    const cleaningTask = await db.cleaningTask.create({
      data: taskData,
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    })

    // 5. Update room cleaning status
    await db.room.update({
      where: { id: roomId },
      data: {
        cleaningStatus: taskStatus === "in_progress" ? "cleaning" : "departure",
        cleaningUpdatedAt: new Date(),
      },
    })

    console.log(
      `[auto-assign] Task ${cleaningTask.id} created for room ${roomId}, assigned to ${assignedTo?.userName || "unassigned"} (mode: ${settings.autoAssignMode})`
    )

    return {
      success: true,
      taskId: cleaningTask.id,
      assignedToId: assignedTo?.userId || null,
      assignedToName: assignedTo?.userName || null,
    }
  } catch (error) {
    console.error("[auto-assign] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur auto-assignation",
    }
  }
}

/**
 * Find the best available agent based on the configured mode.
 */
async function findBestAgent(params: {
  guestHouseId: string
  roomId: string
  roomFloor?: number | null
  mode: string
}): Promise<{ userId: string; userName: string | null } | null> {
  const { guestHouseId, roomId, roomFloor, mode } = params

  // Get all active housekeeping staff for this guest house
  const staff = await db.user.findMany({
    where: {
      guestHouseId,
      role: { in: HOUSEKEEPING_ROLES },
      isActive: true,
    },
    select: { id: true, name: true },
  })

  if (staff.length === 0) {
    console.log("[auto-assign] No housekeeping staff found")
    return null
  }

  // Filter by today's schedule availability
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun, 6=Sat
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

  const schedules = await db.staffSchedule.findMany({
    where: {
      userId: { in: staff.map((s) => s.id) },
      dayOfWeek,
    },
  })

  // Build set of available user IDs
  const staffIds = new Set(staff.map((s) => s.id))
  const scheduledIds = new Set(schedules.filter((s) => s.isAvailable).map((s) => s.userId))

  // Filter: only include staff who have a schedule for today AND are available
  // If no schedule exists for a staff member, consider them available (lenient default)
  const availableStaffIds = staff
    .filter((s) => {
      const schedule = schedules.find((sch) => sch.userId === s.id)
      if (!schedule) return true // No schedule = available
      if (!schedule.isAvailable) return false // Explicitly unavailable today
      return true
    })
    .map((s) => s.id)

  if (availableStaffIds.length === 0) {
    console.log("[auto-assign] No available staff today")
    return null
  }

  // Count active tasks per available staff member
  const taskCounts = await db.cleaningTask.groupBy({
    by: ["assignedToId"],
    where: {
      guestHouseId,
      assignedToId: { in: availableStaffIds },
      status: { in: ["pending", "in_progress"] },
    },
    _count: true,
  })

  const taskCountMap = new Map<string, number>()
  for (const tc of taskCounts) {
    if (tc.assignedToId) {
      taskCountMap.set(tc.assignedToId, tc._count)
    }
  }

  if (mode === "zone") {
    // Zone-based assignment
    const zoneAgent = await findZoneAgent({
      guestHouseId,
      roomId,
      roomFloor,
      availableStaffIds,
    })
    if (zoneAgent) return zoneAgent

    // Fallback to least-busy
    return findLeastBusyAgent(availableStaffIds, taskCountMap, staff)
  }

  if (mode === "round_robin") {
    // Least busy = round-robin approximation
    return findLeastBusyAgent(availableStaffIds, taskCountMap, staff)
  }

  // manual_only — don't auto-assign
  return null
}

/**
 * Find agent based on zone assignment (floor/room).
 */
async function findZoneAgent(params: {
  guestHouseId: string
  roomId: string
  roomFloor?: number | null
  availableStaffIds: string[]
}): Promise<{ userId: string; userName: string | null } | null> {
  const { guestHouseId, roomId, roomFloor, availableStaffIds } = params

  const zones = await db.housekeepingZone.findMany({
    where: {
      guestHouseId,
      userId: { in: availableStaffIds },
    },
  })

  if (zones.length === 0) return null

  // Priority 1: Room-level match
  for (const zone of zones) {
    if (zone.zoneType === "room") {
      try {
        const assignedRoomIds: string[] = JSON.parse(zone.roomIds || "[]")
        if (assignedRoomIds.includes(roomId)) {
          const user = await db.user.findUnique({ where: { id: zone.userId }, select: { id: true, name: true } })
          if (user) return { userId: user.id, userName: user.name }
        }
      } catch {
        // ignore JSON parse errors
      }
    }
  }

  // Priority 2: Floor-level match
  if (roomFloor != null) {
    for (const zone of zones) {
      if (zone.zoneType === "floor" && zone.floorNumber === roomFloor) {
        const user = await db.user.findUnique({ where: { id: zone.userId }, select: { id: true, name: true } })
        if (user) return { userId: user.id, userName: user.name }
      }
    }
  }

  return null
}

/**
 * Find the staff member with the fewest active tasks.
 */
function findLeastBusyAgent(
  availableStaffIds: string[],
  taskCountMap: Map<string, number>,
  staff: { id: string; name: string | null }[]
): { userId: string; userName: string | null } | null {
  let bestId: string | null = null
  let bestCount = Infinity

  for (const id of availableStaffIds) {
    const count = taskCountMap.get(id) || 0
    if (count < bestCount) {
      bestCount = count
      bestId = id
    }
  }

  if (!bestId) return null

  const user = staff.find((s) => s.id === bestId)
  return user ? { userId: user.id, userName: user.name } : null
}
