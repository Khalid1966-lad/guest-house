"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Sparkles,
  BedDouble,
  Clock,
  CheckCircle2,
  Loader2,
  MessageSquare,
  User,
  AlertTriangle,
  ClipboardCheck,
  Shield,
  Trash2,
  ChevronRight,
  Eye,
  X,
  Search,
  RefreshCw,
  Wrench,
  CheckCheck,
  Star,
  CircleAlert,
  History,
  ArrowUpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, format } from "date-fns"
import { fr } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

// ─── Types ──────────────────────────────────────────────────────────────

interface RoomWithCleaning {
  id: string
  number: string
  name: string | null
  status: string
  cleaningStatus: string | null
  cleaningUpdatedAt: string | null
  cleaningNotes: string | null
  activeTask: ActiveTask | null
}

interface ActiveTask {
  id: string
  status: string
  assignedTo: { id: string; name: string; avatar: string | null } | null
  progress: { checked: number; total: number }
  startedAt: string | null
}

interface StaffUser {
  id: string
  name: string | null
  email: string
  avatar: string | null
  role: string
}

interface CleaningTask {
  id: string
  roomId: string
  room: { number: string; name: string | null }
  assignedToId: string | null
  assignedTo: { id: string; name: string | null; avatar: string | null } | null
  status: string
  priority: string
  startedAt: string | null
  completedAt: string | null
  verifiedAt: string | null
  verifiedBy: { id: string; name: string | null } | null
  notes: string | null
  damageNotes: string | null
  hasDamage: boolean
  items: ChecklistItem[]
  createdAt: string
}

interface ChecklistItem {
  id: string
  label: string
  category: string
  sortOrder: number
  checked: boolean
  checkedAt: string | null
  checkedBy: { id: string; name: string | null } | null
  notes: string | null
}

interface CleaningHistoryEntry {
  id: string
  room: { number: string; name: string | null }
  assignedTo: { id: string; name: string | null } | null
  status: string
  startedAt: string | null
  completedAt: string | null
  verifiedAt: string | null
  verifiedBy: { id: string; name: string | null } | null
  progress: { checked: number; total: number }
}

// ─── Constants ──────────────────────────────────────────────────────────

const taskStatuses = [
  {
    value: "pending",
    label: "En attente",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    dotColor: "bg-gray-500",
    borderColor: "border-gray-300 dark:border-gray-600",
    icon: Clock,
  },
  {
    value: "in_progress",
    label: "En cours",
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    dotColor: "bg-sky-500",
    borderColor: "border-sky-300 dark:border-sky-700",
    icon: Loader2,
  },
  {
    value: "completed",
    label: "Terminé",
    color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    dotColor: "bg-green-500",
    borderColor: "border-green-300 dark:border-green-700",
    icon: CheckCircle2,
  },
  {
    value: "verified",
    label: "Vérifié",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
    borderColor: "border-emerald-300 dark:border-emerald-700",
    icon: Shield,
  },
  {
    value: "needs_repair",
    label: "À réparer",
    color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    dotColor: "bg-red-500",
    borderColor: "border-red-300 dark:border-red-700",
    icon: Wrench,
  },
]

const cleaningStatusMap: Record<string, { label: string; color: string; dotColor: string; borderColor: string }> = {
  departure: {
    label: "En départ",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    dotColor: "bg-amber-500",
    borderColor: "border-amber-300 dark:border-amber-700",
  },
  turnover: {
    label: "En recouche",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    dotColor: "bg-orange-500",
    borderColor: "border-orange-300 dark:border-orange-700",
  },
  cleaning: {
    label: "En cours de nettoyage",
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    dotColor: "bg-sky-500",
    borderColor: "border-sky-300 dark:border-sky-700",
  },
  clean: {
    label: "Propre",
    color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    dotColor: "bg-green-500",
    borderColor: "border-green-300 dark:border-green-700",
  },
  verified: {
    label: "Vérifiée",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
    borderColor: "border-emerald-300 dark:border-emerald-700",
  },
}

