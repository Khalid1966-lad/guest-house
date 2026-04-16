"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Sparkles,
  BedDouble,
  Clock,
  ChevronDown,
  CheckCircle2,
  Loader2,
  MessageSquare,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

// ─── Types ──────────────────────────────────────────────────────────────

interface RoomWithCleaning {
  id: string
  number: string
  name: string | null
  status: string
  cleaningStatus: string | null
  cleaningUpdatedAt: string | null
  cleaningNotes: string | null
  lastBookingGuest?: string
}

// ─── Cleaning statuses ──────────────────────────────────────────────────

const cleaningStatuses = [
  { value: "departure", label: "En départ", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", dotColor: "bg-amber-500", borderColor: "border-amber-200 dark:border-amber-800" },
  { value: "turnover", label: "En recouche", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", dotColor: "bg-orange-500", borderColor: "border-orange-200 dark:border-orange-800" },
  { value: "cleaning", label: "En cours", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300", dotColor: "bg-sky-500", borderColor: "border-sky-200 dark:border-sky-800" },
  { value: "clean", label: "Propre", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", dotColor: "bg-green-500", borderColor: "border-green-200 dark:border-green-800" },
  { value: "verified", label: "Vérifiée", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", dotColor: "bg-emerald-500", borderColor: "border-emerald-200 dark:border-emerald-800" },
]

const roomStatuses = [
  { value: "available", label: "Disponible", color: "bg-sky-100 text-sky-700" },
  { value: "occupied", label: "Occupée", color: "bg-blue-100 text-blue-700" },
  { value: "maintenance", label: "Maintenance", color: "bg-yellow-100 text-yellow-700" },
  { value: "out_of_order", label: "Hors service", color: "bg-red-100 text-red-700" },
]

// Status flow: from → list of possible next statuses
const statusFlow: Record<string, string[]> = {
  departure: ["cleaning", "turnover"],
  turnover: ["cleaning"],
  cleaning: ["clean"],
  clean: ["verified"],
  verified: [],
}

// All statuses for full control
const allStatuses = ["departure", "turnover", "cleaning", "clean", "verified"]

// ─── Component ──────────────────────────────────────────────────────────

export default function HousekeepingPage() {
  const { data: session, status: authStatus } = useSession()
  const [rooms, setRooms] = useState<RoomWithCleaning[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>("all") // "all" or specific status
  const [showAll, setShowAll] = useState(false) // show rooms with no cleaning status
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [notesDialog, setNotesDialog] = useState<{ roomId: string; currentNotes: string; targetStatus: string | null } | null>(null)
  const [noteInput, setNoteInput] = useState("")
  const [error, setError] = useState("")

  // Fetch rooms with cleaning info
  const fetchRooms = useCallback(async () => {
    const guestHouseId = session?.user?.guestHouseId
    if (!guestHouseId) return

    try {
      setIsLoading(true)
      const res = await fetch("/api/rooms")
      if (!res.ok) return
      const data = await res.json()

      const roomsData: RoomWithCleaning[] = (data.rooms || []).map((room: Record<string, unknown>) => ({
        id: room.id as string,
        number: room.number as string,
        name: room.name as string | null,
        status: room.status as string,
        cleaningStatus: room.cleaningStatus as string | null,
        cleaningUpdatedAt: room.cleaningUpdatedAt as string | null,
        cleaningNotes: room.cleaningNotes as string | null,
      }))

      // Try to fetch last booking guest for each room
      for (const room of roomsData) {
        try {
          const bookingRes = await fetch(`/api/bookings?roomId=${room.id}&limit=1`)
          if (bookingRes.ok) {
            const bookingData = await bookingRes.json()
            if (bookingData.bookings && bookingData.bookings.length > 0) {
              const lastBooking = bookingData.bookings[0]
              room.lastBookingGuest = lastBooking.guestName || lastBooking.guest?.name || ""
            }
          }
        } catch {
          // ignore
        }
      }

      setRooms(roomsData)
    } catch (err) {
      console.error("Error fetching rooms:", err)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.guestHouseId])

  useEffect(() => {
    if (authStatus === "loading") return
    if (session?.user?.guestHouseId) {
      fetchRooms()
    }
  }, [session?.user?.guestHouseId, authStatus, fetchRooms])

  // Stats
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
    return counts
  }, [rooms])

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    let filtered = rooms

    if (activeFilter === "all") {
      // Show only rooms with cleaning status (unless showAll is true)
      if (!showAll) {
        filtered = rooms.filter((r) => r.cleaningStatus !== null)
      }
    } else {
      filtered = rooms.filter((r) => r.cleaningStatus === activeFilter)
    }

    return filtered
  }, [rooms, activeFilter, showAll])

  // Update cleaning status
  const handleUpdateStatus = async (roomId: string, newStatus: string | null, notes?: string) => {
    setIsUpdating(roomId)
    setError("")
    try {
      const res = await fetch("/api/housekeeping", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          cleaningStatus: newStatus,
          cleaningNotes: notes !== undefined ? notes : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Erreur lors de la mise à jour")
        return
      }

      // Optimistic update
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? {
                ...r,
                cleaningStatus: newStatus,
                cleaningUpdatedAt: newStatus ? new Date().toISOString() : null,
                cleaningNotes: notes !== undefined ? notes : r.cleaningNotes,
              }
            : r
        )
      )
    } catch {
      setError("Erreur lors de la mise à jour")
    } finally {
      setIsUpdating(null)
      setNotesDialog(null)
    }
  }

  // Open notes dialog before changing status
  const handleOpenStatusChange = (room: RoomWithCleaning, newStatus: string | null) => {
    setNotesDialog({
      roomId: room.id,
      currentNotes: room.cleaningNotes || "",
      targetStatus: newStatus,
    })
    setNoteInput(room.cleaningNotes || "")
  }

  // Get next statuses for a room
  const getNextStatuses = (room: RoomWithCleaning): string[] => {
    if (!room.cleaningStatus) return allStatuses
    const flow = statusFlow[room.cleaningStatus] || []
    // Include reset if verified
    const statuses = [...flow]
    if (room.cleaningStatus === "verified") {
      // Can only reset, which means setting to null
      return []
    }
    // Also allow any status change (full control) via a separator
    return statuses
  }

  const getCleaningStatusInfo = (status: string) => {
    return cleaningStatuses.find((s) => s.value === status)
  }

  const getRoomStatusInfo = (status: string) => {
    return roomStatuses.find((s) => s.value === status)
  }

  const formatTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: fr,
      })
    } catch {
      return ""
    }
  }

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-pink-500" />
            Ménage
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gestion du nettoyage des chambres
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchRooms}
          disabled={isLoading}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Summary stats - compact inline */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            {cleaningStatuses.map((cs) => (
              <button
                key={cs.value}
                onClick={() => setActiveFilter(activeFilter === cs.value ? "all" : cs.value)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  activeFilter === cs.value
                    ? cs.color + " ring-2 ring-offset-1 ring-current"
                    : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", cs.dotColor)} />
                {cs.label}
                <span className="font-bold">{stats[cs.value]}</span>
              </button>
            ))}
            <button
              onClick={() => {
                setShowAll(!showAll)
                if (!showAll) setActiveFilter("all")
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                showAll && activeFilter === "all"
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-2 ring-offset-1 ring-current"
                  : "bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              Toutes
              <span className="font-bold">{stats.none}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-lg">
          {error}
        </div>
      )}

      {/* Room cards */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
            Aucune chambre à afficher
          </h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            {showAll
              ? "Toutes les chambres sont propres"
              : "Aucune chambre ne nécessite de nettoyage. Cliquez sur « Toutes » pour voir toutes les chambres."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const cleaningInfo = room.cleaningStatus ? getCleaningStatusInfo(room.cleaningStatus) : null
            const roomStatusInfo = getRoomStatusInfo(room.status)
            const nextStatuses = getNextStatuses(room)

            return (
              <Card
                key={room.id}
                className={cn(
                  "overflow-hidden transition-all hover:shadow-lg border-l-4",
                  cleaningInfo?.borderColor || "border-gray-200 dark:border-gray-700"
                )}
              >
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-pink-50 dark:bg-pink-950 flex items-center justify-center">
                        <BedDouble className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          Chambre {room.number}
                        </CardTitle>
                        {room.name && (
                          <p className="text-xs text-gray-400 truncate max-w-[120px]">
                            {room.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", roomStatusInfo?.color)}>
                      {roomStatusInfo?.label || room.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 space-y-3">
                  {/* Cleaning status badge */}
                  {cleaningInfo ? (
                    <Badge className={cn("text-sm font-medium w-full justify-center py-1", cleaningInfo.color)}>
                      <span className={cn("w-2 h-2 rounded-full mr-2", cleaningInfo.dotColor)} />
                      {cleaningInfo.label}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-sm w-full justify-center py-1 text-gray-400">
                      Aucun statut de nettoyage
                    </Badge>
                  )}

                  {/* Guest name */}
                  {room.lastBookingGuest && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">{room.lastBookingGuest}</span>
                    </div>
                  )}

                  {/* Time since last update */}
                  {room.cleaningUpdatedAt && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(room.cleaningUpdatedAt)}
                    </div>
                  )}

                  {/* Cleaning notes */}
                  {room.cleaningNotes && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded px-2 py-1">
                      <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{room.cleaningNotes}</span>
                    </div>
                  )}

                  {/* Action dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={isUpdating === room.id}
                      >
                        {isUpdating === room.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ChevronDown className="w-4 h-4 mr-2" />
                        )}
                        Changer le statut
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {/* Logical next statuses */}
                      {nextStatuses.length > 0 && (
                        <>
                          {nextStatuses.map((status) => {
                            const info = getCleaningStatusInfo(status)
                            return (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => handleOpenStatusChange(room, status)}
                              >
                                <span className={cn("w-2.5 h-2.5 rounded-full mr-2", info?.dotColor)} />
                                {info?.label}
                              </DropdownMenuItem>
                            )
                          })}
                          <DropdownMenuSeparator />
                        </>
                      )}

                      {/* Full control - all statuses */}
                      <p className="px-2 py-1 text-xs text-gray-400 font-medium">
                        Tous les statuts
                      </p>
                      {allStatuses.map((status) => {
                        const info = getCleaningStatusInfo(status)
                        const isCurrent = room.cleaningStatus === status
                        return (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => !isCurrent && handleOpenStatusChange(room, status)}
                            disabled={isCurrent}
                            className={cn(isCurrent && "opacity-50")}
                          >
                            <span className={cn("w-2.5 h-2.5 rounded-full mr-2", info?.dotColor)} />
                            {info?.label}
                            {isCurrent && (
                              <CheckCircle2 className="w-3 h-3 ml-auto text-green-500" />
                            )}
                          </DropdownMenuItem>
                        )
                      })}

                      {/* Reset */}
                      {room.cleaningStatus && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleOpenStatusChange(room, null as unknown as string)}
                            className="text-gray-500"
                          >
                            Réinitialiser
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Notes dialog */}
      <Dialog open={!!notesDialog} onOpenChange={(open) => !open && setNotesDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {notesDialog?.targetStatus
                ? `Passer à « ${getCleaningStatusInfo(notesDialog.targetStatus)?.label || notesDialog.targetStatus} »`
                : "Réinitialiser le statut"}
            </DialogTitle>
            <DialogDescription>
              Ajoutez une note optionnelle pour le personnel de ménage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cleaningNote">Note (optionnel)</Label>
              <Textarea
                id="cleaningNote"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Ex : Serviettes à changer, minibar à vérifier..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setNotesDialog(null)}
              >
                Annuler
              </Button>
              <Button
                className="bg-pink-600 hover:bg-pink-700"
                onClick={() => {
                  if (notesDialog) {
                    handleUpdateStatus(notesDialog.roomId, notesDialog.targetStatus, noteInput || undefined)
                  }
                }}
                disabled={isUpdating !== null}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
