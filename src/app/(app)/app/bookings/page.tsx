"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Users,
  BedDouble,
  MoreVertical,
  Check,
  X,
  LogIn,
  LogOut,
  Calendar as CalendarIcon,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO, startOfDay } from "date-fns"
import { fr } from "date-fns/locale"

// Types
interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
}

interface Room {
  id: string
  number: string
  name: string | null
  type: string
  capacity: number
  basePrice: number
  status: string
}

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  nightlyRate: number
  totalPrice: number
  status: string
  source: string
  guestNotes: string | null
  guest: Guest
  room: Room
}

// Status colors and labels
const bookingStatuses: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "En attente", color: "text-yellow-700", bg: "bg-yellow-100" },
  confirmed: { label: "Confirmée", color: "text-sky-700", bg: "bg-sky-100" },
  checked_in: { label: "Arrivée", color: "text-green-700", bg: "bg-green-100" },
  checked_out: { label: "Parti", color: "text-gray-700", bg: "bg-gray-100" },
  cancelled: { label: "Annulée", color: "text-red-700", bg: "bg-red-100" },
  no_show: { label: "No-show", color: "text-orange-700", bg: "bg-orange-100" },
}

// Booking sources
const bookingSources = [
  { value: "direct", label: "Site web" },
  { value: "booking", label: "Booking.com" },
  { value: "airbnb", label: "Airbnb" },
  { value: "expedia", label: "Expedia" },
  { value: "phone", label: "Téléphone" },
  { value: "other", label: "Autre" },
]

// Room types
const roomTypes: Record<string, string> = {
  single: "Simple",
  double: "Double",
  twin: "Twin",
  suite: "Suite",
  family: "Familiale",
  dormitory: "Dortoir",
}

const defaultFormData = {
  guestId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  roomId: "",
  checkIn: "",
  checkOut: "",
  adults: "1",
  children: "0",
  nightlyRate: "",
  source: "direct",
  guestNotes: "",
}

