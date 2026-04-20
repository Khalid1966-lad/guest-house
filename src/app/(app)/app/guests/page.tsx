"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useCurrency } from "@/hooks/use-currency"
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
  Users,
  Plus,
  Search,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import * as XLSX from "xlsx"

// Types
interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  nationality: string | null
  isVip: boolean
  vipLevel: string | null
  totalStays: number
  totalSpent: number
  notes: string | null
  createdAt: string
  _count?: {
    bookings: number
  }
}

// VIP Levels
const vipLevels = [
  { value: "bronze", label: "Bronze", color: "text-amber-600 bg-amber-100" },
  { value: "silver", label: "Argent", color: "text-gray-600 bg-gray-100" },
  { value: "gold", label: "Or", color: "text-yellow-600 bg-yellow-100" },
  { value: "platinum", label: "Platine", color: "text-purple-600 bg-purple-100" },
]

const defaultFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  country: "France",
  nationality: "",
  notes: "",
  isVip: false,
  vipLevel: "",
}

// Booking type for export
interface BookingForExport {
  id: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  status: string
  totalPrice: number
  touristTaxApplied: boolean
  touristTaxPerNight: number
  touristTaxNights: number
  touristTaxAmount: number
  guest: { firstName: string; lastName: string; email?: string | null; phone?: string | null; nationality?: string | null }
  room: { number: string; name?: string | null }
  occupants: { firstName: string; lastName: string; isAdult: boolean; dateOfBirth?: string | null }[]
}

