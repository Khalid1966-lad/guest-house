"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Settings,
  MapPin,
  Calendar,
  User,
  Plus,
  Trash2,
  Save,
  Loader2,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BedDouble,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// ─── Types ──────────────────────────────────────────────────────────────

interface HousekeepingSettings {
  autoAssignHousekeeping: boolean
  autoAssignMode: string
  autoStartCleaning: boolean
  defaultCleaningPriority: string
}

interface ZoneUser {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string
  role: string
  isActive: boolean
}

interface HousekeepingZone {
  id: string
  userId: string
  zoneType: string
  floorNumber: number | null
  roomIds: string
  zoneName: string | null
  user: ZoneUser
}

interface StaffScheduleEntry {
  id: string
  userId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
  user: ZoneUser
}

interface StaffMember {
  id: string
  name: string | null
  email: string
  role: string
}

interface RoomOption {
  id: string
  number: string
  name: string | null
  floor: number | null
}

interface HousekeepingSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffList: StaffMember[]
}

// ─── Constants ──────────────────────────────────────────────────────────

const HOUSEKEEPING_ROLES = ["femmeDeMenage", "gouvernant", "gouvernante"]

const ROLE_LABELS: Record<string, string> = {
  femmeDeMenage: "Femme de ménage",
  gouvernant: "Gouvernant",
  gouvernante: "Gouvernante",
}

const ZONE_TYPE_LABELS: Record<string, string> = {
  floor: "Par étage",
  room: "Par chambre",
  custom: "Personnalisé",
}

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

// dayOfWeek: 1=Mon ... 6=Sat, 0=Sun
const DAY_OF_WEEK_MAP = [1, 2, 3, 4, 5, 6, 0]

const DEFAULT_SETTINGS: HousekeepingSettings = {
  autoAssignHousekeeping: false,
  autoAssignMode: "zone",
  autoStartCleaning: false,
  defaultCleaningPriority: "normal",
}

const DEFAULT_DAYS = () =>
  DAY_OF_WEEK_MAP.map((dow) => ({
    dayOfWeek: dow,
    startTime: "07:00",
    endTime: "15:00",
    isAvailable: dow !== 0, // Mon-Sat available, Sunday off
  }))

// ─── Component ──────────────────────────────────────────────────────────