export default function BookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [formData, setFormData] = useState(defaultFormData)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [searchGuest, setSearchGuest] = useState("")

  // Calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Filter bookings by status
  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return bookings
    return bookings.filter((b) => b.status === statusFilter)
  }, [bookings, statusFilter])

  // Get bookings for a specific day (with status filter)
  const getBookingsForDay = (day: Date) => {
    return filteredBookings.filter((booking) => {
      const checkIn = parseISO(booking.checkIn)
      const checkOut = parseISO(booking.checkOut)
      return day >= startOfDay(checkIn) && day < startOfDay(checkOut)
    })
  }

  // Fetch data
  const fetchData = async () => {
    if (!session?.user?.guestHouseId) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const [bookingsRes, roomsRes, guestsRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/rooms"),
        fetch("/api/guests").catch(() => null),
      ])

      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setBookings(data.bookings || [])
      }

      if (roomsRes.ok) {
        const data = await roomsRes.json()
        setRooms(data.rooms || [])
      }

      if (guestsRes && guestsRes.ok) {
        const data = await guestsRes.json()
        setGuests(data.guests || [])
      }
    } catch (err) {
      console.error("Erreur chargement:", err)
      setError("Erreur lors du chargement des données")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    fetchData()
  }, [session, status, router])

  // Navigate months
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Open new booking dialog
  const handleNewBooking = () => {
    setEditingBooking(null)
    setFormData(defaultFormData)
    setFormError("")
    setIsDialogOpen(true)
  }

  // Open edit booking dialog
  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking)
    setFormData({
      guestId: booking.guest.id,
      firstName: booking.guest.firstName,
      lastName: booking.guest.lastName,
      email: booking.guest.email || "",
      phone: booking.guest.phone || "",
      roomId: booking.room.id,
      checkIn: format(parseISO(booking.checkIn), "yyyy-MM-dd"),
      checkOut: format(parseISO(booking.checkOut), "yyyy-MM-dd"),
      adults: booking.adults.toString(),
      children: booking.children.toString(),
      nightlyRate: booking.nightlyRate.toString(),
      source: booking.source,
      guestNotes: booking.guestNotes || "",
    })
    setFormError("")
    setIsDetailOpen(false)
    setIsDialogOpen(true)
  }

  // View booking details
  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsDetailOpen(true)
  }

  // Handle form change
  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Select room and set default price
  const handleRoomSelect = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId)
    setFormData((prev) => ({
      ...prev,
      roomId,
      nightlyRate: room ? room.basePrice.toString() : prev.nightlyRate,
    }))
  }

  // Calculate nights
  const calculateNights = () => {
    if (!formData.checkIn || !formData.checkOut) return 0
    const checkIn = new Date(formData.checkIn)
    const checkOut = new Date(formData.checkOut)
    const diff = checkOut.getTime() - checkIn.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // Calculate total price
  const calculateTotal = () => {
    const nights = calculateNights()
    const rate = parseFloat(formData.nightlyRate) || 0
    return nights * rate
  }

  // Save booking (create or update)
  const handleSaveBooking = async () => {
    setFormError("")

    if (!formData.firstName || !formData.lastName) {
      setFormError("Le prénom et le nom du client sont requis")
      return
    }

    if (!formData.roomId || !formData.checkIn || !formData.checkOut) {
      setFormError("Veuillez remplir tous les champs obligatoires")
      return
    }

    if (new Date(formData.checkIn) >= new Date(formData.checkOut)) {
      setFormError("La date de départ doit être après la date d'arrivée")
      return
    }

    setIsSaving(true)

    try {
      const url = editingBooking ? `/api/bookings/${editingBooking.id}` : "/api/bookings"
      const method = editingBooking ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalPrice: calculateTotal(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setFormError(errorData.error || "Erreur lors de la sauvegarde")
        setIsSaving(false)
        return
      }

      setIsDialogOpen(false)
      setIsSaving(false)
      fetchData()
    } catch (err) {
      setFormError("Une erreur inattendue s'est produite")
      setIsSaving(false)
    }
  }

  // Update booking status (check-in, check-out, cancel)
  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setIsDetailOpen(false)
        fetchData()
      }
    } catch (err) {
      console.error("Erreur mise à jour:", err)
    }
  }

  // Delete booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) return

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setIsDetailOpen(false)
        fetchData()
      }
    } catch (err) {
      console.error("Erreur suppression:", err)
    }
  }

  // Filtered guests for search
  const filteredGuests = useMemo(() => {
    if (!searchGuest) return guests.slice(0, 10)
    const search = searchGuest.toLowerCase()
    return guests.filter(
      (g) =>
        g.firstName.toLowerCase().includes(search) ||
        g.lastName.toLowerCase().includes(search) ||
        g.email?.toLowerCase().includes(search)
    ).slice(0, 10)
  }, [guests, searchGuest])

  // Select guest
  const handleSelectGuest = (guest: Guest) => {
    setFormData((prev) => ({
      ...prev,
      guestId: guest.id,
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email || "",
      phone: guest.phone || "",
    }))
    setSearchGuest("")
  }

  // Check if user needs onboarding
  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    )
  }

  if (status === "authenticated" && !session?.user?.guestHouseId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Configuration requise</h2>
        <p className="text-gray-500 mb-4 text-center">
          Vous devez créer votre maison d'hôtes avant de gérer les réservations.
        </p>
        <Button onClick={() => router.push("/onboarding")}>
          Créer ma maison d'hôtes
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Réservations</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez les réservations de votre établissement
          </p>
        </div>
        <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleNewBooking}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle réservation
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchData}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(bookingStatuses).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("calendar")}
            className={viewMode === "calendar" ? "bg-sky-600 hover:bg-sky-700" : ""}
          >
            <CalendarDays className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-sky-600 hover:bg-sky-700" : ""}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(bookingStatuses).map(([key, value]) => {
          const count = bookings.filter((b) => b.status === key).length
          return (
            <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className={cn("w-3 h-3 rounded-full", value.bg)} />
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{value.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" ? (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-xl font-semibold capitalize">
                  {format(currentDate, "MMMM yyyy", { locale: fr })}
                </h2>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {statusFilter !== "all" && (
                  <Badge className={cn(bookingStatuses[statusFilter]?.bg, bookingStatuses[statusFilter]?.color)}>
                    Filtre: {bookingStatuses[statusFilter]?.label}
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Aujourd'hui
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              {/* Week days header */}
              {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
                <div
                  key={day}
                  className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day) => {
                const dayBookings = getBookingsForDay(day)
                const isCurrentDay = isToday(day)

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "bg-white dark:bg-gray-900 min-h-24 p-1",
                      !isSameMonth(day, currentDate) && "bg-gray-50 dark:bg-gray-800"
                    )}
                  >
                    <div
                      className={cn(
                        "text-sm p-1 rounded-full w-7 h-7 flex items-center justify-center",
                        isCurrentDay && "bg-sky-600 text-white font-bold"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1 mt-1">
                      {dayBookings.slice(0, 3).map((booking) => {
                        const statusInfo = bookingStatuses[booking.status] || bookingStatuses.pending
                        return (
                          <button
                            key={booking.id}
                            onClick={() => handleViewBooking(booking)}
                            className={cn(
                              "w-full text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity text-left",
                              statusInfo.bg,
                              statusInfo.color
                            )}
                            title={`${booking.guest.firstName} ${booking.guest.lastName} - ${booking.room.number}`}
                          >
                            {booking.room.number}: {booking.guest.firstName.charAt(0)}. {booking.guest.lastName}
                          </button>
                        )
                      })}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-gray-500 px-1">
                          +{dayBookings.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle>Liste des réservations</CardTitle>
            <CardDescription>
              {filteredBookings.length} réservation{filteredBookings.length > 1 ? "s" : ""}
              {statusFilter !== "all" && ` (${bookingStatuses[statusFilter]?.label})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">Aucune réservation</h3>
                <p className="text-gray-500 mb-4">
                  {statusFilter !== "all" 
                    ? "Aucune réservation avec ce statut"
                    : "Commencez par créer votre première réservation"}
                </p>
                <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleNewBooking}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle réservation
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((booking) => {
                  const statusInfo = bookingStatuses[booking.status] || bookingStatuses.pending
                  const canCheckIn = booking.status === "confirmed" && isSameDay(parseISO(booking.checkIn), new Date())
                  const canCheckOut = booking.status === "checked_in"
                  
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div 
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() => handleViewBooking(booking)}
                      >
                        <div className={cn("w-3 h-3 rounded-full", statusInfo.bg)} />
                        <div>
                          <p className="font-medium">
                            {booking.guest.firstName} {booking.guest.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Chambre {booking.room.number} • {format(parseISO(booking.checkIn), "d MMM", { locale: fr })} - {format(parseISO(booking.checkOut), "d MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="font-semibold">{booking.totalPrice} €</p>
                          <Badge className={cn(statusInfo.bg, statusInfo.color, "border-0")}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewBooking(booking)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditBooking(booking)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {canCheckIn && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(booking.id, "checked_in")}>
                                <LogIn className="w-4 h-4 mr-2" />
                                Check-in
                              </DropdownMenuItem>
                            )}
                            {canCheckOut && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(booking.id, "checked_out")}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Check-out
                              </DropdownMenuItem>
                            )}
                            {booking.status === "pending" && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(booking.id, "confirmed")}>
                                <Check className="w-4 h-4 mr-2" />
                                Confirmer
                              </DropdownMenuItem>
                            )}
                            {booking.status !== "cancelled" && booking.status !== "checked_out" && (
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Annuler
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteBooking(booking.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la réservation</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4 py-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Statut</span>
                <Badge className={cn(
                  bookingStatuses[selectedBooking.status]?.bg,
                  bookingStatuses[selectedBooking.status]?.color,
                  "border-0"
                )}>
                  {bookingStatuses[selectedBooking.status]?.label}
                </Badge>
              </div>

              {/* Guest */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Client</p>
                <p className="font-medium">{selectedBooking.guest.firstName} {selectedBooking.guest.lastName}</p>
                {selectedBooking.guest.email && (
                  <p className="text-sm text-gray-500">{selectedBooking.guest.email}</p>
                )}
                {selectedBooking.guest.phone && (
                  <p className="text-sm text-gray-500">{selectedBooking.guest.phone}</p>
                )}
              </div>

              {/* Room */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Chambre</span>
                <span className="font-medium">
                  {selectedBooking.room.number}
                  {selectedBooking.room.name && ` - ${selectedBooking.room.name}`}
                </span>
              </div>

              {/* Dates */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Arrivée</span>
                <span>{format(parseISO(selectedBooking.checkIn), "d MMMM yyyy", { locale: fr })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Départ</span>
                <span>{format(parseISO(selectedBooking.checkOut), "d MMMM yyyy", { locale: fr })}</span>
              </div>

              {/* Guests */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Voyageurs</span>
                <span>{selectedBooking.adults} adulte{selectedBooking.adults > 1 ? "s" : ""}{selectedBooking.children > 0 && ` + ${selectedBooking.children} enfant${selectedBooking.children > 1 ? "s" : ""}`}</span>
              </div>

              {/* Price */}
              <div className="p-4 bg-sky-50 dark:bg-sky-950 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span>Prix/nuit</span>
                  <span>{selectedBooking.nightlyRate} €</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-sky-600">{selectedBooking.totalPrice} €</span>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.guestNotes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Notes</p>
                  <p className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">{selectedBooking.guestNotes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleEditBooking(selectedBooking)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => handleDeleteBooking(selectedBooking.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New/Edit Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBooking ? "Modifier la réservation" : "Nouvelle réservation"}
            </DialogTitle>
            <DialogDescription>
              {editingBooking ? "Modifiez les informations de la réservation" : "Créez une nouvelle réservation"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {formError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {formError}
              </div>
            )}

            {/* Guest Selection */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Client
              </h3>

              {formData.guestId ? (
                <div className="flex items-center justify-between p-3 bg-sky-50 dark:bg-sky-950 rounded-lg">
                  <div>
                    <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                    <p className="text-sm text-gray-500">{formData.email || formData.phone}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData((prev) => ({ ...prev, guestId: "" }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {guests.length > 0 && (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Rechercher un client existant..."
                          value={searchGuest}
                          onChange={(e) => setSearchGuest(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}

                  {searchGuest && filteredGuests.length > 0 && (
                    <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                      {filteredGuests.map((guest) => (
                        <button
                          key={guest.id}
                          className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => handleSelectGuest(guest)}
                        >
                          <p className="font-medium">{guest.firstName} {guest.lastName}</p>
                          <p className="text-sm text-gray-500">{guest.email || guest.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* New guest form */}
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleFormChange("firstName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleFormChange("lastName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFormChange("email", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleFormChange("phone", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Room Selection */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <BedDouble className="w-4 h-4" />
                Chambre
              </h3>
              <Select value={formData.roomId} onValueChange={handleRoomSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une chambre" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      Chambre {room.number} - {roomTypes[room.type] || room.type} ({room.capacity} pers.) - {room.basePrice}€/nuit
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Dates
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkIn">Arrivée *</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={formData.checkIn}
                    onChange={(e) => handleFormChange("checkIn", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOut">Départ *</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={formData.checkOut}
                    onChange={(e) => handleFormChange("checkOut", e.target.value)}
                  />
                </div>
              </div>
              {formData.checkIn && formData.checkOut && (
                <p className="text-sm text-gray-500">
                  Durée: {calculateNights()} nuit{calculateNights() > 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Guests count */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adults">Adultes</Label>
                <Input
                  id="adults"
                  type="number"
                  min="1"
                  value={formData.adults}
                  onChange={(e) => handleFormChange("adults", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="children">Enfants</Label>
                <Input
                  id="children"
                  type="number"
                  min="0"
                  value={formData.children}
                  onChange={(e) => handleFormChange("children", e.target.value)}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="font-medium">Tarification</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nightlyRate">Prix par nuit (€)</Label>
                  <Input
                    id="nightlyRate"
                    type="number"
                    step="0.01"
                    value={formData.nightlyRate}
                    onChange={(e) => handleFormChange("nightlyRate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select value={formData.source} onValueChange={(v) => handleFormChange("source", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bookingSources.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {calculateTotal() > 0 && (
                <div className="p-3 bg-sky-50 dark:bg-sky-950 rounded-lg">
                  <div className="flex justify-between">
                    <span>Total ({calculateNights()} nuits)</span>
                    <span className="font-bold text-sky-600">{calculateTotal()} €</span>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="guestNotes">Notes du client</Label>
              <Textarea
                id="guestNotes"
                value={formData.guestNotes}
                onChange={(e) => handleFormChange("guestNotes", e.target.value)}
                placeholder="Demandes spéciales..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-sky-600 hover:bg-sky-700"
              onClick={handleSaveBooking}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                editingBooking ? "Modifier" : "Créer la réservation"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