export default function GuestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { formatAmount } = useCurrency()
  const [guests, setGuests] = useState<Guest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [vipFilter, setVipFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [formData, setFormData] = useState(defaultFormData)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")

  // Export state
  const [exportDateFrom, setExportDateFrom] = useState("")
  const [exportDateTo, setExportDateTo] = useState("")
  const [exportBookings, setExportBookings] = useState<BookingForExport[]>([])
  const [isExportLoading, setIsExportLoading] = useState(false)
  const [showExportSection, setShowExportSection] = useState(false)

  // Fetch guests
  const fetchGuests = async () => {
    if (!session?.user?.guestHouseId) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const response = await fetch(`/api/guests?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setGuests(data.guests || [])
      } else {
        setError("Erreur lors du chargement des clients")
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

    fetchGuests()
  }, [session, status, router, search])

  // Filter guests by VIP status
  const filteredGuests = guests.filter((guest) => {
    if (vipFilter === "all") return true
    if (vipFilter === "vip") return guest.isVip
    if (vipFilter === "regular") return !guest.isVip
    return true
  })

  // Open new guest dialog
  const handleNewGuest = () => {
    setEditingGuest(null)
    setFormData(defaultFormData)
    setFormError("")
    setIsDialogOpen(true)
  }

  // Open edit guest dialog
  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest)
    setFormData({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email || "",
      phone: guest.phone || "",
      address: guest.address || "",
      city: guest.city || "",
      postalCode: "",
      country: guest.country || "France",
      nationality: guest.nationality || "",
      notes: guest.notes || "",
      isVip: guest.isVip,
      vipLevel: guest.vipLevel || "",
    })
    setFormError("")
    setIsDialogOpen(true)
  }

  // Handle form change
  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Save guest
  const handleSaveGuest = async () => {
    setFormError("")

    if (!formData.firstName || !formData.lastName) {
      setFormError("Le prénom et le nom sont requis")
      return
    }

    setIsSaving(true)

    try {
      const url = editingGuest ? `/api/guests/${editingGuest.id}` : "/api/guests"
      const method = editingGuest ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setFormError(errorData.error || "Erreur lors de la sauvegarde")
        setIsSaving(false)
        return
      }

      setIsDialogOpen(false)
      setIsSaving(false)
      fetchGuests()
    } catch (err) {
      setFormError("Une erreur inattendue s'est produite")
      setIsSaving(false)
    }
  }

  // Delete guest
  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) return

    try {
      const response = await fetch(`/api/guests/${guestId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchGuests()
      }
    } catch (err) {
      console.error("Erreur suppression:", err)
    }
  }

  // ─── Export: Fetch bookings by date range ──────────────────────────────────
  const fetchExportData = async () => {
    if (!exportDateFrom || !exportDateTo) return
    setIsExportLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("startDate", exportDateFrom)
      params.append("endDate", exportDateTo)
      params.append("status", "all")

      const response = await fetch(`/api/bookings?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setExportBookings(data.bookings || [])
      } else {
        setExportBookings([])
      }
    } catch (err) {
      console.error("Erreur chargement données export:", err)
      setExportBookings([])
    } finally {
      setIsExportLoading(false)
    }
  }

  useEffect(() => {
    if (exportDateFrom && exportDateTo) {
      fetchExportData()
    } else {
      setExportBookings([])
    }
  }, [exportDateFrom, exportDateTo])

  const exportTotalNights = exportBookings.reduce((sum, b) => {
    const ci = new Date(b.checkIn)
    const co = new Date(b.checkOut)
    return sum + Math.max(1, Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)))
  }, 0)
  const exportTotalTaxe = exportBookings.reduce((sum, b) => sum + (b.touristTaxAmount || 0), 0)

  // ─── Export: Excel ────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (exportBookings.length === 0) return
    const rows = exportBookings.map((b, i) => {
      const ci = new Date(b.checkIn)
      const co = new Date(b.checkOut)
      const nights = Math.max(1, Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)))
      return {
        "#": i + 1,
        "Nom": b.guest.lastName,
        "Prénom": b.guest.firstName,
        "Nationalité": b.guest.nationality || "",
        "Chambre": b.room.number,
        "Arrivée": format(ci, "dd/MM/yyyy", { locale: fr }),
        "Départ": format(co, "dd/MM/yyyy", { locale: fr }),
        "Nuitées": nights,
        "Adultes": b.adults,
        "Enfants": b.children,
        "Total séjour": b.totalPrice,
        "Taxe de séjour": b.touristTaxApplied ? b.touristTaxAmount : 0,
      }
    })

    rows.push({
      "#": "",
      "Nom": "",
      "Prénom": "",
      "Nationalité": "",
      "Chambre": "TOTAL",
      "Arrivée": "",
      "Départ": "",
      "Nuitées": exportTotalNights,
      "Adultes": "",
      "Enfants": "",
      "Total séjour": exportBookings.reduce((s, b) => s + b.totalPrice, 0),
      "Taxe de séjour": exportTotalTaxe,
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    ws["!cols"] = [
      { wch: 4 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 14 }, { wch: 16 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Liste clients")
    const dateLabel = `_${exportDateFrom}_${exportDateTo}`
    XLSX.writeFile(wb, `liste_clients${dateLabel}.xlsx`)
  }

  // ─── Export: Print / PDF (via browser print dialog) ────────────────────────
  const handleExportPrint = () => {
    if (exportBookings.length === 0) return
    const dateRangeLabel = `Du ${format(parseISO(exportDateFrom), "dd/MM/yyyy", { locale: fr })} au ${format(parseISO(exportDateTo), "dd/MM/yyyy", { locale: fr })}`

    const rows = exportBookings.map((b, i) => {
      const ci = new Date(b.checkIn)
      const co = new Date(b.checkOut)
      const nights = Math.max(1, Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)))
      const occupantList = b.occupants && b.occupants.length > 0
        ? b.occupants.map(o => `${o.firstName} ${o.lastName}${o.isAdult ? "" : " (enf.)"}`).join(", ")
        : ""
      return `<tr>
        <td class="text-center">${i + 1}</td>
        <td>${b.guest.lastName}</td>
        <td>${b.guest.firstName}</td>
        <td>${b.guest.nationality || ""}</td>
        <td class="text-center"><strong>${b.room.number}</strong></td>
        <td class="text-center">${format(ci, "dd/MM/yyyy", { locale: fr })}</td>
        <td class="text-center">${format(co, "dd/MM/yyyy", { locale: fr })}</td>
        <td class="text-center">${nights}</td>
        <td class="text-center">${b.adults}</td>
        <td class="text-center">${b.children}</td>
        <td class="text-right">${b.totalPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
        <td class="text-right">${b.touristTaxApplied ? b.touristTaxAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) : "—"}</td>
      </tr>`
    }).join("")

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Liste des clients — ${dateRangeLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 9pt; color: #000; padding: 1cm; }
    @page { size: A4 landscape; margin: 0; }
    @media print { body { padding: 1cm; } }
    h1 { font-size: 14pt; margin-bottom: 0.15rem; }
    .subtitle { color: #555; font-size: 9pt; margin-bottom: 0.8rem; }
    .stats { display: flex; gap: 1.5rem; margin-bottom: 0.8rem; font-size: 9pt; }
    .stats span { background: #f0f9ff; padding: 4px 10px; border-radius: 4px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    th, td { border: 1px solid #ccc; padding: 5px 6px; text-align: left; font-size: 8pt; }
    th { background: #f5f5f5; font-weight: 600; text-transform: uppercase; font-size: 7.5pt; color: #555; }
    .totals-row { font-weight: 700; background: #f0f9ff; }
    .footer { margin-top: 0.5rem; font-size: 7pt; color: #999; text-align: center; }
    .taxe-col { color: #b45309; }
  </style>
</head>
<body>
  <h1>Liste des clients</h1>
  <p class="subtitle">${session?.user?.guestHouseName || "Établissement"} — ${dateRangeLabel} — ${exportBookings.length} réservation${exportBookings.length > 1 ? "s" : ""} — Imprimé le ${format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
  <div class="stats">
    <span>Total nuits : ${exportTotalNights}</span>
    <span>Total taxe de séjour : ${exportTotalTaxe.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
    <span>CA séjours : ${exportBookings.reduce((s, b) => s + b.totalPrice, 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th class="text-center">#</th>
        <th>Nom</th>
        <th>Prénom</th>
        <th>Nationalité</th>
        <th class="text-center">Chambre</th>
        <th class="text-center">Arrivée</th>
        <th class="text-center">Départ</th>
        <th class="text-center">Nuitées</th>
        <th class="text-center">Adultes</th>
        <th class="text-center">Enfants</th>
        <th class="text-right">Total séjour</th>
        <th class="text-right taxe-col">Taxe de séjour</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="totals-row">
        <td colspan="7"></td>
        <td class="text-center">${exportTotalNights}</td>
        <td colspan="2"></td>
        <td class="text-right">${exportBookings.reduce((s, b) => s + b.totalPrice, 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
        <td class="text-right taxe-col">${exportTotalTaxe.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
      </tr>
    </tbody>
  </table>
  <p class="footer">Généré par PMS Guest House v2.8.1</p>
</body>
</html>`

    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 250)
  }

  // Get VIP badge
  const getVipBadge = (guest: Guest) => {
    if (!guest.isVip || !guest.vipLevel) return null
    const level = vipLevels.find((l) => l.value === guest.vipLevel)
    if (!level) return null
    return (
      <Badge className={cn("border-0", level.color)}>
        <Star className="w-3 h-3 mr-1" />
        {level.label}
      </Badge>
    )
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
          Vous devez créer votre maison d'hôtes avant de gérer les clients.
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
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez les clients de votre établissement
          </p>
        </div>
        <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleNewGuest}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchGuests}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={vipFilter} onValueChange={setVipFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Statut VIP" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="regular">Réguliers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{guests.length}</p>
                <p className="text-sm text-gray-500">Total clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{guests.filter((g) => g.isVip).length}</p>
                <p className="text-sm text-gray-500">Clients VIP</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {guests.reduce((acc, g) => acc + (g._count?.bookings || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Réservations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Section */}
      <Card>
        <CardHeader className="cursor-pointer select-none" onClick={() => setShowExportSection(!showExportSection)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-amber-600" />
                Export liste des clients
              </CardTitle>
              <CardDescription>
                Exporter par intervalle de dates : noms, arrivée, départ, chambre, taxe de séjour
              </CardDescription>
            </div>
            {showExportSection ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </CardHeader>
        {showExportSection && (
          <CardContent className="space-y-4">
            {/* Date range + export buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="exportDateFrom">Du</Label>
                <Input
                  id="exportDateFrom"
                  type="date"
                  value={exportDateFrom}
                  onChange={(e) => setExportDateFrom(e.target.value)}
                  className="w-full sm:w-40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exportDateTo">Au</Label>
                <Input
                  id="exportDateTo"
                  type="date"
                  value={exportDateTo}
                  onChange={(e) => setExportDateTo(e.target.value)}
                  className="w-full sm:w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  disabled={exportBookings.length === 0}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPrint}
                  disabled={exportBookings.length === 0}
                  className="border-sky-300 text-sky-700 hover:bg-sky-50"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  PDF / Imprimer
                </Button>
              </div>
            </div>

            {/* Results summary */}
            {exportDateFrom && exportDateTo && (
              <div className="flex flex-wrap gap-4 items-center">
                {isExportLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-gray-500">
                        <strong className="text-gray-900">{exportBookings.length}</strong> réservation{exportBookings.length > 1 ? "s" : ""}
                      </span>
                      <span className="text-gray-500">
                        <strong className="text-gray-900">{exportTotalNights}</strong> nuitées
                      </span>
                      <span className="text-amber-700 font-medium">
                        Taxe séjour : <strong>{formatAmount(exportTotalTaxe)}</strong>
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Preview table */}
            {exportBookings.length > 0 && !isExportLoading && (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900">
                      <th className="text-left px-3 py-2 font-medium text-gray-500">#</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Nom</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Prénom</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-500">Chambre</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-500">Arrivée</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-500">Départ</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-500">Nuitées</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-500">Occ.</th>
                      <th className="text-right px-3 py-2 font-medium text-amber-700">Taxe séjour</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {exportBookings.map((b, i) => {
                      const ci = new Date(b.checkIn)
                      const co = new Date(b.checkOut)
                      const nights = Math.max(1, Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)))
                      return (
                        <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                          <td className="px-3 py-2 font-medium">{b.guest.lastName}</td>
                          <td className="px-3 py-2">{b.guest.firstName}</td>
                          <td className="px-3 py-2 text-center"><Badge variant="outline">{b.room.number}</Badge></td>
                          <td className="px-3 py-2 text-center text-gray-600">{format(ci, "dd/MM", { locale: fr })}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{format(co, "dd/MM/yyyy", { locale: fr })}</td>
                          <td className="px-3 py-2 text-center">{nights}</td>
                          <td className="px-3 py-2 text-center text-xs text-gray-500">{b.adults}{b.children > 0 ? `+${b.children}` : ""}</td>
                          <td className={cn("px-3 py-2 text-right font-medium", b.touristTaxApplied ? "text-amber-700" : "text-gray-300")}>
                            {b.touristTaxApplied ? formatAmount(b.touristTaxAmount) : "—"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-sky-50 dark:bg-sky-950/30 font-semibold">
                      <td colSpan={6} className="px-3 py-2"></td>
                      <td className="px-3 py-2 text-center">{exportTotalNights}</td>
                      <td className="px-3 py-2 text-center text-xs text-gray-500"></td>
                      <td className="px-3 py-2 text-right text-amber-700">{formatAmount(exportTotalTaxe)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Guests List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
          <CardDescription>
            {filteredGuests.length} client{filteredGuests.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredGuests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">Aucun client</h3>
              <p className="text-gray-500 mb-4">
                {search ? "Aucun client ne correspond à votre recherche" : "Commencez par ajouter votre premier client"}
              </p>
              {!search && (
                <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleNewGuest}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau client
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredGuests.map((guest) => (
                <div
                  key={guest.id}
                  className="flex flex-col gap-2 py-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div 
                    className="flex items-center gap-4 flex-1 cursor-pointer"
                    onClick={() => router.push(`/app/guests/${guest.id}`)}
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center shrink-0">
                      <span className="text-lg font-semibold text-sky-600">
                        {guest.firstName.charAt(0)}{guest.lastName.charAt(0)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {guest.firstName} {guest.lastName}
                        </p>
                        {getVipBadge(guest)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        {guest.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {guest.email}
                          </span>
                        )}
                        {guest.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {guest.phone}
                          </span>
                        )}
                        {guest.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {guest.city}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats — desktop */}
                    <div className="hidden sm:flex items-center gap-6 mr-4">
                      <div className="text-center">
                        <p className="font-semibold">{guest._count?.bookings || 0}</p>
                        <p className="text-xs text-gray-500">Séjours</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sky-600">
                          {guest.totalSpent > 0 ? formatAmount(guest.totalSpent) : "-"}
                        </p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                    </div>

                    {/* Actions — desktop */}
                    <div className="hidden sm:flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/app/guests/${guest.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditGuest(guest)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => handleDeleteGuest(guest.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile: stats + actions below */}
                  <div className="flex sm:hidden items-center justify-between pl-16">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="font-semibold text-sm">{guest._count?.bookings || 0}</p>
                        <p className="text-[11px] text-gray-500">Séjours</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sm text-sky-600">
                          {guest.totalSpent > 0 ? formatAmount(guest.totalSpent) : "-"}
                        </p>
                        <p className="text-[11px] text-gray-500">Total</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/app/guests/${guest.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditGuest(guest)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => handleDeleteGuest(guest.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGuest ? "Modifier le client" : "Nouveau client"}
            </DialogTitle>
            <DialogDescription>
              {editingGuest
                ? "Modifiez les informations du client"
                : "Ajoutez un nouveau client à votre base de données"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {formError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {formError}
              </div>
            )}

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-4">
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

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleFormChange("address", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleFormChange("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => handleFormChange("postalCode", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleFormChange("country", e.target.value)}
                />
              </div>
            </div>

            {/* Nationality */}
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationalité</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => handleFormChange("nationality", e.target.value)}
                placeholder="Française"
              />
            </div>

            {/* VIP Status */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <Label>Client VIP</Label>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isVip}
                  onChange={(e) => handleFormChange("isVip", e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </div>
              {formData.isVip && (
                <Select 
                  value={formData.vipLevel} 
                  onValueChange={(v) => handleFormChange("vipLevel", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {vipLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleFormChange("notes", e.target.value)}
                placeholder="Informations importantes, préférences..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-sky-600 hover:bg-sky-700"
              onClick={handleSaveGuest}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                editingGuest ? "Modifier" : "Créer"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
