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
  Printer,
  FileSpreadsheet,
  UtensilsCrossed,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useCurrency } from "@/hooks/use-currency"
import * as XLSX from "xlsx"

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
  pricingMode?: string
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
  itemType?: string | null
  referenceId?: string | null
}

interface RestaurantOrderForInvoice {
  id: string
  guestName: string | null
  orderType: string
  total: number
  status: string
  paymentStatus: string
  orderDate: string
  items: {
    id: string
    menuItemId: string
    quantity: number
    unitPrice: number
    total: number
    notes: string | null
    menuItem: {
      id: string
      name: string
      price: number
      category: string
    }
  }[]
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
  itemType: null as string | null,
  referenceId: null as string | null,
}

export default function InvoicesPage() {
  const { data: session, status } = useSession()
  const { currency, symbol, formatAmount } = useCurrency()
  const router = useRouter()
  const userRole = session?.user?.role || ""
  const canDeleteInvoice = ["owner", "admin"].includes(userRole)
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
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [restaurantOrders, setRestaurantOrders] = useState<RestaurantOrderForInvoice[]>([])

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
      const invDate = new Date(invoice.invoiceDate)
      const matchesDateFrom = !dateFrom || invDate >= new Date(dateFrom)
      const matchesDateTo = !dateTo || invDate <= new Date(dateTo + "T23:59:59")
      return matchesStatus && matchesSearch && matchesDateFrom && matchesDateTo
    })
  }, [invoices, statusFilter, searchQuery, dateFrom, dateTo])

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

  // Get the selected guest's full name for matching restaurant orders
  const selectedGuestFullName = useMemo(() => {
    if (!formData.guestId || !guests || guests.length === 0) return ""
    const g = guests.find(g => g.id === formData.guestId)
    if (!g) return ""
    return `${g.firstName} ${g.lastName}`.toLowerCase().trim()
  }, [guests, formData.guestId])

  // Get unbilled restaurant orders for selected guest (matching by guest name)
  // Also exclude orders already present in the current invoice form items
  const availableRestaurantOrders = useMemo(() => {
    if (!formData.guestId || !restaurantOrders || restaurantOrders.length === 0) return []
    if (!selectedGuestFullName) return []

    // Collect order IDs already added to form items
    const alreadyAddedOrderIds = new Set(
      formData.items
        .filter((item: any) => item.referenceId && (item.itemType === "restaurant_order" || item.itemType === "restaurant_order_header"))
        .map((item: any) => item.referenceId)
    )

    return restaurantOrders.filter(o => {
      if (!o.guestName || o.paymentStatus !== "pending" || o.status === "cancelled") return false
      if (alreadyAddedOrderIds.has(o.id)) return false
      // Match by checking if order guest name contains the selected guest's first or last name
      const orderName = o.guestName.toLowerCase().trim()
      const parts = selectedGuestFullName.split(" ")
      return parts.some(part => part.length > 1 && orderName.includes(part))
    })
  }, [restaurantOrders, formData.guestId, selectedGuestFullName, formData.items])

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
      const [invoicesRes, guestsRes, bookingsRes, ordersRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/guests"),
        fetch("/api/bookings"),
        fetch("/api/restaurant-orders"),
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

      if (ordersRes.ok) {
        const data = await ordersRes.json()
        setRestaurantOrders(Array.isArray(data.orders) ? data.orders : [])
      } else {
        console.error("Failed to fetch restaurant orders:", ordersRes.status)
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
        itemType: item.itemType || null,
        referenceId: item.referenceId || null,
      })),
    })
    setFormError("")
    setIsDialogOpen(true)
  }

  // Handle form change
  const handleFormChange = (field: string, value: string) => {
    try {
      if (field === "guestId") {
        // Reset booking AND set new guestId in a single update
        setFormData(prev => ({ ...prev, guestId: value, bookingId: "", items: [{ ...defaultItemForm }] }))
      } else {
        setFormData((prev) => ({ ...prev, [field]: value }))
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
        const isPerPerson = booking.room?.pricingMode === "per_person"
        
        // Use totalPrice which already accounts for per_person/per_room calculation
        // But show the breakdown correctly in the description
        const accommodationTotal = booking.totalPrice || (nights * (booking.nightlyRate || 0))
        const unitPrice = Math.round((accommodationTotal / nights) * 100) / 100
        
        // Auto-fill with booking details
        setFormData(prev => ({
          ...prev,
          bookingId,
          items: [{
            description: `Séjour chambre ${roomNumber} (${format(checkInDate, "d MMM", { locale: fr })} - ${format(checkOutDate, "d MMM yyyy", { locale: fr })}) - ${nights} nuit${nights > 1 ? 's' : ''}${isPerPerson ? ` - ${booking.adults} pers.` : ""}`,
            quantity: nights.toString(),
            unitPrice: unitPrice.toString(),
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

  // Add restaurant order items to invoice
  const handleAddRestaurantOrder = (order: RestaurantOrderForInvoice) => {
    // Prevent duplicate: check if this order is already in the form
    const alreadyAdded = formData.items.some(
      (item: any) => item.referenceId === order.id && (item.itemType === "restaurant_order" || item.itemType === "restaurant_order_header")
    )
    if (alreadyAdded) return

    const orderLabel = order.orderType === "room" ? "Service en chambre"
      : order.orderType === "table" ? "Restaurant (sur place)"
      : "Restaurant (à emporter)"
    const orderDate = format(parseISO(order.orderDate), "d MMM yyyy, HH:mm", { locale: fr })

    // Add a header line for the order (zero-price label, not counted in totals)
    const headerItem = {
      description: `${orderLabel} — ${order.guestName || "Client"} — ${orderDate}`,
      quantity: "0",
      unitPrice: "0",
      taxRate: "0",
      itemType: "restaurant_order_header" as string | null,
      referenceId: order.id as string | null,
    }

    const newItems = order.items.map((item) => ({
      description: `${orderLabel} - ${item.menuItem.name}${item.notes ? ` (${item.notes})` : ""}`,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      taxRate: "0",
      itemType: "restaurant_order" as string | null,
      referenceId: order.id as string | null,
    }))

    // Remove the default empty item and append order items
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items.filter(i => i.description),
        headerItem,
        ...newItems,
      ],
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
            itemType: (item as any).itemType || null,
            referenceId: (item as any).referenceId || null,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setFormError(errorData.error || "Erreur lors de la sauvegarde")
        setIsSaving(false)
        return
      }

      // Mark restaurant orders as billed_to_room
      const restaurantOrderIds = formData.items
        .map((item, idx) => ({ refId: (item as any).referenceId, type: (item as any).itemType }))
        .filter((entry) => entry.refId && (entry.type === "restaurant_order" || entry.type === "restaurant_order_header"))
        .map((entry) => entry.refId)
      
      const uniqueOrderIds = [...new Set(restaurantOrderIds)]
      if (uniqueOrderIds.length > 0) {
        Promise.allSettled(
          uniqueOrderIds.map((id) =>
            fetch(`/api/restaurant-orders/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentStatus: "billed_to_room" }),
            })
          )
        )
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

  // ─── Print invoices list ─────────────────────────────────────────────────
  const handlePrintList = () => {
    const data = filteredInvoices
    if (data.length === 0) return

    const dateRangeLabel = dateFrom || dateTo
      ? ` (${dateFrom ? format(new Date(dateFrom), "dd/MM/yyyy", { locale: fr }) : "..." } — ${dateTo ? format(new Date(dateTo), "dd/MM/yyyy", { locale: fr }) : "..." })`
      : ""

    const totalFiltered = data.reduce((s, i) => s + i.total, 0)
    const paidFiltered = data.reduce((s, i) => s + i.paidAmount, 0)
    const remainingFiltered = totalFiltered - paidFiltered

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Liste des factures${dateRangeLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10pt; color: #000; padding: 1.5cm; }
    @page { size: A4 landscape; margin: 0; }
    @media print { body { padding: 1.5cm; } }
    h1 { font-size: 16pt; margin-bottom: 0.25rem; }
    .subtitle { color: #555; font-size: 9pt; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 9pt; }
    th { background: #f5f5f5; font-weight: 600; text-transform: uppercase; font-size: 8pt; color: #555; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-row { font-weight: 700; background: #f0f9ff; }
    .status-draft { color: #666; }
    .status-sent { color: #0369a1; }
    .status-paid { color: #15803d; }
    .status-partial { color: #a16207; }
    .status-refunded { color: #c2410c; }
    .status-cancelled { color: #dc2626; }
    .footer { margin-top: 1rem; display: flex; justify-content: flex-end; gap: 2rem; font-size: 9pt; }
    .footer-item { text-align: right; }
    .footer-item .label { color: #555; }
    .footer-item .value { font-weight: 700; font-size: 11pt; }
  </style>
</head>
<body>
  <h1>Liste des factures${dateRangeLabel}</h1>
  <p class="subtitle">${session?.user?.guestHouseName || "Établissement"} — ${data.length} facture${data.length > 1 ? "s" : ""} — Imprimé le ${format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
  <table>
    <thead>
      <tr>
        <th class="text-center">N°</th>
        <th>Date</th>
        <th>Client</th>
        <th>Chambre</th>
        <th class="text-right">Sous-total</th>
        <th class="text-right">TVA</th>
        <th class="text-right">Total</th>
        <th class="text-right">Payé</th>
        <th class="text-right">Reste</th>
        <th class="text-center">Statut</th>
      </tr>
    </thead>
    <tbody>
      ${data.map((inv, i) => {
        const st = invoiceStatuses[inv.status] || invoiceStatuses.draft
        const room = inv.booking?.room?.number || "—"
        return `<tr>
          <td class="text-center">${inv.invoiceNumber}</td>
          <td>${format(parseISO(inv.invoiceDate), "dd/MM/yyyy", { locale: fr })}</td>
          <td>${inv.guest.firstName} ${inv.guest.lastName}</td>
          <td>${room}</td>
          <td class="text-right">${inv.subtotal.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</td>
          <td class="text-right">${inv.taxes.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</td>
          <td class="text-right" style="font-weight:600">${inv.total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</td>
          <td class="text-right" style="color:#15803d">${inv.paidAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</td>
          <td class="text-right" style="color:${inv.remainingAmount > 0 ? "#c2410c" : "#15803d"}">${inv.remainingAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</td>
          <td class="text-center status-${inv.status}">${st.label}</td>
        </tr>`
      }).join("")}
    </tbody>
  </table>
  <div class="footer">
    <div class="footer-item"><span class="label">Total facturé</span><br><span class="value">${totalFiltered.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</span></div>
    <div class="footer-item"><span class="label">Total encaissé</span><br><span class="value" style="color:#15803d">${paidFiltered.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</span></div>
    <div class="footer-item"><span class="label">Reste à encaisser</span><br><span class="value" style="color:${remainingFiltered > 0 ? "#c2410c" : "#15803d"}">${remainingFiltered.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</span></div>
  </div>
</body>
</html>`

    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 250)
  }

  // ─── Export to Excel ─────────────────────────────────────────────────────
  const handleExportExcel = () => {
    const data = filteredInvoices
    if (data.length === 0) return

    const rows = data.map((inv, i) => ({
      "N° Facture": inv.invoiceNumber,
      "Date": format(parseISO(inv.invoiceDate), "dd/MM/yyyy", { locale: fr }),
      "Client": `${inv.guest.firstName} ${inv.guest.lastName}`,
      "Email": inv.guest.email || "",
      "Chambre": inv.booking?.room?.number || "",
      "Sous-total": inv.subtotal,
      "TVA": inv.taxes,
      "Total TTC": inv.total,
      "Payé": inv.paidAmount,
      "Reste": inv.remainingAmount,
      "Statut": (invoiceStatuses[inv.status] || invoiceStatuses.draft).label,
      "Échéance": inv.dueDate ? format(parseISO(inv.dueDate), "dd/MM/yyyy", { locale: fr }) : "",
    }))

    // Add totals row
    const totalFiltered = data.reduce((s, i) => s + i.total, 0)
    const paidFiltered = data.reduce((s, i) => s + i.paidAmount, 0)
    rows.push({
      "N° Facture": "",
      "Date": "",
      "Client": "",
      "Email": "",
      "Chambre": "TOTAL",
      "Sous-total": data.reduce((s, i) => s + i.subtotal, 0),
      "TVA": data.reduce((s, i) => s + i.taxes, 0),
      "Total TTC": totalFiltered,
      "Payé": paidFiltered,
      "Reste": totalFiltered - paidFiltered,
      "Statut": "",
      "Échéance": "",
    })

    const ws = XLSX.utils.json_to_sheet(rows)

    // Set column widths
    ws["!cols"] = [
      { wch: 20 }, // N° Facture
      { wch: 12 }, // Date
      { wch: 22 }, // Client
      { wch: 26 }, // Email
      { wch: 10 }, // Chambre
      { wch: 12 }, // Sous-total
      { wch: 10 }, // TVA
      { wch: 12 }, // Total TTC
      { wch: 12 }, // Payé
      { wch: 12 }, // Reste
      { wch: 12 }, // Statut
      { wch: 12 }, // Échéance
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Factures")

    const dateLabel = dateFrom || dateTo
      ? `_du-${dateFrom || "debut"}_au-${dateTo || "fin"}`
      : ""
    XLSX.writeFile(wb, `factures${dateLabel}.xlsx`)
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher par numéro ou client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="Du"
          className="w-full sm:w-40"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="Au"
          className="w-full sm:w-40"
        />
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
        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-gray-600"
            onClick={() => { setDateFrom(""); setDateTo("") }}
            title="Réinitialiser les dates"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Date filter active indicator + action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {(dateFrom || dateTo) && (
          <p className="text-sm text-gray-500">
            <CalendarDays className="w-4 h-4 inline mr-1" />
            Période : {dateFrom ? format(new Date(dateFrom), "dd MMM yyyy", { locale: fr }) : "..."} — {dateTo ? format(new Date(dateTo), "dd MMM yyyy", { locale: fr }) : "..."}
            <span className="ml-2 font-medium text-gray-700">({filteredInvoices.length} facture{filteredInvoices.length > 1 ? "s" : ""})</span>
          </p>
        )}
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintList}
            disabled={filteredInvoices.length === 0}
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimer la liste
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={filteredInvoices.length === 0}
            className="gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exporter Excel
          </Button>
        </div>
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
                          {canDeleteInvoice && invoice.status !== "paid" && invoice.status !== "cancelled" && (
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ minWidth: '720px', resize: 'both' }}>
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

            {/* Import Restaurant Orders */}
            {formData.guestId && availableRestaurantOrders.length > 0 && (
              <div className="space-y-2 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
                  <UtensilsCrossed className="w-4 h-4" />
                  Commandes restaurant ({availableRestaurantOrders.length} non facturée{availableRestaurantOrders.length > 1 ? "s" : ""})
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableRestaurantOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => handleAddRestaurantOrder(order)}
                      className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border hover:border-orange-300 dark:hover:border-orange-600 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {order.orderType === "room" ? "🛏️" : order.orderType === "table" ? "🍽️" : "🥡"}{" "}
                          {order.guestName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.items.length} article{order.items.length > 1 ? "s" : ""} • {format(parseISO(order.orderDate), "d MMM, HH:mm", { locale: fr })}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(", ")}
                        </p>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="font-semibold text-sm">{formatAmount(order.total)}</p>
                        <Plus className="w-4 h-4 mx-auto mt-1 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
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
                {formData.items.map((item, index) => {
                  const isRestaurantItem = (item as any).itemType === "restaurant_order" || (item as any).itemType === "restaurant_order_header"
                  const isHeaderItem = (item as any).itemType === "restaurant_order_header"

                  return (
                  <div key={index} className={cn(
                    "grid grid-cols-12 gap-2 items-end p-3 rounded-lg",
                    isRestaurantItem
                      ? isHeaderItem
                        ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50"
                        : "bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40"
                      : "bg-gray-50 dark:bg-gray-900"
                  )}>
                    <div className="col-span-5 space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        Description
                        {isRestaurantItem && (
                          <Lock className="w-3 h-3 text-orange-500" />
                        )}
                      </Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        placeholder="Description de l'article"
                        readOnly={isRestaurantItem}
                        className={cn(
                          isRestaurantItem && "bg-white dark:bg-gray-800 cursor-not-allowed text-gray-600 dark:text-gray-300"
                        )}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Qté</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        readOnly={isRestaurantItem}
                        className={cn(
                          isRestaurantItem && "bg-white dark:bg-gray-800 cursor-not-allowed text-gray-600 dark:text-gray-300"
                        )}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Prix unitaire</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                        readOnly={isRestaurantItem}
                        className={cn(
                          isRestaurantItem && "bg-white dark:bg-gray-800 cursor-not-allowed text-gray-600 dark:text-gray-300"
                        )}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">TVA %</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={item.taxRate}
                        onChange={(e) => handleItemChange(index, "taxRate", e.target.value)}
                        readOnly={isRestaurantItem}
                        className={cn(
                          isRestaurantItem && "bg-white dark:bg-gray-800 cursor-not-allowed text-gray-600 dark:text-gray-300"
                        )}
                      />
                    </div>
                    <div className="col-span-1">
                      {formData.items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => removeItem(index)}
                          title={isRestaurantItem ? "Retirer cette commande" : "Supprimer l'article"}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  )
                })}
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
                    <span>Taxe de séjour ({formData.touristTaxNights} nuits × {formData.touristTaxPerNight}{symbol})</span>
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
                    <Label className="text-xs">Tarif/nuit/personne ({symbol})</Label>
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