const roomStatusInfo: Record<string, { label: string; color: string }> = {
  available: { label: "Disponible", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
  occupied: { label: "Occupée", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  maintenance: { label: "Maintenance", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
  out_of_order: { label: "Hors service", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
}

// Checklist categories
const checklistCategories = [
  {
    key: "verification",
    label: "Vérification",
    icon: Search,
    color: "text-amber-600 dark:text-amber-400",
    bgLight: "bg-amber-50 dark:bg-amber-950/40",
    borderLight: "border-amber-200 dark:border-amber-800",
  },
  {
    key: "linge",
    label: "Linge",
    icon: Star,
    color: "text-green-600 dark:text-green-400",
    bgLight: "bg-green-50 dark:bg-green-950/40",
    borderLight: "border-green-200 dark:border-green-800",
  },
  {
    key: "nettoyage",
    label: "Nettoyage",
    icon: Sparkles,
    color: "text-sky-600 dark:text-sky-400",
    bgLight: "bg-sky-50 dark:bg-sky-950/40",
    borderLight: "border-sky-200 dark:border-sky-800",
  },
  {
    key: "salle_de_bain",
    label: "Salle de bain",
    icon: ClipboardCheck,
    color: "text-purple-600 dark:text-purple-400",
    bgLight: "bg-purple-50 dark:bg-purple-950/40",
    borderLight: "border-purple-200 dark:border-purple-800",
  },
  {
    key: "consommables",
    label: "Consommables",
    icon: CheckCheck,
    color: "text-orange-600 dark:text-orange-400",
    bgLight: "bg-orange-50 dark:bg-orange-950/40",
    borderLight: "border-orange-200 dark:border-orange-800",
  },
]

// Roles with full access
const FULL_ACCESS_ROLES = ["owner", "admin", "manager", "gouvernant", "gouvernante", "super_admin"]
const LIMITED_ROLE = "femmeDeMenage"

// ─── Helpers ─────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr })
  } catch {
    return ""
  }
}

function formatDateFull(dateStr: string): string {
  try {
    return format(new Date(dateStr), "d MMM yyyy à HH:mm", { locale: fr })
  } catch {
    return ""
  }
}

function getTaskStatusInfo(status: string) {
  return taskStatuses.find((s) => s.value === status) || taskStatuses[0]
}

function getCleaningStatusInfo(status: string) {
  return cleaningStatusMap[status] || null
}

function getCategoryInfo(key: string) {
  return checklistCategories.find((c) => c.key === key) || checklistCategories[0]
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "high":
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-xs">Haute</Badge>
    case "low":
      return <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-xs">Basse</Badge>
    default:
      return <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 text-xs">Normale</Badge>
  }
}

// ─── Component ──────────────────────────────────────────────────────────

export default function HousekeepingPage() {
  const { data: session, status: authStatus } = useSession()
  const { toast } = useToast()
  const userRole = session?.user?.role || ""
  const isFullAccess = FULL_ACCESS_ROLES.includes(userRole)

  // ── State ──
  const [rooms, setRooms] = useState<RoomWithCleaning[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState("")
  const [hasCleaningTasks, setHasCleaningTasks] = useState(true)

  // Task detail sheet
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<CleaningTask | null>(null)
  const [isTaskLoading, setIsTaskLoading] = useState(false)
  const [taskNotes, setTaskNotes] = useState("")
  const [isTogglingItem, setIsTogglingItem] = useState<string | null>(null)
  const [isUpdatingTask, setIsUpdatingTask] = useState(false)

  // Create task dialog
  const [createDialogRoom, setCreateDialogRoom] = useState<RoomWithCleaning | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [assignToId, setAssignToId] = useState<string>("")
  const [createPriority, setCreatePriority] = useState<string>("normal")
  const [createNotes, setCreateNotes] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Anomaly note dialog
  const [anomalyItem, setAnomalyItem] = useState<{ taskId: string; itemId: string; currentNote: string | null } | null>(null)
  const [anomalyNoteInput, setAnomalyNoteInput] = useState("")
  const [isSavingAnomaly, setIsSavingAnomaly] = useState(false)

  // Damage dialog
  const [damageDialogOpen, setDamageDialogOpen] = useState(false)
  const [damageNoteInput, setDamageNoteInput] = useState("")
  const [isReportingDamage, setIsReportingDamage] = useState(false)

  // Assign staff dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  // History sheet
  const [historyRoom, setHistoryRoom] = useState<RoomWithCleaning | null>(null)
  const [historyData, setHistoryData] = useState<CleaningHistoryEntry[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)

  // Staff list
  const [staffList, setStaffList] = useState<StaffUser[]>([])

  // ── Helpers ──
  const userCanVerify = isFullAccess

  // ── Fetch rooms ──
  const fetchRooms = useCallback(async (showRefreshSpinner = false) => {
    const guestHouseId = session?.user?.guestHouseId
    if (!guestHouseId) return

    try {
      if (showRefreshSpinner) setIsRefreshing(true)
      else setIsLoading(true)
      setError("")

      const res = await fetch("/api/housekeeping")
      if (!res.ok) {
        let errorMsg = "Erreur lors du chargement des chambres"
        try {
          const errData = await res.json()
          if (errData.error) errorMsg = errData.error
        } catch {
          // ignore parse error
        }
        throw new Error(errorMsg)
      }
      const data = await res.json()
      setRooms(data.rooms || [])
      if (data.hasCleaningTasks === false) setHasCleaningTasks(false)
    } catch (err) {
      console.error("Error fetching rooms:", err)
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [session?.user?.guestHouseId])

  // ── Fetch staff ──
  const fetchStaff = useCallback(async () => {
    const guestHouseId = session?.user?.guestHouseId
    if (!guestHouseId) return
    try {
      const res = await fetch("/api/users")
      if (res.ok) {
        const data = await res.json()
        setStaffList(data.users || [])
      }
    } catch {
      // ignore
    }
  }, [session?.user?.guestHouseId])

  // ── Initial load ──
  useEffect(() => {
    if (authStatus === "loading") return
    if (session?.user?.guestHouseId) {
      fetchRooms()
      fetchStaff()
    }
  }, [session?.user?.guestHouseId, authStatus, fetchRooms, fetchStaff])

  // ── Stats ──
  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      departure: 0,
      turnover: 0,
      cleaning: 0,
      clean: 0,
      verified: 0,
      none: 0,
    }
    rooms.forEach((room) => {
      if (room.cleaningStatus && counts[room.cleaningStatus] !== undefined) {
        counts[room.cleaningStatus]++
      } else {
        counts.none++
      }
    })
    // Count active tasks
    const activeTasks = rooms.filter((r) => r.activeTask).length
    return { ...counts, activeTasks, total: rooms.length }
  }, [rooms])

  // ── Filtered rooms ──
  const filteredRooms = useMemo(() => {
    let filtered = rooms

    if (activeFilter === "all") {
      // Show rooms that need attention (have cleaning status or active task)
      filtered = rooms.filter((r) => r.cleaningStatus !== null || r.activeTask !== null)
    } else if (activeFilter === "active") {
      filtered = rooms.filter((r) => r.activeTask !== null)
    } else {
      filtered = rooms.filter((r) => r.cleaningStatus === activeFilter)
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (r) =>
          r.number.toLowerCase().includes(q) ||
          (r.name && r.name.toLowerCase().includes(q))
      )
    }

    return filtered
  }, [rooms, activeFilter, searchQuery])

  // ── Open task detail ──
  const openTaskDetail = async (taskId: string) => {
    setSelectedTaskId(taskId)
    setIsTaskLoading(true)
    try {
      const res = await fetch(`/api/housekeeping/tasks/${taskId}`)
      if (!res.ok) throw new Error("Tâche introuvable")
      const data = await res.json()
      setSelectedTask(data.task)
      setTaskNotes(data.task?.notes || "")
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger la tâche", variant: "destructive" })
      setSelectedTaskId(null)
    } finally {
      setIsTaskLoading(false)
    }
  }

  const closeTaskDetail = () => {
    setSelectedTaskId(null)
    setSelectedTask(null)
    setTaskNotes("")
  }

  // ── Toggle checklist item ──
  const toggleChecklistItem = async (taskId: string, itemId: string, checked: boolean, notes?: string) => {
    setIsTogglingItem(itemId)
    try {
      const res = await fetch(`/api/housekeeping/tasks/${taskId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked, notes }),
      })
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()

      // Update local state
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({
          ...selectedTask,
          items: selectedTask.items.map((item) =>
            item.id === itemId
              ? { ...item, checked, checkedAt: data.item?.checkedAt || new Date().toISOString(), checkedBy: data.item?.checkedBy || { id: session?.user?.id || "", name: session?.user?.name || "" } }
              : item
          ),
        })
      }

      // Update room card progress
      if (checked) {
        setRooms((prev) =>
          prev.map((r) => {
            if (r.activeTask && r.activeTask.id === taskId) {
              return {
                ...r,
                activeTask: {
                  ...r.activeTask,
                  progress: { checked: r.activeTask.progress.checked + 1, total: r.activeTask.progress.total },
                },
              }
            }
            return r
          })
        )
      } else {
        setRooms((prev) =>
          prev.map((r) => {
            if (r.activeTask && r.activeTask.id === taskId) {
              return {
                ...r,
                activeTask: {
                  ...r.activeTask,
                  progress: { checked: Math.max(0, r.activeTask.progress.checked - 1), total: r.activeTask.progress.total },
                },
              }
            }
            return r
          })
        )
      }
    } catch {
      toast({ title: "Erreur", description: "Erreur lors de la mise à jour", variant: "destructive" })
    } finally {
      setIsTogglingItem(null)
    }
  }

  // ── Save anomaly note ──
  const saveAnomalyNote = async () => {
    if (!anomalyItem || !selectedTask) return
    setIsSavingAnomaly(true)
    try {
      const item = selectedTask.items.find((i) => i.id === anomalyItem.itemId)
      const isChecked = item?.checked ?? false
      await toggleChecklistItem(anomalyItem.taskId, anomalyItem.itemId, isChecked, anomalyNoteInput || undefined)
      setAnomalyItem(null)
      setAnomalyNoteInput("")
      toast({ title: "Note enregistrée", description: "Note d'anomalie enregistrée" })
    } catch {
      toast({ title: "Erreur", description: "Erreur lors de l'enregistrement", variant: "destructive" })
    } finally {
      setIsSavingAnomaly(false)
    }
  }

  // ── Update task status ──
  const updateTaskStatus = async (taskId: string, updates: Record<string, unknown>) => {
    setIsUpdatingTask(true)
    try {
      const res = await fetch(`/api/housekeeping/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erreur lors de la mise à jour")
      }
      const data = await res.json()

      // Refresh task detail
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(data.task)
        setTaskNotes(data.task?.notes || "")
      }

      // Refresh rooms list
      fetchRooms(true)
      toast({ title: "Mise à jour", description: "Tâche mise à jour" })
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Erreur", variant: "destructive" })
    } finally {
      setIsUpdatingTask(false)
    }
  }

  // ── Create task ──
  const handleCreateTask = async () => {
    if (!createDialogRoom) return
    setIsCreating(true)
    try {
      const body: Record<string, unknown> = {
        roomId: createDialogRoom.id,
        priority: createPriority,
      }
      if (assignToId) body.assignedToId = assignToId
      if (createNotes.trim()) body.notes = createNotes.trim()

      const res = await fetch("/api/housekeeping/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erreur lors de la création")
      }

      const data = await res.json()
      toast({ title: "Tâche créée", description: "Tâche de ménage créée avec succès" })
      setCreateDialogOpen(false)
      setCreateDialogRoom(null)
      setAssignToId("")
      setCreateNotes("")
      setCreatePriority("normal")

      // Open the task detail
      if (data.task?.id) {
        openTaskDetail(data.task.id)
      }

      fetchRooms(true)
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Erreur", variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  // ── Report damage ──
  const handleReportDamage = async () => {
    if (!selectedTask || !damageNoteInput.trim()) return
    setIsReportingDamage(true)
    try {
      await updateTaskStatus(selectedTask.id, {
        status: "needs_repair",
        damageNotes: damageNoteInput.trim(),
        hasDamage: true,
      })
      setDamageDialogOpen(false)
      setDamageNoteInput("")
    } catch {
      // error handled in updateTaskStatus
    } finally {
      setIsReportingDamage(false)
    }
  }

  // ── Save task notes ──
  const handleSaveTaskNotes = async () => {
    if (!selectedTask) return
    await updateTaskStatus(selectedTask.id, { notes: taskNotes })
  }

  // ── Assign staff ──
  const handleAssignStaff = async (userId: string) => {
    if (!selectedTask) return
    await updateTaskStatus(selectedTask.id, { assignedToId: userId || null })
    setAssignDialogOpen(false)
  }

  // ── Fetch history ──
  const openHistory = async (room: RoomWithCleaning) => {
    setHistoryRoom(room)
    setIsHistoryLoading(true)
    try {
      const res = await fetch(`/api/housekeeping/history?roomId=${room.id}`)
      if (res.ok) {
        const data = await res.json()
        setHistoryData(data.tasks || [])
      }
    } catch {
      // ignore
    } finally {
      setIsHistoryLoading(false)
    }
  }

  // ── Group items by category ──
  const groupedItems = useMemo(() => {
    if (!selectedTask) return new Map<string, ChecklistItem[]>()
    const map = new Map<string, ChecklistItem[]>()
    selectedTask.items.forEach((item) => {
      const cat = item.category || "general"
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(item)
    })
    return map
  }, [selectedTask])

  // ── Checked count ──
  const checkedCount = useMemo(() => {
    if (!selectedTask) return 0
    return selectedTask.items.filter((i) => i.checked).length
  }, [selectedTask])

  const totalCount = useMemo(() => {
    return selectedTask?.items.length || 0
  }, [selectedTask])

  const allChecked = checkedCount === totalCount && totalCount > 0

  // ── Loading state ──
  if (authStatus === "loading" || (isLoading && rooms.length === 0)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-pink-500" />
            Ménage
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Gestion du nettoyage et des tâches de ménage
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchRooms(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("w-4 h-4 mr-1.5", isRefreshing && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Migration warning */}
      {!error && !hasCleaningTasks && (
        <div className="p-3 text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Migration de la base de données requise</p>
            <p className="text-xs mt-0.5 opacity-80">
              Les nouvelles colonnes et tables de ménage n'ont pas encore été créées sur le serveur. Exécutez la migration PostgreSQL pour activer les fonctionnalités avancées (checklist, historique…).
            </p>
          </div>
        </div>
      )}

      {/* Summary stats bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setActiveFilter("all")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            activeFilter === "all"
              ? "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 ring-2 ring-pink-300 dark:ring-pink-700"
              : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          )}
        >
          Toutes
          <span className="font-bold">{stats.activeTasks}</span>
        </button>
        {[
          { key: "departure", label: "En départ", dot: "bg-amber-500", active: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-amber-300 dark:ring-amber-700" },
          { key: "cleaning", label: "En cours", dot: "bg-sky-500", active: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 ring-sky-300 dark:ring-sky-700" },
          { key: "clean", label: "Terminé", dot: "bg-green-500", active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 ring-green-300 dark:ring-green-700" },
          { key: "verified", label: "Vérifié", dot: "bg-emerald-500", active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 ring-emerald-300 dark:ring-emerald-700" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveFilter(activeFilter === s.key ? "all" : s.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              activeFilter === s.key
                ? s.active + " ring-2 ring-offset-1"
                : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            <span className={cn("w-2 h-2 rounded-full", s.dot)} />
            {s.label}
            <span className="font-bold">{stats[s.key as keyof typeof stats] || 0}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Rechercher une chambre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Room cards grid */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
            Aucune chambre à afficher
          </h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            {searchQuery
              ? "Aucun résultat pour cette recherche."
              : "Toutes les chambres sont propres. Aucune tâche de ménage en cours."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const csInfo = room.cleaningStatus ? getCleaningStatusInfo(room.cleaningStatus) : null
            const rsInfo = roomStatusInfo[room.status]
            const taskInfo = room.activeTask
            const progressPercent = taskInfo
              ? Math.round((taskInfo.progress.checked / taskInfo.progress.total) * 100)
              : 0

            return (
              <Card
                key={room.id}
                className={cn(
                  "overflow-hidden transition-all hover:shadow-md border-l-4",
                  hasCleaningTasks ? "cursor-pointer" : "opacity-70",
                  csInfo?.borderColor || "border-gray-200 dark:border-gray-700"
                )}
                onClick={() => {
                  if (!hasCleaningTasks) return
                  if (taskInfo) {
                    openTaskDetail(taskInfo.id)
                  } else {
                    // Open create dialog
                    setCreateDialogRoom(room)
                    setCreateDialogOpen(true)
                  }
                }}
              >
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-pink-50 dark:bg-pink-950 flex items-center justify-center flex-shrink-0">
                        <BedDouble className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold truncate">
                          Chambre {room.number}
                        </CardTitle>
                        {room.name && (
                          <p className="text-xs text-gray-400 truncate">{room.name}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 flex-shrink-0", rsInfo?.color)}>
                      {rsInfo?.label || room.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 space-y-3">
                  {/* Cleaning status */}
                  {csInfo ? (
                    <Badge className={cn("text-xs font-medium w-full justify-center py-1", csInfo.color)}>
                      <span className={cn("w-2 h-2 rounded-full mr-1.5", csInfo.dotColor)} />
                      {csInfo.label}
                    </Badge>
                  ) : taskInfo ? (
                    <Badge className={cn("text-xs font-medium w-full justify-center py-1", getTaskStatusInfo(taskInfo.status).color)}>
                      <span className={cn("w-2 h-2 rounded-full mr-1.5", getTaskStatusInfo(taskInfo.status).dotColor)} />
                      {getTaskStatusInfo(taskInfo.status).label}
                    </Badge>
                  ) : null}

                  {/* Assigned person */}
                  {taskInfo?.assignedTo && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">{taskInfo.assignedTo.name}</span>
                    </div>
                  )}

                  {/* Progress bar */}
                  {taskInfo && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {taskInfo.progress.checked}/{taskInfo.progress.total} points vérifiés
                        </span>
                        <span className="font-medium">{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  )}

                  {/* Time */}
                  {taskInfo?.startedAt && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(taskInfo.startedAt)}
                    </div>
                  )}

                  {/* Notes preview */}
                  {room.cleaningNotes && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded px-2 py-1.5">
                      <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{room.cleaningNotes}</span>
                    </div>
                  )}

                  {/* Action button */}
                  <Button
                    variant={taskInfo ? "outline" : "default"}
                    size="sm"
                    className="w-full text-xs"
                    disabled={!hasCleaningTasks}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!hasCleaningTasks) return
                      if (taskInfo) {
                        openTaskDetail(taskInfo.id)
                      } else {
                        setCreateDialogRoom(room)
                        setCreateDialogOpen(true)
                      }
                    }}
                  >
                    {!hasCleaningTasks ? (
                      <>
                        <CircleAlert className="w-3.5 h-3.5 mr-1.5" />
                        Migration requise
                      </>
                    ) : taskInfo ? (
                      <>
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Voir la checklist
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Démarrer le ménage
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Task Detail Sheet ── */}
      <Sheet open={!!selectedTaskId} onOpenChange={(open) => !open && closeTaskDetail()}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          {isTaskLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
          ) : selectedTask ? (
            <>
              {/* Header */}
              <SheetHeader className="p-4 pb-3 border-b bg-gradient-to-r from-pink-50 to-transparent dark:from-pink-950/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center flex-shrink-0">
                      <BedDouble className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="min-w-0">
                      <SheetTitle className="text-base">
                        Chambre {selectedTask.room.number}
                        {selectedTask.room.name && (
                          <span className="text-gray-400 font-normal"> — {selectedTask.room.name}</span>
                        )}
                      </SheetTitle>
                      <SheetDescription className="flex items-center gap-2 mt-0.5">
                        {getPriorityBadge(selectedTask.priority)}
                        <Badge className={cn("text-[10px]", getTaskStatusInfo(selectedTask.status).color)}>
                          {getTaskStatusInfo(selectedTask.status).label}
                        </Badge>
                      </SheetDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={closeTaskDetail}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Assigned person + history */}
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <button
                    onClick={() => isFullAccess && setAssignDialogOpen(true)}
                    className={cn(
                      "flex items-center gap-1.5 text-gray-500 dark:text-gray-400",
                      isFullAccess && "hover:text-pink-600 dark:hover:text-pink-400 cursor-pointer"
                    )}
                  >
                    <User className="w-3.5 h-3.5" />
                    {selectedTask.assignedTo ? selectedTask.assignedTo.name : "Non assigné"}
                    {isFullAccess && <ChevronRight className="w-3 h-3" />}
                  </button>
                  {selectedTask.startedAt && (
                    <span className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(selectedTask.startedAt)}
                    </span>
                  )}
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
                <div className="p-4 space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">
                        Progression : {checkedCount}/{totalCount}
                      </span>
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        allChecked
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      )}>
                        {Math.round((checkedCount / totalCount) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.round((checkedCount / totalCount) * 100)}
                      className="h-2.5"
                    />
                    {allChecked && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Tous les points ont été vérifiés
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Checklist grouped by category */}
                  <div className="space-y-4">
                    {checklistCategories.map((cat) => {
                      const items = groupedItems.get(cat.key) || []
                      if (items.length === 0) return null
                      const CatIcon = cat.icon
                      const catChecked = items.filter((i) => i.checked).length
                      const catTotal = items.length

                      return (
                        <div key={cat.key} className={cn("rounded-xl border p-3 space-y-2", cat.bgLight, cat.borderLight)}>
                          {/* Category header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CatIcon className={cn("w-4 h-4", cat.color)} />
                              <span className={cn("text-sm font-semibold", cat.color)}>{cat.label}</span>
                            </div>
                            <span className={cn(
                              "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                              catChecked === catTotal
                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                : "bg-white/60 dark:bg-black/20 text-gray-500"
                            )}>
                              {catChecked}/{catTotal}
                            </span>
                          </div>

                          {/* Checklist items */}
                          <div className="space-y-1.5">
                            {items.sort((a, b) => a.sortOrder - b.sortOrder).map((item) => (
                              <div
                                key={item.id}
                                className={cn(
                                  "flex items-start gap-3 rounded-lg p-2.5 transition-all min-h-[44px]",
                                  item.checked
                                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50"
                                    : "bg-white/70 dark:bg-black/20 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                )}
                              >
                                {/* Big checkbox */}
                                <button
                                  disabled={isTogglingItem === item.id}
                                  onClick={() => toggleChecklistItem(selectedTask.id, item.id, !item.checked)}
                                  className={cn(
                                    "flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all mt-0.5",
                                    item.checked
                                      ? "bg-green-500 border-green-500 text-white"
                                      : "border-gray-300 dark:border-gray-600 hover:border-pink-400 dark:hover:border-pink-500"
                                  )}
                                >
                                  {isTogglingItem === item.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                                  ) : item.checked ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                  ) : null}
                                </button>

                                {/* Item content */}
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "text-sm leading-snug",
                                    item.checked
                                      ? "text-green-700 dark:text-green-300 line-through"
                                      : "text-gray-700 dark:text-gray-300"
                                  )}>
                                    {item.label}
                                  </p>
                                  {/* Item notes */}
                                  {item.notes && (
                                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span className="line-clamp-1">{item.notes}</span>
                                    </div>
                                  )}
                                  {/* Checked info */}
                                  {item.checked && item.checkedAt && (
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                      {formatDateFull(item.checkedAt)}
                                      {item.checkedBy?.name && ` — ${item.checkedBy.name}`}
                                    </p>
                                  )}
                                </div>

                                {/* Anomaly button */}
                                <button
                                  onClick={() => {
                                    setAnomalyItem({
                                      taskId: selectedTask.id,
                                      itemId: item.id,
                                      currentNote: item.notes,
                                    })
                                    setAnomalyNoteInput(item.notes || "")
                                  }}
                                  className={cn(
                                    "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all mt-0.5",
                                    item.notes
                                      ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                                      : "bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-600 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-amber-900/30 dark:hover:text-amber-400"
                                  )}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <Separator />

                  {/* Damage info */}
                  {selectedTask.hasDamage && selectedTask.damageNotes && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                        <Wrench className="w-4 h-4" />
                        Dégradation signalée
                      </div>
                      <p className="text-xs text-red-600 dark:text-red-400">{selectedTask.damageNotes}</p>
                    </div>
                  )}

                  {/* Notes section */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Notes générales</Label>
                    <Textarea
                      value={taskNotes}
                      onChange={(e) => setTaskNotes(e.target.value)}
                      onBlur={handleSaveTaskNotes}
                      placeholder="Ajouter des notes sur le ménage..."
                      rows={3}
                      className="text-sm"
                    />
                  </div>

                  <Separator />

                  {/* History button */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-500 dark:text-gray-400"
                    onClick={() => {
                      const room = rooms.find((r) => r.id === selectedTask.roomId)
                      if (room) openHistory(room)
                    }}
                  >
                    <History className="w-4 h-4 mr-2" />
                    Voir l&apos;historique de nettoyage
                  </Button>
                </div>
              </ScrollArea>

              {/* Action buttons */}
              <div className="border-t p-4 space-y-2 bg-gray-50 dark:bg-gray-900/50">
                {/* Start task */}
                {selectedTask.status === "pending" && (
                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                    onClick={() => updateTaskStatus(selectedTask.id, { status: "in_progress" })}
                    disabled={isUpdatingTask}
                  >
                    {isUpdatingTask ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowUpCircle className="w-4 h-4 mr-2" />
                    )}
                    Marquer en cours
                  </Button>
                )}

                {/* Mark completed */}
                {selectedTask.status === "in_progress" && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      if (!allChecked) {
                        toast({ title: "Attention", description: "Certains points ne sont pas encore vérifiés. La tâche sera marquée terminée." })
                      }
                      updateTaskStatus(selectedTask.id, { status: "completed" })
                    }}
                    disabled={isUpdatingTask}
                  >
                    {isUpdatingTask ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Marquer terminé
                    {!allChecked && (
                      <span className="ml-1.5 text-green-200 text-xs">({totalCount - checkedCount} restant)</span>
                    )}
                  </Button>
                )}

                {/* Verify (gouvernante/owner only) */}
                {selectedTask.status === "completed" && userCanVerify && (
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => updateTaskStatus(selectedTask.id, { status: "verified" })}
                    disabled={isUpdatingTask}
                  >
                    {isUpdatingTask ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4 mr-2" />
                    )}
                    Valider / Vérifier
                  </Button>
                )}

                {/* Verified badge */}
                {selectedTask.status === "verified" && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    <Shield className="w-4 h-4" />
                    Tâche vérifiée
                    {selectedTask.verifiedBy && (
                      <span className="text-gray-400 font-normal">par {selectedTask.verifiedBy.name}</span>
                    )}
                  </div>
                )}

                {/* Needs repair info */}
                {selectedTask.status === "needs_repair" && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-red-600 dark:text-red-400 font-medium">
                    <Wrench className="w-4 h-4" />
                    En attente de réparation
                  </div>
                )}

                {/* Report damage */}
                {(selectedTask.status === "in_progress" || selectedTask.status === "pending") && (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30 dark:text-red-400"
                    onClick={() => setDamageDialogOpen(true)}
                    disabled={isUpdatingTask}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Signaler une dégradation
                  </Button>
                )}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* ── Create Task Dialog ── */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) { setCreateDialogOpen(false); setCreateDialogRoom(null) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              Démarrer le ménage
            </DialogTitle>
            <DialogDescription>
              Chambre {createDialogRoom?.number}
              {createDialogRoom?.name && ` — ${createDialogRoom.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Assign to */}
            <div className="space-y-2">
              <Label className="text-sm">Assigner à (optionnel)</Label>
              <Select value={assignToId} onValueChange={setAssignToId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Non assigné" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non assigné</SelectItem>
                  {staffList.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-sm">Priorité</Label>
              <Select value={createPriority} onValueChange={setCreatePriority}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="normal">Normale</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm">Notes (optionnel)</Label>
              <Textarea
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                placeholder="Ex : Client parti tôt, vérifier le minibar..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setCreateDialogRoom(null) }}>
              Annuler
            </Button>
            <Button
              className="bg-pink-600 hover:bg-pink-700 text-white"
              onClick={handleCreateTask}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Créer la tâche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Anomaly Note Dialog ── */}
      <Dialog open={!!anomalyItem} onOpenChange={(open) => !open && setAnomalyItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Note d&apos;anomalie
            </DialogTitle>
            <DialogDescription>
              Signalez un problème ou une anomalie pour ce point de contrôle.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm">Description de l&apos;anomalie</Label>
              <Textarea
                value={anomalyNoteInput}
                onChange={(e) => setAnomalyNoteInput(e.target.value)}
                placeholder="Décrivez le problème constaté..."
                rows={3}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAnomalyItem(null)}>
              Annuler
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30 dark:text-red-400"
              onClick={() => {
                if (anomalyItem) {
                  toggleChecklistItem(anomalyItem.taskId, anomalyItem.itemId, false)
                  setAnomalyItem(null)
                  setAnomalyNoteInput("")
                }
              }}
            >
              <X className="w-4 h-4 mr-1.5" />
              Effacer la note
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={saveAnomalyNote}
              disabled={isSavingAnomaly || !anomalyNoteInput.trim()}
            >
              {isSavingAnomaly ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Damage Dialog ── */}
      <Dialog open={damageDialogOpen} onOpenChange={(open) => !open && setDamageDialogOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Wrench className="w-5 h-5" />
              Signaler une dégradation
            </DialogTitle>
            <DialogDescription>
              La tâche sera marquée comme &quot;À réparer&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm">Description de la dégradation</Label>
              <Textarea
                value={damageNoteInput}
                onChange={(e) => setDamageNoteInput(e.target.value)}
                placeholder="Décrivez la dégradation constatée..."
                rows={4}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDamageDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleReportDamage}
              disabled={isReportingDamage || !damageNoteInput.trim()}
            >
              {isReportingDamage ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wrench className="w-4 h-4 mr-2" />
              )}
              Signaler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign Staff Dialog ── */}
      <Dialog open={assignDialogOpen} onOpenChange={(open) => !open && setAssignDialogOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-pink-500" />
              Assigner le personnel
            </DialogTitle>
            <DialogDescription>
              Choisissez la personne responsable de cette tâche.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-64 overflow-y-auto">
            {/* Unassign option */}
            <button
              onClick={() => handleAssignStaff("")}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                !selectedTask?.assignedToId
                  ? "border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-950/30"
                  : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-900"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Non assigné</p>
                <p className="text-xs text-gray-400">Tâche sans responsable</p>
              </div>
            </button>

            {staffList.map((user) => (
              <button
                key={user.id}
                onClick={() => handleAssignStaff(user.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  selectedTask?.assignedToId === user.id
                    ? "border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-950/30"
                    : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-900"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                  <p className="text-xs text-gray-400">{user.role}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── History Sheet ── */}
      <Sheet open={!!historyRoom} onOpenChange={(open) => !open && setHistoryRoom(null)}>
        <SheetContent side="bottom" className="max-h-[70vh]">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-pink-500" />
              Historique de nettoyage
            </SheetTitle>
            <SheetDescription>
              Chambre {historyRoom?.number}
              {historyRoom?.name && ` — ${historyRoom.name}`}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(70vh-100px)] mt-2">
            {isHistoryLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
              </div>
            ) : historyData.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                Aucun historique de nettoyage
              </div>
            ) : (
              <div className="space-y-3">
                {historyData.map((entry) => {
                  const duration =
                    entry.startedAt && entry.completedAt
                      ? formatDistanceToNow(new Date(entry.startedAt), { locale: fr })
                      : null
                  const statusInfo = getTaskStatusInfo(entry.status)

                  return (
                    <Card key={entry.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-[10px]", statusInfo.color)}>
                              {statusInfo.label}
                            </Badge>
                            {entry.assignedTo && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {entry.assignedTo.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-gray-400">
                            {entry.completedAt && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {formatDateFull(entry.completedAt)}
                              </span>
                            )}
                            {entry.verifiedBy && (
                              <span className="flex items-center gap-1 text-emerald-500">
                                <Shield className="w-3 h-3" />
                                Vérifié par {entry.verifiedBy.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium">
                            {entry.progress.checked}/{entry.progress.total}
                          </div>
                          <div className="text-[10px] text-gray-400">points</div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