export default function HousekeepingSettingsSheet({
  open,
  onOpenChange,
  staffList,
}: HousekeepingSettingsProps) {
  const { toast } = useToast()

  // ── State ──
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("auto-assign")

  // Tab 1: Auto-assignment settings
  const [settings, setSettings] = useState<HousekeepingSettings>(DEFAULT_SETTINGS)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Tab 2: Zones
  const [zones, setZones] = useState<HousekeepingZone[]>([])
  const [isLoadingZones, setIsLoadingZones] = useState(false)
  const [isSavingZone, setIsSavingZone] = useState<string | null>(null)
  const [isDeletingZone, setIsDeletingZone] = useState<string | null>(null)
  // New zone form
  const [showNewZone, setShowNewZone] = useState(false)
  const [newZoneUserId, setNewZoneUserId] = useState("")
  const [newZoneType, setNewZoneType] = useState("floor")
  const [newZoneFloor, setNewZoneFloor] = useState("")
  const [newZoneRoomIds, setNewZoneRoomIds] = useState<string[]>([])
  const [newZoneName, setNewZoneName] = useState("")
  // Edit zone (inline)
  const [editingZoneUserId, setEditingZoneUserId] = useState<string | null>(null)
  const [editZoneType, setEditZoneType] = useState("")
  const [editZoneFloor, setEditZoneFloor] = useState("")
  const [editZoneRoomIds, setEditZoneRoomIds] = useState<string[]>([])
  const [editZoneName, setEditZoneName] = useState("")

  // Tab 3: Schedule
  const [schedules, setSchedules] = useState<StaffScheduleEntry[]>([])
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false)
  const [isSavingSchedule, setIsSavingSchedule] = useState<string | null>(null)
  // Per-staff edited schedules
  const [editedSchedules, setEditedSchedules] = useState<Record<string, typeof DEFAULT_DAYS extends () => infer R ? R : never>>({})

  // Rooms list (for zone room selection)
  const [rooms, setRooms] = useState<RoomOption[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)

  // ── Housekeeping staff filter ──
  const housekeepingStaff = staffList.filter(
    (s) => HOUSEKEEPING_ROLES.includes(s.role)
  )

  // ── Fetch settings (Tab 1) ──
  const fetchSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/settings/establishment")
      if (res.ok) {
        const data = await res.json()
        const s = data.guestHouse?.settings
        if (s) {
          setSettings({
            autoAssignHousekeeping: s.autoAssignHousekeeping ?? false,
            autoAssignMode: s.autoAssignMode || "zone",
            autoStartCleaning: s.autoStartCleaning ?? false,
            defaultCleaningPriority: s.defaultCleaningPriority || "normal",
          })
        }
        setSettingsLoaded(true)
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Fetch zones (Tab 2) ──
  const fetchZones = useCallback(async () => {
    setIsLoadingZones(true)
    try {
      const res = await fetch("/api/housekeeping/zones")
      if (res.ok) {
        const data = await res.json()
        setZones(data.zones || [])
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingZones(false)
    }
  }, [])

  // ── Fetch schedules (Tab 3) ──
  const fetchSchedules = useCallback(async () => {
    setIsLoadingSchedules(true)
    try {
      const res = await fetch("/api/housekeeping/schedule")
      if (res.ok) {
        const data = await res.json()
        const entries: StaffScheduleEntry[] = data.schedules || []
        setSchedules(entries)
        // Build edited schedules per user
        const grouped: Record<string, { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }[]> = {}
        for (const entry of entries) {
          if (!grouped[entry.userId]) {
            grouped[entry.userId] = DEFAULT_DAYS()
          }
          const dayIdx = grouped[entry.userId].findIndex(
            (d) => d.dayOfWeek === entry.dayOfWeek
          )
          if (dayIdx >= 0) {
            grouped[entry.userId][dayIdx] = {
              dayOfWeek: entry.dayOfWeek,
              startTime: entry.startTime,
              endTime: entry.endTime,
              isAvailable: entry.isAvailable,
            }
          }
        }
        setEditedSchedules(grouped)
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingSchedules(false)
    }
  }, [])

  // ── Fetch rooms (for zone room selection) ──
  const fetchRooms = useCallback(async () => {
    setIsLoadingRooms(true)
    try {
      const res = await fetch("/api/housekeeping")
      if (res.ok) {
        const data = await res.json()
        setRooms(
          (data.rooms || []).map((r: { id: string; number: string; name: string | null; floor: number | null }) => ({
            id: r.id,
            number: r.number,
            name: r.name,
            floor: r.floor,
          }))
        )
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingRooms(false)
    }
  }, [])

  // ── Load data when sheet opens ──
  useEffect(() => {
    if (!open) return
    setActiveTab("auto-assign")
    fetchSettings()
    fetchZones()
    fetchSchedules()
    fetchRooms()
    // Reset new zone form
    setShowNewZone(false)
    setNewZoneUserId("")
    setNewZoneType("floor")
    setNewZoneFloor("")
    setNewZoneRoomIds([])
    setNewZoneName("")
    setEditingZoneUserId(null)
  }, [open, fetchSettings, fetchZones, fetchSchedules, fetchRooms])

  // ── Save settings (Tab 1) ──
  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    try {
      const res = await fetch("/api/settings/establishment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erreur")
      }
      toast({
        title: "Paramètres enregistrés",
        description: "Les paramètres d'auto-assignation ont été mis à jour.",
      })
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de l'enregistrement",
        variant: "destructive",
      })
    } finally {
      setIsSavingSettings(false)
    }
  }

  // ── Save zone (Tab 2) ──
  const handleSaveZone = async (
    userId: string,
    zoneType: string,
    floorNumber: string,
    roomIds: string[],
    zoneName: string,
    mode: "new" | "edit"
  ) => {
    setIsSavingZone(userId)
    try {
      const body: Record<string, unknown> = {
        userId,
        zoneType,
        zoneName: zoneName || null,
      }
      if (zoneType === "floor") {
        body.floorNumber = floorNumber ? parseInt(floorNumber) : null
        body.roomIds = []
      } else if (zoneType === "room") {
        body.floorNumber = null
        body.roomIds = roomIds
      } else {
        body.floorNumber = null
        body.roomIds = []
      }

      const res = await fetch("/api/housekeeping/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erreur")
      }

      toast({
        title: "Zone enregistrée",
        description: mode === "new" ? "Nouvelle zone d'assignation créée." : "Zone mise à jour.",
      })

      if (mode === "new") {
        setShowNewZone(false)
        setNewZoneUserId("")
        setNewZoneType("floor")
        setNewZoneFloor("")
        setNewZoneRoomIds([])
        setNewZoneName("")
      } else {
        setEditingZoneUserId(null)
      }
      fetchZones()
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de l'enregistrement",
        variant: "destructive",
      })
    } finally {
      setIsSavingZone(null)
    }
  }

  // ── Delete zone (Tab 2) ──
  const handleDeleteZone = async (userId: string) => {
    setIsDeletingZone(userId)
    try {
      const res = await fetch(`/api/housekeeping/zones?userId=${userId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erreur")
      }
      toast({
        title: "Zone supprimée",
        description: "La zone d'assignation a été supprimée.",
      })
      fetchZones()
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la suppression",
        variant: "destructive",
      })
    } finally {
      setIsDeletingZone(null)
    }
  }

  // ── Save schedule (Tab 3) ──
  const handleSaveSchedule = async (userId: string) => {
    const days = editedSchedules[userId]
    if (!days) return

    setIsSavingSchedule(userId)
    try {
      const res = await fetch("/api/housekeeping/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, days }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erreur")
      }
      toast({
        title: "Emploi du temps enregistré",
        description: "Les horaires ont été mis à jour.",
      })
      fetchSchedules()
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de l'enregistrement",
        variant: "destructive",
      })
    } finally {
      setIsSavingSchedule(null)
    }
  }

  // ── Edit schedule day ──
  const updateScheduleDay = (userId: string, dayOfWeek: number, field: string, value: boolean | string) => {
    setEditedSchedules((prev) => {
      const userDays = prev[userId] || DEFAULT_DAYS()
      const idx = userDays.findIndex((d) => d.dayOfWeek === dayOfWeek)
      if (idx < 0) return prev
      const updated = [...userDays]
      updated[idx] = { ...updated[idx], [field]: value }
      return { ...prev, [userId]: updated }
    })
  }

  // ── Parse roomIds from zone ──
  const parseRoomIds = (roomIdsStr: string): string[] => {
    try {
      const parsed = JSON.parse(roomIdsStr)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  // ── Toggle room in multi-select ──
  const toggleRoomSelection = (roomId: string, mode: "new" | "edit") => {
    if (mode === "new") {
      setNewZoneRoomIds((prev) =>
        prev.includes(roomId)
          ? prev.filter((id) => id !== roomId)
          : [...prev, roomId]
      )
    } else {
      setEditZoneRoomIds((prev) =>
        prev.includes(roomId)
          ? prev.filter((id) => id !== roomId)
          : [...prev, roomId]
      )
    }
  }

  // ── Get staff name helper ──
  const getStaffName = (user: { name: string | null; firstName: string | null; lastName: string | null }) => {
    if (user.name) return user.name
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
    return user.firstName || user.lastName || "Sans nom"
  }

  // ── Users already assigned to a zone ──
  const assignedUserIds = new Set(zones.map((z) => z.userId))

  // ── Available users for new zone ──
  const availableUsersForZone = housekeepingStaff.filter(
    (s) => !assignedUserIds.has(s.id)
  )

  // ── Render ──
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="p-4 pb-3 border-b bg-gradient-to-r from-pink-50 to-transparent dark:from-pink-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <SheetTitle className="text-base">Paramètres du ménage</SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                Configuration de l'auto-assignation et des zones
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-0">
          <div className="border-b px-4">
            <TabsList className="w-full bg-transparent h-auto p-0 gap-0">
              <TabsTrigger
                value="auto-assign"
                className="flex-1 flex items-center justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-xs font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Auto-assignation
              </TabsTrigger>
              <TabsTrigger
                value="zones"
                className="flex-1 flex items-center justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-xs font-medium"
              >
                <MapPin className="w-3.5 h-3.5" />
                Zones
              </TabsTrigger>
              <TabsTrigger
                value="schedule"
                className="flex-1 flex items-center justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-xs font-medium"
              >
                <Calendar className="w-3.5 h-3.5" />
                Emploi du temps
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(100vh-180px)]">
            {/* ════════════════════════════════════════════════════════════
                TAB 1: Auto-assignation
            ════════════════════════════════════════════════════════════ */}
            <TabsContent value="auto-assign" className="mt-0 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Main toggle */}
                  <Card className="border-pink-200 dark:border-pink-900">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-500" />
                        Auto-assignation au départ
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoAssignToggle" className="text-sm cursor-pointer">
                          Activer l&apos;auto-assignation au départ
                        </Label>
                        <Switch
                          id="autoAssignToggle"
                          checked={settings.autoAssignHousekeeping}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              autoAssignHousekeeping: checked,
                            }))
                          }
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Lorsqu&apos;un client effectue un départ (check-out), une tâche de ménage sera automatiquement créée et assignée au personnel disponible.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Conditional settings */}
                  {settings.autoAssignHousekeeping && (
                    <>
                      {/* Assignment mode */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-pink-500" />
                            Mode d&apos;assignation
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <RadioGroup
                            value={settings.autoAssignMode}
                            onValueChange={(value) =>
                              setSettings((prev) => ({
                                ...prev,
                                autoAssignMode: value,
                              }))
                            }
                            className="space-y-3"
                          >
                            <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                              <RadioGroupItem value="zone" id="mode-zone" className="mt-0.5" />
                              <Label htmlFor="mode-zone" className="flex-1 cursor-pointer">
                                <span className="text-sm font-medium">Par zone (étage/chambre)</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  Les chambres sont assignées selon les zones configurées (étage ou chambres spécifiques).
                                </p>
                              </Label>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                              <RadioGroupItem value="round_robin" id="mode-roundrobin" className="mt-0.5" />
                              <Label htmlFor="mode-roundrobin" className="flex-1 cursor-pointer">
                                <span className="text-sm font-medium">Répartition automatique (round-robin)</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  Les tâches sont réparties équitablement entre le personnel disponible.
                                </p>
                              </Label>
                            </div>
                          </RadioGroup>
                        </CardContent>
                      </Card>

                      {/* Auto-start cleaning */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-pink-500" />
                            Démarrage automatique
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="autoStartToggle" className="text-sm cursor-pointer">
                              Démarrage automatique du ménage
                            </Label>
                            <Switch
                              id="autoStartToggle"
                              checked={settings.autoStartCleaning}
                              onCheckedChange={(checked) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  autoStartCleaning: checked,
                                }))
                              }
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Si activé, la tâche de ménage sera automatiquement mise en &quot;En cours&quot; à la création. Sinon, elle restera en &quot;En attente&quot;.
                          </p>
                        </CardContent>
                      </Card>

                      {/* Default priority */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-pink-500" />
                            Priorité par défaut
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Select
                            value={settings.defaultCleaningPriority}
                            onValueChange={(value) =>
                              setSettings((prev) => ({
                                ...prev,
                                defaultCleaningPriority: value,
                              }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Sélectionner la priorité" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                                  Basse
                                </span>
                              </SelectItem>
                              <SelectItem value="normal">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                                  Normale
                                </span>
                              </SelectItem>
                              <SelectItem value="high">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500" />
                                  Haute
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Priorité appliquée automatiquement aux tâches créées par l&apos;auto-assignation.
                          </p>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* Save button */}
                  {settingsLoaded && (
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                        className="bg-pink-600 hover:bg-pink-700 text-white"
                      >
                        {isSavingSettings ? (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-1.5" />
                        )}
                        Enregistrer
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ════════════════════════════════════════════════════════════
                TAB 2: Zones d'assignation
            ════════════════════════════════════════════════════════════ */}
            <TabsContent value="zones" className="mt-0 p-4">
              {isLoadingZones ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Info banner */}
                  <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800">
                    <p className="text-xs text-pink-700 dark:text-pink-300">
                      <MapPin className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      Assignez des zones aux agents de ménage. Chaque agent peut être assigné à un étage, des chambres spécifiques ou une zone personnalisée.
                    </p>
                  </div>

                  {/* Existing zones */}
                  {zones.length > 0 && (
                    <div className="space-y-3">
                      {zones.map((zone) => {
                        const isEditing = editingZoneUserId === zone.userId
                        const parsedRoomIds = parseRoomIds(zone.roomIds)

                        return (
                          <Card key={zone.id} className="overflow-hidden">
                            <CardHeader className="pb-2 px-4 pt-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <CardTitle className="text-sm font-medium truncate">
                                      {getStaffName(zone.user)}
                                    </CardTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {ROLE_LABELS[zone.user.role] || zone.user.role}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800"
                                  >
                                    {ZONE_TYPE_LABELS[zone.zoneType] || zone.zoneType}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>

                            {isEditing ? (
                              <CardContent className="px-4 pb-4 space-y-3 border-t pt-3">
                                {/* Zone type */}
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Type de zone</Label>
                                  <Select
                                    value={editZoneType}
                                    onValueChange={setEditZoneType}
                                  >
                                    <SelectTrigger className="h-9 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="floor">Par étage</SelectItem>
                                      <SelectItem value="room">Par chambre</SelectItem>
                                      <SelectItem value="custom">Personnalisé</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Floor number (if floor type) */}
                                {editZoneType === "floor" && (
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">Numéro d&apos;étage</Label>
                                    <Input
                                      type="number"
                                      placeholder="Ex: 1"
                                      value={editZoneFloor}
                                      onChange={(e) => setEditZoneFloor(e.target.value)}
                                      className="h-9 text-sm"
                                    />
                                  </div>
                                )}

                                {/* Room multi-select (if room type) */}
                                {editZoneType === "room" && (
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">
                                      Chambres ({editZoneRoomIds.length} sélectionnée{editZoneRoomIds.length > 1 ? "s" : ""})
                                    </Label>
                                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                                      {isLoadingRooms ? (
                                        <div className="flex items-center justify-center py-4">
                                          <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                                        </div>
                                      ) : rooms.length === 0 ? (
                                        <p className="text-xs text-gray-400 p-3">Aucune chambre trouvée.</p>
                                      ) : (
                                        rooms.map((room) => {
                                          const isSelected = editZoneRoomIds.includes(room.id)
                                          return (
                                            <button
                                              key={room.id}
                                              type="button"
                                              onClick={() => toggleRoomSelection(room.id, "edit")}
                                              className={cn(
                                                "flex items-center gap-2 w-full px-3 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 last:border-b-0 transition-colors",
                                                isSelected && "bg-pink-50 dark:bg-pink-950/20"
                                              )}
                                            >
                                              <div
                                                className={cn(
                                                  "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                                                  isSelected
                                                    ? "bg-pink-500 border-pink-500"
                                                    : "border-gray-300 dark:border-gray-600"
                                                )}
                                              >
                                                {isSelected && (
                                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                                )}
                                              </div>
                                              <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                                              <span>Chambre {room.number}</span>
                                              {room.name && (
                                                <span className="text-gray-400 truncate">— {room.name}</span>
                                              )}
                                            </button>
                                          )
                                        })
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Zone name (optional) */}
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Nom de la zone (optionnel)</Label>
                                  <Input
                                    placeholder="Ex: Aile Est, Bâtiment A..."
                                    value={editZoneName}
                                    onChange={(e) => setEditZoneName(e.target.value)}
                                    className="h-9 text-sm"
                                  />
                                </div>

                                {/* Edit actions */}
                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingZoneUserId(null)}
                                  >
                                    Annuler
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleSaveZone(
                                        zone.userId,
                                        editZoneType,
                                        editZoneFloor,
                                        editZoneRoomIds,
                                        editZoneName,
                                        "edit"
                                      )
                                    }
                                    disabled={isSavingZone === zone.userId}
                                    className="bg-pink-600 hover:bg-pink-700 text-white"
                                  >
                                    {isSavingZone === zone.userId ? (
                                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                    ) : (
                                      <Save className="w-4 h-4 mr-1.5" />
                                    )}
                                    Enregistrer
                                  </Button>
                                </div>
                              </CardContent>
                            ) : (
                              <CardContent className="px-4 pb-3 border-t pt-2">
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                                  {zone.zoneType === "floor" && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      Étage {zone.floorNumber}
                                    </span>
                                  )}
                                  {zone.zoneType === "room" && (
                                    <span className="flex items-center gap-1">
                                      <BedDouble className="w-3 h-3" />
                                      {parsedRoomIds.length > 0
                                        ? `${parsedRoomIds.length} chambre${parsedRoomIds.length > 1 ? "s" : ""}`
                                        : "Aucune chambre"}
                                    </span>
                                  )}
                                  {zone.zoneName && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {zone.zoneName}
                                    </Badge>
                                  )}
                                  {zone.zoneType === "room" && parsedRoomIds.length > 0 && (
                                    <span className="text-gray-400 truncate">
                                      ({rooms
                                        .filter((r) => parsedRoomIds.includes(r.id))
                                        .map((r) => r.number)
                                        .join(", ")})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={() => {
                                      setEditingZoneUserId(zone.userId)
                                      setEditZoneType(zone.zoneType)
                                      setEditZoneFloor(zone.floorNumber?.toString() || "")
                                      setEditZoneRoomIds(parseRoomIds(zone.roomIds))
                                      setEditZoneName(zone.zoneName || "")
                                    }}
                                  >
                                    Modifier
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    onClick={() => handleDeleteZone(zone.userId)}
                                    disabled={isDeletingZone === zone.userId}
                                  >
                                    {isDeletingZone === zone.userId ? (
                                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    Supprimer
                                  </Button>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        )
                      })}
                    </div>
                  )}

                  {/* Empty state */}
                  {zones.length === 0 && !showNewZone && (
                    <div className="text-center py-10">
                      <MapPin className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Aucune zone configurée
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Ajoutez des zones pour assigner automatiquement les chambres au personnel.
                      </p>
                    </div>
                  )}

                  {/* Add new zone */}
                  {showNewZone ? (
                    <Card className="border-dashed border-2 border-pink-300 dark:border-pink-700">
                      <CardHeader className="pb-2 px-4 pt-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-pink-600 dark:text-pink-400">
                          <Plus className="w-4 h-4" />
                          Nouvelle zone
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-3">
                        {/* Agent select */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Agent de ménage</Label>
                          <Select value={newZoneUserId} onValueChange={setNewZoneUserId}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Sélectionner un agent" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableUsersForZone.length > 0 ? (
                                availableUsersForZone.map((staff) => (
                                  <SelectItem key={staff.id} value={staff.id}>
                                    <span className="flex items-center gap-2">
                                      <User className="w-3.5 h-3.5 text-gray-400" />
                                      {staff.name || staff.email}
                                      <span className="text-[10px] text-gray-400">
                                        ({ROLE_LABELS[staff.role] || staff.role})
                                      </span>
                                    </span>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="_none" disabled>
                                  Tous les agents sont déjà assignés
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Zone type */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Type de zone</Label>
                          <Select value={newZoneType} onValueChange={setNewZoneType}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="floor">Par étage</SelectItem>
                              <SelectItem value="room">Par chambre</SelectItem>
                              <SelectItem value="custom">Personnalisé</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Floor number (if floor type) */}
                        {newZoneType === "floor" && (
                          <div className="space-y-1.5">
                            <Label className="text-xs">Numéro d&apos;étage</Label>
                            <Input
                              type="number"
                              placeholder="Ex: 1"
                              value={newZoneFloor}
                              onChange={(e) => setNewZoneFloor(e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                        )}

                        {/* Room multi-select (if room type) */}
                        {newZoneType === "room" && (
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              Chambres ({newZoneRoomIds.length} sélectionnée{newZoneRoomIds.length > 1 ? "s" : ""})
                            </Label>
                            <div className="border rounded-lg max-h-40 overflow-y-auto">
                              {isLoadingRooms ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                                </div>
                              ) : rooms.length === 0 ? (
                                <p className="text-xs text-gray-400 p-3">Aucune chambre trouvée.</p>
                              ) : (
                                rooms.map((room) => {
                                  const isSelected = newZoneRoomIds.includes(room.id)
                                  return (
                                    <button
                                      key={room.id}
                                      type="button"
                                      onClick={() => toggleRoomSelection(room.id, "new")}
                                      className={cn(
                                        "flex items-center gap-2 w-full px-3 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 last:border-b-0 transition-colors",
                                        isSelected && "bg-pink-50 dark:bg-pink-950/20"
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                                          isSelected
                                            ? "bg-pink-500 border-pink-500"
                                            : "border-gray-300 dark:border-gray-600"
                                        )}
                                      >
                                        {isSelected && (
                                          <CheckCircle2 className="w-3 h-3 text-white" />
                                        )}
                                      </div>
                                      <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                                      <span>Chambre {room.number}</span>
                                      {room.name && (
                                        <span className="text-gray-400 truncate">— {room.name}</span>
                                      )}
                                    </button>
                                  )
                                })
                              )}
                            </div>
                          </div>
                        )}

                        {/* Zone name (optional) */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Nom de la zone (optionnel)</Label>
                          <Input
                            placeholder="Ex: Aile Est, Bâtiment A..."
                            value={newZoneName}
                            onChange={(e) => setNewZoneName(e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowNewZone(false)
                              setNewZoneUserId("")
                              setNewZoneType("floor")
                              setNewZoneFloor("")
                              setNewZoneRoomIds([])
                              setNewZoneName("")
                            }}
                          >
                            Annuler
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleSaveZone(
                                newZoneUserId,
                                newZoneType,
                                newZoneFloor,
                                newZoneRoomIds,
                                newZoneName,
                                "new"
                              )
                            }
                            disabled={!newZoneUserId || isSavingZone === "new"}
                            className="bg-pink-600 hover:bg-pink-700 text-white"
                          >
                            {isSavingZone === "new" ? (
                              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-1.5" />
                            )}
                            Enregistrer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full border-dashed border-2 border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30"
                      onClick={() => setShowNewZone(true)}
                      disabled={availableUsersForZone.length === 0}
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Ajouter une zone
                      {availableUsersForZone.length === 0 && housekeepingStaff.length > 0 && (
                        <span className="text-xs text-gray-400 ml-2">
                          (tous les agents sont déjà assignés)
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ════════════════════════════════════════════════════════════
                TAB 3: Emploi du temps
            ════════════════════════════════════════════════════════════ */}
            <TabsContent value="schedule" className="mt-0 p-4">
              {isLoadingSchedules ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Info banner */}
                  <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800">
                    <p className="text-xs text-pink-700 dark:text-pink-300">
                      <Calendar className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      Configurez les jours et horaires de travail de chaque agent. Seuls les agents disponibles selon l&apos;emploi du temps recevront des tâches auto-assignées.
                    </p>
                  </div>

                  {/* Staff schedules */}
                  {housekeepingStaff.length === 0 ? (
                    <div className="text-center py-10">
                      <User className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Aucun agent de ménage
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Ajoutez du personnel avec un rôle de ménage pour configurer les emplois du temps.
                      </p>
                    </div>
                  ) : (
                    housekeepingStaff.map((staff) => {
                      const userDays = editedSchedules[staff.id] || DEFAULT_DAYS()
                      return (
                        <Card key={staff.id} className="overflow-hidden">
                          <CardHeader className="pb-2 px-4 pt-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                                </div>
                                <div className="min-w-0">
                                  <CardTitle className="text-sm font-medium truncate">
                                    {staff.name || staff.email}
                                  </CardTitle>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {ROLE_LABELS[staff.role] || staff.role}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="px-4 pb-4 pt-2">
                            {/* Weekly grid */}
                            <div className="space-y-2">
                              {/* Header row */}
                              <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-medium px-1">
                                <span></span>
                                <span className="text-center">Disponible</span>
                                <span className="text-center">Début</span>
                                <span className="text-center">Fin</span>
                              </div>

                              {DAY_LABELS.map((dayLabel, idx) => {
                                const dow = DAY_OF_WEEK_MAP[idx]
                                const dayEntry = userDays.find((d) => d.dayOfWeek === dow) || userDays[idx]
                                const isAvailable = dayEntry.isAvailable

                                return (
                                  <div
                                    key={dow}
                                    className={cn(
                                      "grid grid-cols-[60px_1fr_1fr_1fr] gap-2 items-center px-1 py-1.5 rounded-md text-xs transition-colors",
                                      isAvailable
                                        ? "bg-white dark:bg-gray-900"
                                        : "bg-gray-50 dark:bg-gray-900/30 opacity-60"
                                    )}
                                  >
                                    {/* Day label */}
                                    <span className={cn(
                                      "font-medium text-xs",
                                      dow === 0
                                        ? "text-red-500 dark:text-red-400"
                                        : "text-gray-700 dark:text-gray-300"
                                    )}>
                                      {dayLabel}
                                    </span>

                                    {/* Available toggle */}
                                    <div className="flex justify-center">
                                      <Switch
                                        checked={isAvailable}
                                        onCheckedChange={(checked) =>
                                          updateScheduleDay(staff.id, dow, "isAvailable", checked)
                                        }
                                        className="scale-75"
                                      />
                                    </div>

                                    {/* Start time */}
                                    <div className="flex justify-center">
                                      <Input
                                        type="time"
                                        value={dayEntry.startTime}
                                        onChange={(e) =>
                                          updateScheduleDay(staff.id, dow, "startTime", e.target.value)
                                        }
                                        disabled={!isAvailable}
                                        className="h-7 w-20 text-[11px] text-center px-1"
                                      />
                                    </div>

                                    {/* End time */}
                                    <div className="flex justify-center">
                                      <Input
                                        type="time"
                                        value={dayEntry.endTime}
                                        onChange={(e) =>
                                          updateScheduleDay(staff.id, dow, "endTime", e.target.value)
                                        }
                                        disabled={!isAvailable}
                                        className="h-7 w-20 text-[11px] text-center px-1"
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Save button */}
                            <div className="flex justify-end mt-3 pt-3 border-t">
                              <Button
                                size="sm"
                                onClick={() => handleSaveSchedule(staff.id)}
                                disabled={isSavingSchedule === staff.id}
                                className="bg-pink-600 hover:bg-pink-700 text-white"
                              >
                                {isSavingSchedule === staff.id ? (
                                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4 mr-1.5" />
                                )}
                                Enregistrer
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
