"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CreditCard,
  Loader2,
  Pencil,
  CheckCircle,
  AlertTriangle,
  CalendarPlus,
  Filter,
  RefreshCw,
  Building2,
  Clock,
  CreditCardIcon,
} from "lucide-react"
import { toast } from "sonner"
import { STATUS_COLORS, STATUS_LABELS, PLAN_LABELS } from "@/lib/subscription"
import type { SubscriptionStatus, PlanType } from "@/lib/subscription"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ComputedInfo {
  effectiveStatus: SubscriptionStatus
  daysUntilExpiry: number | null
  label: string
  color: "green" | "yellow" | "orange" | "red" | "gray"
  isFullyAccessible: boolean
}

interface SubscriptionItem {
  id: string
  guestHouseId: string
  plan: string
  status: string
  startedAt: string
  expiresAt: string | null
  lastPaymentAt: string | null
  lastPaymentRef: string | null
  trialEndsAt: string | null
  gracePeriodDays: number
  guestHouseName: string
  guestHouseCode: string | null
  guestHouseEmail: string | null
  ownerEmail: string | null
  ownerName: string | null
  guestHouseCreatedAt: string
  computed: ComputedInfo
  notes?: string | null
}

interface Stats {
  total: number
  active: number
  trial: number
  expired: number
  grace_period: number
  cancelled: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COMPUTED_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  green: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  yellow: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400" },
  orange: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
  red: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  gray: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-400" },
}

const PLAN_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  free: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
  premium: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400" },
}

