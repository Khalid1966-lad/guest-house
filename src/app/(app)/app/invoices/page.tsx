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

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  room: {
    number: string
    name: string | null
  }
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

// Status colors and labels
const invoiceStatuses: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Brouillon", color: "text-gray-700", bg: "bg-gray-100" },
  sent: { label: "Envoyée", color: "text-sky-700", bg: "bg-sky-100" },
  paid: { label: "Payée", color: "text-green-700", bg: "bg-green-100" },
  cancelled: { label: "Annulée", color: "text-red-700", bg: "bg-red-100" },
  refunded: { label: "Remboursée", color: "text-orange-700", bg: "bg-orange-100" },
}

const defaultItemForm = {
  description: "",
  quantity: "1",
  unitPrice: "",
  taxRate: "0",
}

export default function InvoicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
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

  // Form state
  const [formData, setFormData] = useState({
    guestId: "",
    dueDate: "",
    notes: "",
    terms: "",
    items: [{ ...defaultItemForm }],
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
    const total = subtotal + taxes

    return { subtotal, taxes, total }
  }

  // Fetch data
  const fetchData = async () => {
    if (!session?.user?.guestHouseId) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const [invoicesRes, guestsRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/guests"),
      ])

      if (invoicesRes.ok) {
        const data = await invoicesRes.json()
        setInvoices(data.invoices || [])
      }

      if (guestsRes.ok) {
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

  // Open new invoice dialog
  const handleNewInvoice = () => {
    setEditingInvoice(null)
    setFormData({
      guestId: "",
      dueDate: "",
      notes: "",
      terms: "",
      items: [{ ...defaultItemForm }],
    })
    setFormError("")
    setIsDialogOpen(true)
  }

  // Open edit invoice dialog
  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setFormData({
      guestId: invoice.guest.id,
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
    setFormData((prev) => ({ ...prev, [field]: value }))
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

    setIsSaving(true)

    const { subtotal, taxes, total } = calculateTotals()

    try {
      const url = editingInvoice ? `/api/invoices/${editingInvoice.id}` : "/api/invoices"
      const method = editingInvoice ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: formData.guestId,
          dueDate: formData.dueDate || null,
          notes: formData.notes || null,
          terms: formData.terms || null,
          subtotal,
          taxes,
          discount: 0,
          total,
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

  // Update invoice status
  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
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

  const { subtotal, taxes, total } = calculateTotals()

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
            <p className="text-2xl font-bold">{stats.totalAmount.toLocaleString("fr-FR")} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Encaissé</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.paidAmount.toLocaleString("fr-FR")} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <CalendarDays className="w-4 h-4" />
              <span className="text-sm">En attente</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.pendingAmount.toLocaleString("fr-FR")} €</p>
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
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
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
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              )}
            >
              {value.label}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                statusFilter === key ? "bg-white/50" : "bg-gray-100"
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
                        <p className="font-semibold">{invoice.total.toLocaleString("fr-FR")} €</p>
                        <p className="text-xs text-gray-500">{format(parseISO(invoice.invoiceDate), "d MMM yyyy", { locale: fr })}</p>
                      </div>
                      <Badge className={cn(statusInfo.bg, statusInfo.color, "border-0")}>
                        {statusInfo.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
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
                          {invoice.status === "draft" && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.id, "sent")}>
                              <Send className="w-4 h-4 mr-2" />
                              Marquer envoyée
                            </DropdownMenuItem>
                          )}
                          {(invoice.status === "sent" || invoice.status === "draft") && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.id, "paid")}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marquer payée
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
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
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
                  <span>{subtotal.toLocaleString("fr-FR")} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA</span>
                  <span>{taxes.toLocaleString("fr-FR")} €</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="text-sky-600">{total.toLocaleString("fr-FR")} €</span>
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
