"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { useCurrency } from "@/hooks/use-currency"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import {
  ConciergeBell,
  Plus,
  Search,
  LayoutGrid,
  List,
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  Clock,
  Filter,
  ChevronDown,
  Image as ImageIcon,
  X,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  DollarSign,
  ShoppingCart,
  User,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Service {
  id: string
  name: string
  description?: string
  category: string
  basePrice: number
  priceType: string
  image?: string
  duration?: number
  isActive: boolean
  sortOrder: number
  createdAt: string
  serviceBookings?: { id: string }[]
}

interface ServiceBooking {
  id: string
  serviceId: string
  guestId: string
  bookingId?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: string
  paymentStatus: string
  scheduledDate?: string
  scheduledTime?: string
  notes?: string
  createdAt: string
  service: { id: string; name: string; image?: string; category: string }
  guest: { id: string; firstName: string; lastName: string }
}

interface Guest {
  id: string
  firstName: string
  lastName: string
  email?: string
}

interface ActiveBooking {
  id: string
  room: { number: string; name?: string }
  guest: { firstName: string; lastName: string }
}

// ─── Config ──────────────────────────────────────────────────────────────────

const SERVICE_CATEGORIES = [
  { value: "transfert", label: "Transfert", emoji: "🚗", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "bien_etre", label: "Bien-être", emoji: "💆", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "activites", label: "Activités", emoji: "🎯", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { value: "restauration", label: "Restauration", emoji: "🍽️", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  { value: "confort", label: "Confort", emoji: "🧺", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" },
  { value: "divers", label: "Divers", emoji: "📦", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" },
]

const BOOKING_STATUSES = [
  { value: "pending", label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  { value: "confirmed", label: "Confirmée", color: "bg-blue-100 text-blue-800" },
  { value: "completed", label: "Terminée", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Annulée", color: "bg-red-100 text-red-800" },
]

const PRICE_TYPE_LABELS: Record<string, string> = {
  fixed: "Prix fixe",
  per_person: "Par personne",
  per_unit: "Par unité",
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  transfert: "from-blue-100 to-cyan-200 dark:from-blue-900/40 dark:to-cyan-900/30",
  bien_etre: "from-purple-100 to-fuchsia-200 dark:from-purple-900/40 dark:to-fuchsia-900/30",
  activites: "from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-900/30",
  restauration: "from-orange-100 to-amber-200 dark:from-orange-900/40 dark:to-amber-900/30",
  confort: "from-pink-100 to-rose-200 dark:from-pink-900/40 dark:to-rose-900/30",
  divers: "from-gray-100 to-slate-200 dark:from-gray-800/40 dark:to-slate-700/30",
}

const defaultServiceForm = {
  name: "",
  description: "",
  category: "divers",
  priceType: "fixed",
  basePrice: "",
  duration: "",
  image: "",
  isActive: true,
  sortOrder: "0",
}

const defaultBookingForm = {
  serviceId: "",
  guestId: "",
  bookingId: "",
  quantity: "1",
  scheduledDate: "",
  scheduledTime: "",
  notes: "",
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function ServicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { formatAmount } = useCurrency()
  const { toast } = useToast()

  // ─── State ─────────────────────────────────────────────────────────────────

  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<ServiceBooking[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("catalogue")

  // Catalogue filters
  const [catalogueSearch, setCatalogueSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Orders filters
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all")
  const [bookingSearch, setBookingSearch] = useState("")

  // Service dialog
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [serviceForm, setServiceForm] = useState(defaultServiceForm)
  const [isServiceSaving, setIsServiceSaving] = useState(false)
  const [serviceFormError, setServiceFormError] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Delete service dialog
  const [isDeleteServiceDialogOpen, setIsDeleteServiceDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [isDeletingService, setIsDeletingService] = useState(false)

  // Booking dialog
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [bookingForm, setBookingForm] = useState(defaultBookingForm)
  const [isBookingSaving, setIsBookingSaving] = useState(false)
  const [bookingFormError, setBookingFormError] = useState("")

  // Delete booking dialog
  const [isDeleteBookingDialogOpen, setIsDeleteBookingDialogOpen] = useState(false)
  const [bookingToDelete, setBookingToDelete] = useState<ServiceBooking | null>(null)
  const [isDeletingBooking, setIsDeletingBooking] = useState(false)

  // ─── Computed Values ───────────────────────────────────────────────────────

  const filteredServices = useMemo(() => {
    return services
      .filter((s) => {
        const matchesSearch =
          !catalogueSearch ||
          s.name.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
          s.description?.toLowerCase().includes(catalogueSearch.toLowerCase())
        const matchesCategory = categoryFilter === "all" || s.category === categoryFilter
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && s.isActive) ||
          (statusFilter === "inactive" && !s.isActive)
        return matchesSearch && matchesCategory && matchesStatus
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [services, catalogueSearch, categoryFilter, statusFilter])

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = bookingStatusFilter === "all" || b.status === bookingStatusFilter
      const matchesSearch =
        !bookingSearch ||
        b.service.name.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase().includes(bookingSearch.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [bookings, bookingStatusFilter, bookingSearch])

  const activeServices = useMemo(() => services.filter((s) => s.isActive), [services])

  const catalogueStats = useMemo(() => {
    const total = services.length
    const active = services.filter((s) => s.isActive).length
    const categories = new Set(services.map((s) => s.category)).size
    const avgPrice = total > 0 ? services.reduce((sum, s) => sum + s.basePrice, 0) / total : 0
    return { total, active, categories, avgPrice }
  }, [services])

  const bookingStats = useMemo(() => {
    const pending = bookings.filter((b) => b.status === "pending").length
    const confirmed = bookings.filter((b) => b.status === "confirmed").length
    const completed = bookings.filter((b) => b.status === "completed").length
    const totalRevenue = bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + b.totalPrice, 0)
    return { total: bookings.length, pending, confirmed, completed, totalRevenue }
  }, [bookings])

  const bookingFormTotal = useMemo(() => {
    const service = activeServices.find((s) => s.id === bookingForm.serviceId)
    if (!service) return 0
    const qty = parseInt(bookingForm.quantity) || 0
    return service.basePrice * qty
  }, [bookingForm.serviceId, bookingForm.quantity, activeServices])

  const selectedBookingInfo = useMemo(() => {
    return activeBookings.find((b) => b.id === bookingForm.bookingId) || null
  }, [activeBookings, bookingForm.bookingId])

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  const fetchData = async () => {
    if (!session?.user?.guestHouseId) {
      setIsLoading(false)
      return
    }

    try {
      const [servicesRes, bookingsRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/service-bookings"),
      ])

      if (servicesRes.ok) {
        const data = await servicesRes.json()
        setServices(data.services || [])
      } else {
        console.error("Erreur chargement services:", servicesRes.status)
      }

      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setBookings(data.bookings || [])
      } else {
        console.error("Erreur chargement commandes:", bookingsRes.status)
      }
    } catch (err) {
      console.error("Erreur chargement données:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGuestsAndBookings = async () => {
    try {
      const [guestsRes, bookingsRes] = await Promise.all([
        fetch("/api/guests"),
        fetch("/api/bookings?status=checked_in"),
      ])

      if (guestsRes.ok) {
        const data = await guestsRes.json()
        setGuests(data.guests || [])
      }

      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        const bookingsList = (data.bookings || []).map((b: Record<string, unknown>) => ({
          id: b.id,
          room: { number: b.roomNumber || (b.room as { number: string })?.number || "", name: (b.room as { name?: string })?.name },
          guest: { firstName: (b.guest as { firstName: string })?.firstName || "", lastName: (b.guest as { lastName: string })?.lastName || "" },
        }))
        setActiveBookings(bookingsList as ActiveBooking[])
      }
    } catch (err) {
      console.error("Erreur chargement clients/réservations:", err)
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

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
    toast({ title: "Données actualisées" })
  }

  // ─── Service Handlers ──────────────────────────────────────────────────────

  const handleNewService = () => {
    setEditingService(null)
    setServiceForm(defaultServiceForm)
    setImagePreview(null)
    setServiceFormError("")
    setIsServiceDialogOpen(true)
  }

  const handleEditService = (service: Service) => {
    setEditingService(service)
    setServiceForm({
      name: service.name,
      description: service.description || "",
      category: service.category,
      priceType: service.priceType,
      basePrice: service.basePrice.toString(),
      duration: service.duration?.toString() || "",
      image: service.image || "",
      isActive: service.isActive,
      sortOrder: service.sortOrder.toString(),
    })
    setImagePreview(service.image || null)
    setServiceFormError("")
    setIsServiceDialogOpen(true)
  }

  const handleServiceFormChange = (field: string, value: string | boolean) => {
    setServiceForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleUploadImage = (file: File) => {
    if (file.size > 500 * 1024) {
      setServiceFormError("L'image ne doit pas dépasser 500 Ko")
      return
    }

    setIsUploadingImage(true)
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setServiceForm((prev) => ({ ...prev, image: dataUrl }))
        setImagePreview(dataUrl)
        setIsUploadingImage(false)
      }
      reader.onerror = () => {
        setServiceFormError("Erreur lors de la lecture de l'image")
        setIsUploadingImage(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setServiceFormError("Erreur lors de la lecture de l'image")
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setServiceForm((prev) => ({ ...prev, image: "" }))
    setImagePreview(null)
  }

  const handleSaveService = async () => {
    setServiceFormError("")

    if (!serviceForm.name.trim()) {
      setServiceFormError("Le nom du service est requis")
      return
    }

    if (!serviceForm.basePrice || parseFloat(serviceForm.basePrice) < 0) {
      setServiceFormError("Le prix doit être un nombre positif")
      return
    }

    setIsServiceSaving(true)

    try {
      const url = editingService ? `/api/services/${editingService.id}` : "/api/services"
      const method = editingService ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: serviceForm.name.trim(),
          description: serviceForm.description.trim() || null,
          category: serviceForm.category,
          priceType: serviceForm.priceType,
          basePrice: parseFloat(serviceForm.basePrice),
          duration: serviceForm.duration ? parseInt(serviceForm.duration) : null,
          image: serviceForm.image || null,
          isActive: serviceForm.isActive,
          sortOrder: parseInt(serviceForm.sortOrder) || 0,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setServiceFormError(errorData.error || "Erreur lors de la sauvegarde")
        setIsServiceSaving(false)
        return
      }

      toast({
        title: editingService ? "Service modifié" : "Service créé",
        description: `${serviceForm.name} a été ${editingService ? "modifié" : "ajouté"} avec succès`,
      })

      setIsServiceDialogOpen(false)
      setIsServiceSaving(false)
      await fetchData()
    } catch (err) {
      setServiceFormError("Une erreur inattendue s'est produite")
      setIsServiceSaving(false)
    }
  }

  const handleDeleteService = async () => {
    if (!serviceToDelete) return

    setIsDeletingService(true)

    try {
      const response = await fetch(`/api/services/${serviceToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast({
          variant: "destructive",
          title: "Erreur",
          description: errorData.error || "Impossible de supprimer ce service",
        })
        setIsDeletingService(false)
        setIsDeleteServiceDialogOpen(false)
        return
      }

      toast({
        title: "Service supprimé",
        description: `${serviceToDelete.name} a été supprimé`,
      })

      setIsDeleteServiceDialogOpen(false)
      setServiceToDelete(null)
      setIsDeletingService(false)
      await fetchData()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
      })
      setIsDeletingService(false)
    }
  }

  // ─── Booking Handlers ──────────────────────────────────────────────────────

  const handleNewBooking = async () => {
    setBookingForm(defaultBookingForm)
    setBookingFormError("")
    setIsBookingDialogOpen(true)
    await fetchGuestsAndBookings()
  }

  const handleBookingFormChange = (field: string, value: string) => {
    setBookingForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleBookingSelect = (bookingId: string) => {
    setBookingForm((prev) => ({ ...prev, bookingId }))
    const booking = activeBookings.find((b) => b.id === bookingId)
    if (booking) {
      const matchingGuest = guests.find(
        (g) => `${g.firstName} ${g.lastName}` === `${booking.guest.firstName} ${booking.guest.lastName}`
      )
      if (matchingGuest) {
        setBookingForm((prev) => ({ ...prev, guestId: matchingGuest.id }))
      }
    }
  }

  const handleSaveBooking = async () => {
    setBookingFormError("")

    if (!bookingForm.serviceId) {
      setBookingFormError("Veuillez sélectionner un service")
      return
    }

    if (!bookingForm.guestId) {
      setBookingFormError("Veuillez sélectionner un client")
      return
    }

    const qty = parseInt(bookingForm.quantity) || 0
    if (qty < 1) {
      setBookingFormError("La quantité doit être au moins 1")
      return
    }

    setIsBookingSaving(true)

    try {
      const service = activeServices.find((s) => s.id === bookingForm.serviceId)
      if (!service) {
        setBookingFormError("Service introuvable")
        setIsBookingSaving(false)
        return
      }

      const response = await fetch("/api/service-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: bookingForm.serviceId,
          guestId: bookingForm.guestId,
          bookingId: bookingForm.bookingId || null,
          quantity: qty,
          unitPrice: service.basePrice,
          totalPrice: service.basePrice * qty,
          scheduledDate: bookingForm.scheduledDate || null,
          scheduledTime: bookingForm.scheduledTime || null,
          notes: bookingForm.notes.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setBookingFormError(errorData.error || "Erreur lors de la création de la commande")
        setIsBookingSaving(false)
        return
      }

      toast({
        title: "Commande créée",
        description: `Commande de ${service.name} pour ${qty} enregistrée`,
      })

      setIsBookingDialogOpen(false)
      setIsBookingSaving(false)
      await fetchData()
    } catch (err) {
      setBookingFormError("Une erreur inattendue s'est produite")
      setIsBookingSaving(false)
    }
  }

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/service-bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const statusLabel = BOOKING_STATUSES.find((s) => s.value === newStatus)?.label || newStatus
        toast({ title: "Statut mis à jour", description: `Commande marquée comme ${statusLabel}` })
        await fetchData()
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de mettre à jour le statut",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
      })
    }
  }

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return

    setIsDeletingBooking(true)

    try {
      const response = await fetch(`/api/service-bookings/${bookingToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast({
          variant: "destructive",
          title: "Erreur",
          description: errorData.error || "Impossible de supprimer cette commande",
        })
        setIsDeletingBooking(false)
        setIsDeleteBookingDialogOpen(false)
        return
      }

      toast({ title: "Commande supprimée", description: "La commande a été supprimée" })

      setIsDeleteBookingDialogOpen(false)
      setBookingToDelete(null)
      setIsDeletingBooking(false)
      await fetchData()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
      })
      setIsDeletingBooking(false)
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const getCategoryLabel = (value: string) =>
    SERVICE_CATEGORIES.find((c) => c.value === value)?.label || value

  const getCategoryEmoji = (value: string) =>
    SERVICE_CATEGORIES.find((c) => c.value === value)?.emoji || "📦"

  const getCategoryColor = (value: string) =>
    SERVICE_CATEGORIES.find((c) => c.value === value)?.color || "bg-gray-100 text-gray-800"

  const getStatusBadge = (value: string) =>
    BOOKING_STATUSES.find((s) => s.value === value) || { value, label: value, color: "bg-gray-100 text-gray-800" }

  const getCategoryGradient = (value: string) =>
    CATEGORY_GRADIENTS[value] || CATEGORY_GRADIENTS.divers

  // ─── Loading / Auth ────────────────────────────────────────────────────────

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  if (status === "authenticated" && !session?.user?.guestHouseId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ConciergeBell className="w-12 h-12 text-cyan-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Configuration requise</h2>
        <p className="text-gray-500 mb-4 text-center">
          Vous devez créer votre maison d&apos;hôtes avant de gérer les services.
        </p>
        <Button onClick={() => router.push("/onboarding")}>Créer ma maison d&apos;hôtes</Button>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez vos services supplémentaires et les commandes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
          {activeTab === "catalogue" ? (
            <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={handleNewService}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau service
            </Button>
          ) : (
            <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={handleNewBooking}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle commande
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="catalogue">
            Catalogue ({services.length})
          </TabsTrigger>
          <TabsTrigger value="commandes">
            Commandes ({bookings.length})
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════ TAB 1: CATALOGUE ═══════════════════ */}
        <TabsContent value="catalogue" className="space-y-6">
          {/* Stats bar */}
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-gray-500">
              <ConciergeBell className="w-3.5 h-3.5" /> Total : <strong>{catalogueStats.total}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-green-600">
              <CheckCircle className="w-3.5 h-3.5" /> Actifs : <strong>{catalogueStats.active}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-purple-600">
              <Filter className="w-3.5 h-3.5" /> Catégories : <strong>{catalogueStats.categories}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-cyan-600">
              <DollarSign className="w-3.5 h-3.5" /> Prix moy. : <strong>{formatAmount(catalogueStats.avgPrice)}</strong>
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un service..."
                value={catalogueSearch}
                onChange={(e) => setCatalogueSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {SERVICE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-r-none h-9 w-9", viewMode === "grid" && "bg-gray-100 dark:bg-gray-800")}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-l-none h-9 w-9", viewMode === "list" && "bg-gray-100 dark:bg-gray-800")}
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredServices.map((service) => (
                <Card
                  key={service.id}
                  className={cn(
                    "overflow-hidden group transition-all hover:shadow-md",
                    !service.isActive && "opacity-60"
                  )}
                >
                  {/* Image / Gradient placeholder */}
                  {service.image ? (
                    <div className="relative h-40 overflow-hidden">
                      <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                      {!service.isActive && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Badge variant="secondary" className="bg-red-500/90 text-white border-0">
                            Inactif
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "h-40 bg-gradient-to-br flex items-center justify-center",
                        getCategoryGradient(service.category)
                      )}
                    >
                      <span className="text-4xl">{getCategoryEmoji(service.category)}</span>
                    </div>
                  )}

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium truncate">{service.name}</h3>
                          <Badge className={cn("text-xs flex-shrink-0 border-0", getCategoryColor(service.category))}>
                            {getCategoryLabel(service.category)}
                          </Badge>
                        </div>

                        <p className="text-lg font-bold text-cyan-600 mt-1">
                          {formatAmount(service.basePrice)}
                        </p>

                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>{PRICE_TYPE_LABELS[service.priceType] || service.priceType}</span>
                          {service.duration && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {service.duration} min
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          {service.isActive ? (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactif
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Action dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditService(service)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setServiceToDelete(service)
                              setIsDeleteServiceDialogOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-2">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group",
                      !service.isActive && "opacity-60"
                    )}
                  >
                    {/* Thumbnail */}
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-14 h-14 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                          getCategoryGradient(service.category)
                        )}
                      >
                        <span className="text-2xl">{getCategoryEmoji(service.category)}</span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium truncate">{service.name}</h3>
                        <Badge className={cn("text-xs flex-shrink-0 border-0", getCategoryColor(service.category))}>
                          {getCategoryLabel(service.category)}
                        </Badge>
                        {service.isActive ? (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200">Actif</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-red-600 border-red-200">Inactif</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="font-semibold text-cyan-600">{formatAmount(service.basePrice)}</span>
                        <span>{PRICE_TYPE_LABELS[service.priceType] || service.priceType}</span>
                        {service.duration && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {service.duration} min
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditService(service)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setServiceToDelete(service)
                              setIsDeleteServiceDialogOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Empty State */}
          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <ConciergeBell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">Aucun service</h3>
              <p className="text-gray-500 mb-4">
                {catalogueSearch || categoryFilter !== "all" || statusFilter !== "all"
                  ? "Aucun service ne correspond à vos filtres"
                  : "Commencez par ajouter des services à votre catalogue"}
              </p>
              {!catalogueSearch && categoryFilter === "all" && statusFilter === "all" && (
                <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={handleNewService}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un service
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════ TAB 2: COMMANDES ═══════════════════ */}
        <TabsContent value="commandes" className="space-y-6">
          {/* Stats bar (clickable) */}
          <div className="flex flex-wrap gap-3 text-sm">
            <button
              onClick={() => setBookingStatusFilter(bookingStatusFilter === "all" ? "all" : "all")}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
                bookingStatusFilter === "all" ? "bg-gray-100 dark:bg-gray-800 font-medium" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <ShoppingCart className="w-3.5 h-3.5" /> <strong>{bookingStats.total}</strong> Total
            </button>
            <button
              onClick={() => setBookingStatusFilter(bookingStatusFilter === "pending" ? "all" : "pending")}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
                bookingStatusFilter === "pending" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 font-medium" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Clock className="w-3.5 h-3.5" /> <strong>{bookingStats.pending}</strong> En attente
            </button>
            <button
              onClick={() => setBookingStatusFilter(bookingStatusFilter === "confirmed" ? "all" : "confirmed")}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
                bookingStatusFilter === "confirmed" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 font-medium" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <CheckCircle className="w-3.5 h-3.5" /> <strong>{bookingStats.confirmed}</strong> Confirmées
            </button>
            <button
              onClick={() => setBookingStatusFilter(bookingStatusFilter === "completed" ? "all" : "completed")}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
                bookingStatusFilter === "completed" ? "bg-green-100 dark:bg-green-900/30 text-green-700 font-medium" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <CheckCircle className="w-3.5 h-3.5" /> <strong>{bookingStats.completed}</strong> Terminées
            </button>
            <span className="flex items-center gap-1.5 text-gray-500">
              <DollarSign className="w-3.5 h-3.5 text-cyan-600" /> <strong>{formatAmount(bookingStats.totalRevenue)}</strong> Revenu total
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher par service ou client..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {BOOKING_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bookings List */}
          <div className="space-y-3">
            {filteredBookings.map((booking) => {
              const statusInfo = getStatusBadge(booking.status)
              const canDelete = booking.status === "pending" || booking.status === "cancelled"

              return (
                <Card key={booking.id} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row gap-4 p-4">
                    {/* Service image */}
                    {booking.service.image ? (
                      <img
                        src={booking.service.image}
                        alt={booking.service.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                          getCategoryGradient(booking.service.category)
                        )}
                      >
                        <span className="text-2xl sm:text-3xl">{getCategoryEmoji(booking.service.category)}</span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{booking.service.name}</h3>
                            <Badge className={cn("text-xs border-0", statusInfo.color)}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <User className="w-3.5 h-3.5" />
                            <span>{booking.guest.firstName} {booking.guest.lastName}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm">
                            <span className="text-gray-600 dark:text-gray-300">
                              {booking.quantity} × {formatAmount(booking.unitPrice)}
                            </span>
                            <span className="font-semibold text-cyan-600">
                              = {formatAmount(booking.totalPrice)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {booking.scheduledDate && (
                              <span className="flex items-center gap-0.5">
                                <Calendar className="w-3 h-3" />
                                {format(parseISO(booking.scheduledDate), "dd MMM yyyy", { locale: fr })}
                              </span>
                            )}
                            {booking.scheduledTime && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {booking.scheduledTime}
                              </span>
                            )}
                          </div>
                          {booking.notes && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {booking.notes}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {BOOKING_STATUSES.filter((s) => s.value !== booking.status).map((s) => (
                                <DropdownMenuItem
                                  key={s.value}
                                  onClick={() => handleUpdateBookingStatus(booking.id, s.value)}
                                >
                                  {s.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => {
                                setBookingToDelete(booking)
                                setIsDeleteBookingDialogOpen(true)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Empty State */}
          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">Aucune commande</h3>
              <p className="text-gray-500 mb-4">
                {bookingSearch || bookingStatusFilter !== "all"
                  ? "Aucune commande ne correspond à vos critères"
                  : "Créez votre première commande de service"}
              </p>
              {!bookingSearch && bookingStatusFilter === "all" && (
                <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={handleNewBooking}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle commande
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══════════════════ SERVICE DIALOG ═══════════════════ */}
      <Dialog open={isServiceDialogOpen} onOpenChange={(open) => !open && setIsServiceDialogOpen(false)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Modifier le service" : "Nouveau service"}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? "Modifiez les informations du service"
                : "Ajoutez un nouveau service à votre catalogue"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {serviceFormError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-3 rounded-md">
                {serviceFormError}
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="service-name">Nom du service *</Label>
              <Input
                id="service-name"
                value={serviceForm.name}
                onChange={(e) => handleServiceFormChange("name", e.target.value)}
                placeholder="Ex: Navette aéroport"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="service-description">Description</Label>
              <Textarea
                id="service-description"
                value={serviceForm.description}
                onChange={(e) => handleServiceFormChange("description", e.target.value)}
                placeholder="Description optionnelle du service..."
                rows={3}
              />
            </div>

            {/* Category + Price Type (2 cols) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={serviceForm.category}
                  onValueChange={(v) => handleServiceFormChange("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.emoji} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type de prix</Label>
                <Select
                  value={serviceForm.priceType}
                  onValueChange={(v) => handleServiceFormChange("priceType", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Prix fixe</SelectItem>
                    <SelectItem value="per_person">Par personne</SelectItem>
                    <SelectItem value="per_unit">Par unité</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price + Duration (2 cols) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-price">Prix de base *</Label>
                <Input
                  id="service-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={serviceForm.basePrice}
                  onChange={(e) => handleServiceFormChange("basePrice", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-duration">Durée (min)</Label>
                <Input
                  id="service-duration"
                  type="number"
                  min="0"
                  value={serviceForm.duration}
                  onChange={(e) => handleServiceFormChange("duration", e.target.value)}
                  placeholder="Optionnel"
                />
              </div>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="service-sort-order">Ordre d&apos;affichage</Label>
              <Input
                id="service-sort-order"
                type="number"
                min="0"
                value={serviceForm.sortOrder}
                onChange={(e) => handleServiceFormChange("sortOrder", e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-cyan-400 hover:text-cyan-500 transition-colors"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-5 h-5" />
                    )}
                    <span className="text-[10px]">500 Ko max</span>
                  </button>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUploadImage(file)
                    e.target.value = ""
                  }}
                />
                {!imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Choisir une image
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="service-active" className="cursor-pointer">Service actif</Label>
                <p className="text-xs text-gray-500">
                  Les services inactifs ne sont pas proposés aux clients
                </p>
              </div>
              <Switch
                id="service-active"
                checked={serviceForm.isActive}
                onCheckedChange={(checked) => handleServiceFormChange("isActive", checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)} disabled={isServiceSaving}>
              Annuler
            </Button>
            <Button
              className="bg-cyan-600 hover:bg-cyan-700"
              onClick={handleSaveService}
              disabled={isServiceSaving}
            >
              {isServiceSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  {editingService ? "Enregistrer" : "Créer le service"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ DELETE SERVICE DIALOG ═══════════════════ */}
      <AlertDialog open={isDeleteServiceDialogOpen} onOpenChange={(open) => !open && setIsDeleteServiceDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le service</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{serviceToDelete?.name}</strong> ?
              Cette action est irréversible. {serviceToDelete?.serviceBookings && serviceToDelete.serviceBookings.length > 0 && (
                <span className="text-red-600 font-medium">
                  {" "}
                  Ce service a {serviceToDelete.serviceBookings.length} commande(s) associée(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingService}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteService}
              disabled={isDeletingService}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeletingService ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════ BOOKING DIALOG ═══════════════════ */}
      <Dialog open={isBookingDialogOpen} onOpenChange={(open) => !open && setIsBookingDialogOpen(false)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle commande de service</DialogTitle>
            <DialogDescription>
              Créez une commande pour un service supplémentaire
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {bookingFormError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-3 rounded-md">
                {bookingFormError}
              </div>
            )}

            {/* Service selector */}
            <div className="space-y-2">
              <Label>Service *</Label>
              <Select
                value={bookingForm.serviceId}
                onValueChange={(v) => handleBookingFormChange("serviceId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  {activeServices.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <span>{getCategoryEmoji(s.category)}</span>
                        <span>{s.name}</span>
                        <span className="text-gray-400">— {formatAmount(s.basePrice)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Guest selector */}
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select
                value={bookingForm.guestId}
                onValueChange={(v) => handleBookingFormChange("guestId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {guests.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.firstName} {g.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {guests.length === 0 && (
                <p className="text-xs text-gray-500">
                  Aucun client trouvé. Ajoutez d&apos;abord des clients.
                </p>
              )}
            </div>

            {/* Booking link */}
            <div className="space-y-2">
              <Label>Réservation (optionnel)</Label>
              <Select
                value={bookingForm.bookingId}
                onValueChange={handleBookingSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Lier à une réservation" />
                </SelectTrigger>
                <SelectContent>
                  {activeBookings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      Chambre {b.room.number}{b.room.name ? ` — ${b.room.name}` : ""} ({b.guest.firstName} {b.guest.lastName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeBookings.length === 0 && (
                <p className="text-xs text-gray-500">
                  Aucune réservation en cours (checked-in).
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="booking-quantity">Quantité</Label>
              <Input
                id="booking-quantity"
                type="number"
                min="1"
                value={bookingForm.quantity}
                onChange={(e) => handleBookingFormChange("quantity", e.target.value)}
              />
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="booking-date">Date prévue</Label>
                <Input
                  id="booking-date"
                  type="date"
                  value={bookingForm.scheduledDate}
                  onChange={(e) => handleBookingFormChange("scheduledDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-time">Heure prévue</Label>
                <Input
                  id="booking-time"
                  type="time"
                  value={bookingForm.scheduledTime}
                  onChange={(e) => handleBookingFormChange("scheduledTime", e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="booking-notes">Notes</Label>
              <Textarea
                id="booking-notes"
                value={bookingForm.notes}
                onChange={(e) => handleBookingFormChange("notes", e.target.value)}
                placeholder="Notes optionnelles..."
                rows={3}
              />
            </div>

            {/* Auto-calculated total */}
            {bookingForm.serviceId && bookingFormTotal > 0 && (
              <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total estimé</span>
                  <span className="text-xl font-bold text-cyan-600">
                    {formatAmount(bookingFormTotal)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {parseInt(bookingForm.quantity) || 0} × {formatAmount(activeServices.find((s) => s.id === bookingForm.serviceId)?.basePrice || 0)}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)} disabled={isBookingSaving}>
              Annuler
            </Button>
            <Button
              className="bg-cyan-600 hover:bg-cyan-700"
              onClick={handleSaveBooking}
              disabled={isBookingSaving}
            >
              {isBookingSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Créer la commande"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ DELETE BOOKING DIALOG ═══════════════════ */}
      <AlertDialog open={isDeleteBookingDialogOpen} onOpenChange={(open) => !open && setIsDeleteBookingDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la commande</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette commande de{" "}
              <strong>{bookingToDelete?.service.name}</strong> pour{" "}
              <strong>{bookingToDelete?.guest.firstName} {bookingToDelete?.guest.lastName}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingBooking}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBooking}
              disabled={isDeletingBooking}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeletingBooking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