const STAT_CARDS: { key: keyof Stats; label: string; colorClass: string; iconBg: string }[] = [
  { key: "total", label: "Total", colorClass: "text-gray-900 dark:text-white", iconBg: "bg-sky-100 dark:bg-sky-900/30 text-sky-600" },
  { key: "active", label: "Actifs", colorClass: "text-green-600", iconBg: "bg-green-100 dark:bg-green-900/30 text-green-600" },
  { key: "trial", label: "Essai", colorClass: "text-emerald-600", iconBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" },
  { key: "expired", label: "Expirés", colorClass: "text-red-600", iconBg: "bg-red-100 dark:bg-red-900/30 text-red-600" },
  { key: "grace_period", label: "Période de grâce", colorClass: "text-amber-600", iconBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-600" },
  { key: "cancelled", label: "Annulés", colorClass: "text-gray-500", iconBg: "bg-gray-100 dark:bg-gray-800 text-gray-500" },
]

const FILTER_TABS: { value: string; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "active", label: "Actifs" },
  { value: "trial", label: "Essai" },
  { value: "expired", label: "Expirés" },
  { value: "grace_period", label: "Période de grâce" },
  { value: "cancelled", label: "Annulés" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function toISODateValue(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function addDays(dateStr: string | null, days: number): string {
  const base = dateStr ? new Date(dateStr) : new Date()
  const result = new Date(base)
  result.setDate(result.getDate() + days)
  return toISODateValue(result.toISOString())
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminSubscriptionsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  // Data state
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("all")

  // Edit dialog state
  const [editingSub, setEditingSub] = useState<SubscriptionItem | null>(null)
  const [editForm, setEditForm] = useState({
    plan: "",
    status: "",
    expiresAt: "",
    lastPaymentAt: "",
    lastPaymentRef: "",
    trialEndsAt: "",
    notes: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  // ─── Auth guard ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (sessionStatus === "loading") return
    if (!session || session.user.role !== "super_admin") {
      router.push("/login")
    }
  }, [session, sessionStatus, router])

  // ─── Fetch data ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeFilter !== "all") params.append("filter", activeFilter)
      const url = `/api/admin/subscriptions${params.toString() ? `?${params.toString()}` : ""}`
      const res = await fetch(url)
      const data = await res.json()

      if (res.ok) {
        setSubscriptions(data.subscriptions || [])
        setStats(data.stats || null)
      } else {
        toast.error("Erreur", { description: data.error || "Impossible de charger les abonnements" })
      }
    } catch (err) {
      console.error("Erreur chargement abonnements:", err)
      toast.error("Erreur réseau", { description: "Impossible de joindre le serveur" })
    } finally {
      setIsLoading(false)
    }
  }, [activeFilter])

  useEffect(() => {
    if (session?.user?.role === "super_admin") {
      fetchData()
    }
  }, [session, fetchData])

  // ─── Edit dialog ─────────────────────────────────────────────────────────

  const openEditDialog = (sub: SubscriptionItem) => {
    setEditingSub(sub)
    setEditForm({
      plan: sub.plan,
      status: sub.status,
      expiresAt: toISODateValue(sub.expiresAt),
      lastPaymentAt: toISODateValue(sub.lastPaymentAt),
      lastPaymentRef: sub.lastPaymentRef || "",
      trialEndsAt: toISODateValue(sub.trialEndsAt),
      notes: (sub as Record<string, unknown>).notes as string || "",
    })
  }

  const closeEditDialog = () => {
    setEditingSub(null)
    setIsSaving(false)
  }

  const handleExtend = (days: number) => {
    const currentExpiresAt = editForm.expiresAt
    const newDate = addDays(currentExpiresAt || new Date().toISOString(), days)
    setEditForm((prev) => ({ ...prev, expiresAt: newDate }))
  }

  const handleSave = async () => {
    if (!editingSub) return
    setIsSaving(true)
    try {
      const body: Record<string, unknown> = {
        plan: editForm.plan,
        status: editForm.status,
        expiresAt: editForm.expiresAt || null,
        lastPaymentAt: editForm.lastPaymentAt || null,
        lastPaymentRef: editForm.lastPaymentRef || null,
        trialEndsAt: editForm.trialEndsAt || null,
        notes: editForm.notes || null,
      }

      const res = await fetch(`/api/admin/subscriptions/${editingSub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success("Abonnement modifié", {
          description: `L'abonnement de ${editingSub.guestHouseName} a été mis à jour.`,
        })
        closeEditDialog()
        fetchData()
      } else {
        toast.error("Erreur", { description: data.error || "Impossible de modifier l'abonnement" })
      }
    } catch (err) {
      console.error("Erreur sauvegarde abonnement:", err)
      toast.error("Erreur réseau", { description: "Impossible de joindre le serveur" })
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Guard rendering ─────────────────────────────────────────────────────

  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    )
  }

  if (!session || session.user.role !== "super_admin") {
    return null
  }

  // ─── Main render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestion des Abonnements
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérer les abonnements de toutes les maisons d&apos;hôtes
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {STAT_CARDS.map(({ key, label, colorClass, iconBg }) => (
            <Card
              key={key}
              className="bg-white dark:bg-gray-900 border dark:border-gray-800"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${colorClass}`}>
                      {stats[key]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {label}
                    </p>
                  </div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
                    <CreditCardIcon className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <Card className="bg-white dark:bg-gray-900 border dark:border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            {FILTER_TABS.map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                variant={activeFilter === value ? "default" : "outline"}
                className={
                  activeFilter === value
                    ? "bg-sky-600 hover:bg-sky-700 text-white shrink-0"
                    : "shrink-0"
                }
                onClick={() => setActiveFilter(value)}
              >
                {label}
                {stats && value !== "all" && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 text-[10px] px-1.5 py-0 bg-white/20 text-inherit"
                  >
                    {stats[value as keyof Stats]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="bg-white dark:bg-gray-900 border dark:border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-400" />
            Abonnements
            {subscriptions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {subscriptions.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
              <span className="ml-3 text-gray-500 dark:text-gray-400">Chargement des abonnements...</span>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Aucun abonnement trouvé</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Aucun abonnement ne correspond à ce filtre.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b dark:border-gray-800">
                    <TableHead className="min-w-[180px]">GuestHouse</TableHead>
                    <TableHead className="min-w-[160px]">Propriétaire</TableHead>
                    <TableHead className="min-w-[100px]">Plan</TableHead>
                    <TableHead className="min-w-[130px]">Statut</TableHead>
                    <TableHead className="min-w-[100px]">Inscription</TableHead>
                    <TableHead className="min-w-[110px]">Dernier paiement</TableHead>
                    <TableHead className="min-w-[110px]">Expiration</TableHead>
                    <TableHead className="w-[90px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => {
                    const statusColor = STATUS_COLORS[sub.status] || STATUS_COLORS.cancelled
                    const planColor = PLAN_COLOR_MAP[sub.plan] || PLAN_COLOR_MAP.free
                    const computedColor = COMPUTED_COLOR_MAP[sub.computed.color] || COMPUTED_COLOR_MAP.gray

                    return (
                      <TableRow
                        key={sub.id}
                        className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        {/* GuestHouse */}
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                              {sub.guestHouseName}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {sub.guestHouseCode || sub.guestHouseId.slice(0, 8)}
                            </p>
                          </div>
                        </TableCell>

                        {/* Propriétaire */}
                        <TableCell>
                          <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[180px]">
                              {sub.ownerName || "—"}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[180px]">
                              {sub.ownerEmail || sub.guestHouseEmail || "—"}
                            </p>
                          </div>
                        </TableCell>

                        {/* Plan */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${planColor.bg} ${planColor.text} border-0`}
                          >
                            {PLAN_LABELS[sub.plan] || sub.plan}
                          </Badge>
                        </TableCell>

                        {/* Statut (computed label) */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${computedColor.bg} ${computedColor.text} border-0`}
                          >
                            {sub.computed.label}
                          </Badge>
                        </TableCell>

                        {/* Inscription */}
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(sub.guestHouseCreatedAt)}
                          </span>
                        </TableCell>

                        {/* Dernier paiement */}
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(sub.lastPaymentAt)}
                          </span>
                        </TableCell>

                        {/* Expiration */}
                        <TableCell>
                          <span className={`text-sm ${sub.computed.daysUntilExpiry !== null && sub.computed.daysUntilExpiry <= 7 ? "text-red-600 dark:text-red-400 font-medium" : "text-gray-600 dark:text-gray-400"}`}>
                            {formatDate(sub.expiresAt)}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-sky-600 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-900/20 dark:hover:text-sky-400"
                            onClick={() => openEditDialog(sub)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingSub} onOpenChange={(open) => { if (!open) closeEditDialog() }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-sky-600" />
              Modifier l&apos;abonnement
            </DialogTitle>
            <DialogDescription>
              {editingSub && (
                <>
                  Modifier l&apos;abonnement de{" "}
                  <strong className="text-gray-900 dark:text-white">{editingSub.guestHouseName}</strong>
                  {editingSub.guestHouseCode && (
                    <span className="text-gray-400"> ({editingSub.guestHouseCode})</span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Current computed status display */}
            {editingSub && (
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Statut calculé actuel</p>
                <Badge
                  variant="outline"
                  className={`${
                    COMPUTED_COLOR_MAP[editingSub.computed.color]?.bg || ""
                  } ${
                    COMPUTED_COLOR_MAP[editingSub.computed.color]?.text || ""
                  } border-0`}
                >
                  {editingSub.computed.label}
                </Badge>
              </div>
            )}

            {/* Plan selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Plan</Label>
              <Select
                value={editForm.plan}
                onValueChange={(val) => setEditForm((prev) => ({ ...prev, plan: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className={`${PLAN_COLOR_MAP.free.bg} ${PLAN_COLOR_MAP.free.text} border-0`}>
                        Gratuit
                      </Badge>
                    </span>
                  </SelectItem>
                  <SelectItem value="premium">
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className={`${PLAN_COLOR_MAP.premium.bg} ${PLAN_COLOR_MAP.premium.text} border-0`}>
                        Premium
                      </Badge>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Statut</Label>
              <Select
                value={editForm.status}
                onValueChange={(val) => setEditForm((prev) => ({ ...prev, status: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${STATUS_COLORS[key]?.bg} ${STATUS_COLORS[key]?.text} border-0`}
                        >
                          {label}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Expiration date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date d&apos;expiration</Label>
              <Input
                type="date"
                value={editForm.expiresAt}
                onChange={(e) => setEditForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>

            {/* Quick extend buttons */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <CalendarPlus className="w-4 h-4 text-gray-400" />
                Prolonger
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleExtend(30)}
                >
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  +30 jours
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleExtend(90)}
                >
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  +90 jours
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleExtend(365)}
                >
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  +1 an
                </Button>
              </div>
            </div>

            {/* Last payment date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date dernier paiement</Label>
              <Input
                type="date"
                value={editForm.lastPaymentAt}
                onChange={(e) => setEditForm((prev) => ({ ...prev, lastPaymentAt: e.target.value }))}
              />
            </div>

            {/* Payment reference */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Référence paiement</Label>
              <Input
                type="text"
                placeholder="Ex: INV-2025-00123"
                value={editForm.lastPaymentRef}
                onChange={(e) => setEditForm((prev) => ({ ...prev, lastPaymentRef: e.target.value }))}
              />
            </div>

            {/* Trial end date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fin d&apos;essai</Label>
              <Input
                type="date"
                value={editForm.trialEndsAt}
                onChange={(e) => setEditForm((prev) => ({ ...prev, trialEndsAt: e.target.value }))}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                placeholder="Notes internes sur cet abonnement..."
                value={editForm.notes}
                onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Dialog actions */}
            <div className="flex justify-end gap-3 pt-2 border-t dark:border-gray-700">
              <Button variant="outline" onClick={closeEditDialog} disabled={isSaving}>
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
