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
import {
  CreditCard,
  Plus,
  Loader2,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileText,
  Filter,
  XCircle,
  Send,
  CheckCircle,
  Download,
  Receipt,
  CalendarDays,
  User,
  RotateCcw,
  AlertCircle,
  ArrowRightLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
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
}

interface Booking {
  id: string
  guestId: string
  checkIn: string
  checkOut: string
  nightlyRate: number
  totalPrice: number
  adults: number
  children: number
  room: Room
  hasInvoice: boolean
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  taxRate: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string | null
  subtotal: number
  taxes: number
  discount: number
  total: number
  status: string
  notes: string | null
  guest: Guest
  booking: Booking | null
  items: InvoiceItem[]
  paidAmount: number
  remainingAmount: number
}

// Status colors and labels - with all possible statuses
const invoiceStatuses: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Brouillon", color: "text-gray-700", bg: "bg-gray-100" },
  sent: { label: "Envoyée", color: "text-sky-700", bg: "bg-sky-100" },
  paid: { label: "Payée", color: "text-green-700", bg: "bg-green-100" },
  partial: { label: "Partielle", color: "text-yellow-700", bg: "bg-yellow-100" },
  refunded: { label: "Remboursée", color: "text-orange-700", bg: "bg-orange-100" },
  cancelled: { label: "Annulée", color: "text-red-700", bg: "bg-red-100" },
}

const defaultItemForm = {
  description: "",
  quantity: "1",
  unitPrice: "",
  taxRate: "0",
}

