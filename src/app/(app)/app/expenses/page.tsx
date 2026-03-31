"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Filter,
  Download,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Expense categories
const EXPENSE_CATEGORIES = [
  { value: "supplies", label: "Fournitures" },
  { value: "maintenance", label: "Maintenance" },
  { value: "utilities", label: "Services publics" },
  { value: "salary", label: "Salaires" },
  { value: "marketing", label: "Marketing" },
  { value: "food", label: "Nourriture & Boissons" },
  { value: "cleaning", label: "Nettoyage" },
  { value: "equipment", label: "Équipement" },
  { value: "insurance", label: "Assurance" },
  { value: "taxes", label: "Taxes" },
  { value: "other", label: "Autre" },
]

const STATUS_OPTIONS = [
  { value: "pending", label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  { value: "paid", label: "Payée", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Annulée", color: "bg-red-100 text-red-800" },
]

const RECURRENCE_OPTIONS = [
  { value: "daily", label: "Quotidien" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuel" },
  { value: "yearly", label: "Annuel" },
]

interface Expense {
  id: string
  category: string
  subcategory: string | null
  description: string
  amount: number
  currency: string
  vendor: string | null
  invoiceNumber: string | null
  receiptImage: string | null
  expenseDate: string
  paidDate: string | null
  status: string
  isRecurring: boolean
  recurrence: string | null
  notes: string | null
  createdAt: string
}

interface Stats {
  total: number
  totalAmount: number
  paid: number
  paidAmount: number
  pending: number
  pendingAmount: number
  byCategory: Record<string, number>
}

export default function ExpensesPage() {
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    category: "supplies",
    subcategory: "",
    description: "",
    amount: "",
    vendor: "",
    invoiceNumber: "",
    expenseDate: format(new Date(), "yyyy-MM-dd"),
    status: "pending",
    isRecurring: false,
    recurrence: "",
    notes: "",
  })

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (dateRange.start) params.append("startDate", dateRange.start)
      if (dateRange.end) params.append("endDate", dateRange.end)

      const response = await fetch(`/api/expenses?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setExpenses(data.expenses)
        setStats(data.stats)
      } else {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les dépenses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, statusFilter, dateRange, toast])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const resetForm = () => {
    setFormData({
      category: "supplies",
      subcategory: "",
      description: "",
      amount: "",
      vendor: "",
      invoiceNumber: "",
      expenseDate: format(new Date(), "yyyy-MM-dd"),
      status: "pending",
      isRecurring: false,
      recurrence: "",
      notes: "",
    })
  }

  const handleAddExpense = async () => {
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Dépense créée avec succès",
        })
        setShowAddDialog(false)
        resetForm()
        fetchExpenses()
      } else {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la dépense",
        variant: "destructive",
      })
    }
  }

  const handleEditExpense = async () => {
    if (!selectedExpense) return

    try {
      const response = await fetch(`/api/expenses/${selectedExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Dépense mise à jour avec succès",
        })
        setShowEditDialog(false)
        setSelectedExpense(null)
        resetForm()
        fetchExpenses()
      } else {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la dépense",
        variant: "destructive",
      })
    }
  }

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return

    try {
      const response = await fetch(`/api/expenses/${selectedExpense.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Dépense supprimée avec succès",
        })
        setShowDeleteDialog(false)
        setSelectedExpense(null)
        fetchExpenses()
      } else {
        const data = await response.json()
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la dépense",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (expense: Expense, newStatus: string) => {
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: `Dépense marquée comme ${newStatus === "paid" ? "payée" : "annulée"}`,
        })
        fetchExpenses()
      } else {
        const data = await response.json()
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense)
    setFormData({
      category: expense.category,
      subcategory: expense.subcategory || "",
      description: expense.description,
      amount: expense.amount.toString(),
      vendor: expense.vendor || "",
      invoiceNumber: expense.invoiceNumber || "",
      expenseDate: format(new Date(expense.expenseDate), "yyyy-MM-dd"),
      status: expense.status,
      isRecurring: expense.isRecurring,
      recurrence: expense.recurrence || "",
      notes: expense.notes || "",
    })
    setShowEditDialog(true)
  }

  const getCategoryLabel = (value: string) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label || value
  }

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status)
    return (
      <Badge variant="secondary" className={option?.color || ""}>
        {option?.label || status}
      </Badge>
    )
  }

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dépenses
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez les dépenses de votre maison d&apos;hôtes
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowAddDialog(true)
          }}
          className="bg-sky-600 hover:bg-sky-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle dépense
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dépenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.total || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.paidAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.paid || 0} dépenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats?.pendingAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.pending || 0} dépenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Récurrentes</CardTitle>
            <RefreshCw className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {expenses.filter((e) => e.isRecurring).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Dépenses automatiques
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      {stats?.byCategory && Object.keys(stats.byCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byCategory).map(([category, amount]) => (
                <div
                  key={category}
                  className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full"
                >
                  <span className="text-sm font-medium">
                    {getCategoryLabel(category)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par description, fournisseur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="w-full lg:w-40"
                placeholder="Du"
              />
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="w-full lg:w-40"
                placeholder="Au"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Receipt className="h-12 w-12 mb-4 text-gray-300" />
              <p>Aucune dépense trouvée</p>
              <Button
                variant="link"
                onClick={() => setShowAddDialog(true)}
                className="mt-2"
              >
                Ajouter une dépense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Récurrente</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {format(new Date(expense.expenseDate), "dd MMM yyyy", {
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          {expense.invoiceNumber && (
                            <p className="text-xs text-gray-500">
                              Facture: {expense.invoiceNumber}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryLabel(expense.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>{expense.vendor || "-"}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(expense.amount, expense.currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell>
                        {expense.isRecurring ? (
                          <div className="flex items-center gap-1 text-purple-600">
                            <RefreshCw className="h-3 w-3" />
                            <span className="text-xs capitalize">
                              {expense.recurrence}
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openEditDialog(expense)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            {expense.status === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(expense, "paid")
                                  }
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Marquer comme payée
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(expense, "cancelled")
                                  }
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Annuler
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedExpense(expense)
                                setShowDeleteDialog(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle dépense</DialogTitle>
            <DialogDescription>
              Enregistrez une nouvelle dépense
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcategory">Sous-catégorie</Label>
                <Input
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      subcategory: e.target.value,
                    }))
                  }
                  placeholder="Optionnel"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Description de la dépense"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (€) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseDate">Date</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expenseDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Fournisseur</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, vendor: e.target.value }))
                  }
                  placeholder="Nom du fournisseur"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">N° Facture</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      invoiceNumber: e.target.value,
                    }))
                  }
                  placeholder="Optionnel"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isRecurring: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isRecurring">Dépense récurrente</Label>
            </div>
            {formData.isRecurring && (
              <div className="space-y-2">
                <Label htmlFor="recurrence">Fréquence</Label>
                <Select
                  value={formData.recurrence}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, recurrence: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Notes additionnelles..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddExpense}
              className="bg-sky-600 hover:bg-sky-700"
              disabled={!formData.description || !formData.amount}
            >
              Créer la dépense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier la dépense</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la dépense
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Catégorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subcategory">Sous-catégorie</Label>
                <Input
                  id="edit-subcategory"
                  value={formData.subcategory}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      subcategory: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Montant (€) *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expenseDate">Date</Label>
                <Input
                  id="edit-expenseDate"
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expenseDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-vendor">Fournisseur</Label>
                <Input
                  id="edit-vendor"
                  value={formData.vendor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, vendor: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-invoiceNumber">N° Facture</Label>
                <Input
                  id="edit-invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      invoiceNumber: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isRecurring"
                checked={formData.isRecurring}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isRecurring: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-isRecurring">Dépense récurrente</Label>
            </div>
            {formData.isRecurring && (
              <div className="space-y-2">
                <Label htmlFor="edit-recurrence">Fréquence</Label>
                <Select
                  value={formData.recurrence}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, recurrence: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleEditExpense}
              className="bg-sky-600 hover:bg-sky-700"
              disabled={!formData.description || !formData.amount}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la dépense</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action
              est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedExpense && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="font-medium">{selectedExpense.description}</p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(selectedExpense.amount)} -{" "}
                  {getCategoryLabel(selectedExpense.category)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteExpense}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