export default function InvoicesPage() {
  const { data: session, status } = useSession()
  const currency = session?.user?.guestHouseCurrency || "EUR"
  const currencySymbol = new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(0).replace(/[\d\s.,]+/, "").trim()
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount)
  }
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [invoiceToUpdate, setInvoiceToUpdate] = useState<Invoice | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [selectedBookingId, setSelectedBookingId] = useState<string>("")

  // Form state
  const [formData, setFormData] = useState({
    guestId: "",
    bookingId: "",
    dueDate: "",
    notes: "",
    terms: "",
    items: [{ ...defaultItemForm }],
    touristTax: false,
    touristTaxPerNight: "0.60",
    touristTaxNights: "0",
  })

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
      const matchesSearch =
        !searchQuery ||
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${invoice.guest.firstName} ${invoice.guest.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [invoices, statusFilter, searchQuery])

  // Get available bookings for selected guest (not yet invoiced)
  const availableBookings = useMemo(() => {
    if (!formData.guestId || !bookings || bookings.length === 0) return []
    try {
      return bookings.filter(b => b && b.guestId === formData.guestId && !b.hasInvoice)
    } catch (err) {
      console.error("Error calculating availableBookings:", err)
      return []
    }
  }, [bookings, formData.guestId])

  // Calculate totals
  const calculateTotals = () => {
    const items = formData.items.map((item) => ({
      ...item,
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.unitPrice) || 0,
    }))

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const taxes = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice
      return sum + itemTotal * ((parseFloat(item.taxRate) || 0) / 100)
    }, 0)
    
    // Calculate tourist tax
    const touristTaxAmount = formData.touristTax 
      ? parseFloat(formData.touristTaxPerNight || "0") * parseInt(formData.touristTaxNights || "0")
      : 0
    
    const total = subtotal + taxes + touristTaxAmount

    return { subtotal, taxes, touristTaxAmount, total }
  }

  // Fetch data
  const fetchData = async () => {
    if (!session?.user?.guestHouseId) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const [invoicesRes, guestsRes, bookingsRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/guests"),
        fetch("/api/bookings"),
      ])

      if (invoicesRes.ok) {
        const data = await invoicesRes.json()
        setInvoices(Array.isArray(data.invoices) ? data.invoices : [])
      } else {
        console.error("Failed to fetch invoices:", invoicesRes.status)
      }

      if (guestsRes.ok) {
        const data = await guestsRes.json()
        setGuests(Array.isArray(data.guests) ? data.guests : [])
      } else {
        console.error("Failed to fetch guests:", guestsRes.status)
      }

      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setBookings(Array.isArray(data.bookings) ? data.bookings : [])
      } else {
        console.error("Failed to fetch bookings:", bookingsRes.status)
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

  // Open new invoice dialog
  const handleNewInvoice = () => {
    setEditingInvoice(null)
    setFormData({
      guestId: "",
      bookingId: "",
      dueDate: "",
      notes: "",
      terms: "",
      items: [{ ...defaultItemForm }],
    })
    setSelectedBookingId("")
    setFormError("")
    setIsDialogOpen(true)
  }

  // Open edit invoice dialog
  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setFormData({
      guestId: invoice.guest.id,
      bookingId: invoice.booking?.id || "",
      dueDate: invoice.dueDate ? format(parseISO(invoice.dueDate), "yyyy-MM-dd") : "",
      notes: invoice.notes || "",
      terms: "",
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        taxRate: item.taxRate.toString(),
      })),
    })
    setFormError("")
    setIsDialogOpen(true)
  }

  // Handle form change
  const handleFormChange = (field: string, value: string) => {
    try {
      setFormData((prev) => ({ ...prev, [field]: value }))
      
      // Reset booking when guest changes
      if (field === "guestId") {
        setFormData(prev => ({ ...prev, bookingId: "", items: [{ ...defaultItemForm }] }))
      }
    } catch (err) {
      console.error("Error in handleFormChange:", err)
    }
  }

  // Handle booking selection - import stay costs
  const handleBookingSelect = (bookingId: string) => {
    try {
      setFormData(prev => ({ ...prev, bookingId }))
      
      if (!bookingId) {
        setFormData(prev => ({ ...prev, items: [{ ...defaultItemForm }] }))
        return
      }

      const booking = bookings.find(b => b.id === bookingId)
      if (booking && booking.room) {
        const checkInDate = new Date(booking.checkIn)
        const checkOutDate = new Date(booking.checkOut)
        const nights = Math.max(1, Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
        ))
        
        const roomNumber = booking.room?.number || 'N/A'
        
        // Auto-fill with booking details
        setFormData(prev => ({
          ...prev,
          bookingId,
          items: [{
            description: `Séjour chambre ${roomNumber} (${format(checkInDate, "d MMM", { locale: fr })} - ${format(checkOutDate, "d MMM yyyy", { locale: fr })}) - ${nights} nuit${nights > 1 ? 's' : ''}`,
            quantity: nights.toString(),
            unitPrice: (booking.nightlyRate || 0).toString(),
            taxRate: "10", // Default tax rate
          }],
        }))
      }
    } catch (err) {
      console.error("Error in handleBookingSelect:", err)
      // Fallback to default items
      setFormData(prev => ({ ...prev, items: [{ ...defaultItemForm }] }))
    }
  }

  // Handle item change
  const handleItemChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      return { ...prev, items: newItems }
    })
  }

  // Add item
  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...defaultItemForm }],
    }))
  }

  // Remove item
  const removeItem = (index: number) => {
    if (formData.items.length === 1) return
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  // Save invoice
  const handleSaveInvoice = async () => {
    setFormError("")

    if (!formData.guestId) {
      setFormError("Veuillez sélectionner un client")
      return
    }

    if (formData.items.length === 0 || !formData.items[0].description) {
      setFormError("Veuillez ajouter au moins un article")
      return
    }

    // Check for duplicate invoice if booking is selected
    if (formData.bookingId && !editingInvoice) {
      const existingInvoice = invoices.find(inv => inv.booking?.id === formData.bookingId)
      if (existingInvoice) {
        setFormError(`Une facture (${existingInvoice.invoiceNumber}) existe déjà pour ce séjour. Un séjour ne peut avoir qu'une seule facture.`)
        return
      }
    }

    setIsSaving(true)

    const { subtotal, taxes, touristTaxAmount, total } = calculateTotals()

    try {
      const url = editingInvoice ? `/api/invoices/${editingInvoice.id}` : "/api/invoices"
      const method = editingInvoice ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: formData.guestId,
          bookingId: formData.bookingId || null,
          dueDate: formData.dueDate || null,
          notes: formData.notes || null,
          terms: formData.terms || null,
          subtotal,
          taxes,
          discount: 0,
          total,
          touristTaxApplied: formData.touristTax,
          touristTaxPerNight: parseFloat(formData.touristTaxPerNight) || 0,
          touristTaxNights: parseInt(formData.touristTaxNights) || 0,
          touristTaxAmount,
          items: formData.items.map((item) => ({
            description: item.description,
            quantity: parseFloat(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            total: (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0),
            taxRate: parseFloat(item.taxRate) || 0,
          })),
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

  // Open status change dialog
  const handleOpenStatusDialog = (invoice: Invoice) => {
    setInvoiceToUpdate(invoice)
    setNewStatus(invoice.status)
    setIsStatusDialogOpen(true)
  }

  // Update invoice status
  const handleUpdateStatus = async () => {
    if (!invoiceToUpdate || !newStatus) return

    try {
      const response = await fetch(`/api/invoices/${invoiceToUpdate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setIsStatusDialogOpen(false)
        setInvoiceToUpdate(null)
        fetchData()
      }
    } catch (err) {
      console.error("Erreur mise à jour:", err)
    }
  }

  // Quick status update
  const handleQuickStatusUpdate = async (invoiceId: string, status: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (err) {
      console.error("Erreur mise à jour:", err)
    }
  }

  // Delete invoice
  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/invoices/${invoiceToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setIsDeleteDialogOpen(false)
        setInvoiceToDelete(null)
        fetchData()
      }
    } catch (err) {
      console.error("Erreur suppression:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  // Stats
  const stats = useMemo(() => {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0)
    const paidAmount = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0)
    const pendingAmount = totalAmount - paidAmount

    return {
      total: invoices.length,
      totalAmount,
      paidAmount,
      pendingAmount,
    }
  }, [invoices])

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
        <CreditCard className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Configuration requise</h2>
        <p className="text-gray-500 mb-4 text-center">
          Vous devez créer votre maison d'hôtes avant de gérer les factures.
        </p>
        <Button onClick={() => router.push("/onboarding")}>
          Créer ma maison d'hôtes
        </Button>
      </div>
    )
  }

  const { subtotal, taxes, touristTaxAmount, total } = calculateTotals()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Facturation</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez vos factures et paiements
          </p>
        </div>
        <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleNewInvoice}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle facture
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Total factures</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Receipt className="w-4 h-4" />
              <span className="text-sm">Montant total</span>
            </div>
            <p className="text-2xl font-bold">{formatAmount(stats.totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Encaissé</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatAmount(stats.paidAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <CalendarDays className="w-4 h-4" />
              <span className="text-sm">En attente</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{formatAmount(stats.pendingAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher par numéro ou client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(invoiceStatuses).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
          <Filter className="w-4 h-4" />
          Statut:
        </span>
        <button
          onClick={() => setStatusFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
            statusFilter === "all"
              ? "bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          )}
        >
          Tous
        </button>
        {Object.entries(invoiceStatuses).map(([key, value]) => {
          const count = invoices.filter((inv) => inv.status === key).length
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all border flex items-center gap-2",
                statusFilter === key
                  ? `${value.bg} ${value.color}`
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              {value.label}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                statusFilter === key ? "bg-white/50" : "bg-gray-100 dark:bg-gray-700"
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des factures</CardTitle>
          <CardDescription>
            {filteredInvoices.length} facture{filteredInvoices.length > 1 ? "s" : ""}
            {statusFilter !== "all" && ` (${invoiceStatuses[statusFilter]?.label})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">Aucune facture</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter !== "all"
                  ? "Aucune facture avec ce statut"
                  : "Commencez par créer votre première facture"}
              </p>
              <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleNewInvoice}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle facture
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => {
                const statusInfo = invoiceStatuses[invoice.status] || invoiceStatuses.draft
                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => router.push(`/app/invoices/${invoice.id}`)}
                    >
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", statusInfo.bg)}>
                        <FileText className={cn("w-5 h-5", statusInfo.color)} />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-500">
                          {invoice.guest.firstName} {invoice.guest.lastName}
                          {invoice.booking && (
                            <span className="ml-2">
                              • Chambre {invoice.booking.room.number}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="font-semibold">{formatAmount(invoice.total)}</p>
                        <p className="text-xs text-gray-500">{format(parseISO(invoice.invoiceDate), "d MMM yyyy", { locale: fr })}</p>
                      </div>
                      <Badge className={cn(statusInfo.bg, statusInfo.color, "border-0")}>
                        {statusInfo.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-gray-700 dark:text-gray-300">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/app/invoices/${invoice.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          {invoice.status === "draft" && (
                            <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenStatusDialog(invoice)}>
                            <ArrowRightLeft className="w-4 h-4 mr-2" />
                            Changer le statut
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {invoice.status === "draft" && (
                            <DropdownMenuItem onClick={() => handleQuickStatusUpdate(invoice.id, "sent")}>
                              <Send className="w-4 h-4 mr-2" />
                              Marquer envoyée
                            </DropdownMenuItem>
                          )}
                          {(invoice.status === "sent" || invoice.status === "draft") && (
                            <DropdownMenuItem onClick={() => handleQuickStatusUpdate(invoice.id, "paid")}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marquer payée
                            </DropdownMenuItem>
                          )}
                          {invoice.status === "paid" && (
                            <DropdownMenuItem 
                              className="text-orange-600"
                              onClick={() => handleQuickStatusUpdate(invoice.id, "refunded")}
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Marquer remboursée
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteClick(invoice)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          )}
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

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le statut</DialogTitle>
            <DialogDescription>
              Facture : {invoiceToUpdate?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Nouveau statut</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(invoiceStatuses).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", value.bg)} />
                      {value.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Annuler
            </Button>
            <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleUpdateStatus}>
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la facture</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la facture{" "}
              <strong>{invoiceToDelete?.invoiceNumber}</strong> ?
              <br />
              <span className="text-red-600 font-medium">Cette action est irréversible.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New/Edit Invoice Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? "Modifier la facture" : "Nouvelle facture"}
            </DialogTitle>
            <DialogDescription>
              {editingInvoice ? "Modifiez les informations de la facture" : "Créez une nouvelle facture"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {formError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {formError}
              </div>
            )}

            {/* Client Selection */}
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={formData.guestId} onValueChange={(v) => handleFormChange("guestId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {guests.map((guest) => (
                    <SelectItem key={guest.id} value={guest.id}>
                      {guest.firstName} {guest.lastName}
                      {guest.email && ` (${guest.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Booking Selection - Import stay costs */}
            {!editingInvoice && formData.guestId && availableBookings.length > 0 && (
              <div className="space-y-2 p-4 bg-sky-50 dark:bg-sky-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-sky-600" />
                  <Label>Importer un séjour (optionnel)</Label>
                </div>
                <p className="text-sm text-gray-500">
                  Sélectionnez un séjour pour importer automatiquement les frais. Cela évitera la double facturation.
                </p>
                <Select value={formData.bookingId || undefined} onValueChange={handleBookingSelect}>
                  <SelectTrigger className="relative">
                    <SelectValue placeholder="Sélectionner un séjour" />
                    {formData.bookingId && (
                      <button
                        type="button"
                        className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFormData(prev => ({ ...prev, bookingId: "", items: [{ ...defaultItemForm }] }))
                        }}
                      >
                        <XCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {availableBookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        Chambre {booking.room?.number || 'N/A'} - {format(new Date(booking.checkIn), "d MMM", { locale: fr })} au {format(new Date(booking.checkOut), "d MMM yyyy", { locale: fr })} ({formatAmount(booking.totalPrice)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Warning if no bookings available */}
            {!editingInvoice && formData.guestId && availableBookings.length === 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
                Aucun séjour sans facture disponible pour ce client.
              </div>
            )}

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Articles</Label>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="col-span-5 space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        placeholder="Description de l'article"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Qté</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Prix unitaire</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">TVA %</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={item.taxRate}
                        onChange={(e) => handleItemChange(index, "taxRate", e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      {formData.items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => removeItem(index)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="bg-sky-50 dark:bg-sky-950 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sous-total</span>
                  <span>{formatAmount(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA</span>
                  <span>{formatAmount(taxes)}</span>
                </div>
                {formData.touristTax && touristTaxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Taxe de séjour ({formData.touristTaxNights} nuits × {formData.touristTaxPerNight}{currencySymbol})</span>
                    <span>{formatAmount(touristTaxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="text-sky-600">{formatAmount(total)}</span>
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date d'échéance</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleFormChange("dueDate", e.target.value)}
                />
              </div>
            </div>

            {/* Tourist Tax */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="touristTax"
                  checked={formData.touristTax}
                  onChange={(e) => handleFormChange("touristTax", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="touristTax" className="font-normal cursor-pointer">
                  Taxe de séjour
                </Label>
              </div>
              
              {formData.touristTax && (
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Tarif/nuit/personne ({currencySymbol})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.touristTaxPerNight}
                      onChange={(e) => handleFormChange("touristTaxPerNight", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Nombre de nuits</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.touristTaxNights}
                      onChange={(e) => handleFormChange("touristTaxNights", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Montant</Label>
                    <div className="p-2 bg-white dark:bg-gray-800 rounded border text-sm font-medium text-sky-600">
                      {formatAmount(touristTaxAmount)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleFormChange("notes", e.target.value)}
                placeholder="Notes visibles sur la facture..."
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
              onClick={handleSaveInvoice}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                editingInvoice ? "Modifier" : "Créer la facture"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
