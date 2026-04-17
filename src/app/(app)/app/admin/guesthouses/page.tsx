"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Building2,
  Users,
  Lock,
  Unlock,
  Trash2,
  Search,
  Shield,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  BedDouble,
  CalendarDays,
  Receipt,
  CreditCard,
  UtensilsCrossed,
  Wallet,
  Settings,
  ClipboardList,
  AlertTriangle,
  Clock,
  KeyRound,
  CheckCircle,
} from "lucide-react"

// Types
interface GuestHouseOwner {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string
}

interface GuestHouseCounts {
  rooms: number
  guests: number
  bookings: number
  invoices: number
  payments: number
  restaurantOrders: number
  menuItems: number
  expenses: number
  amenities: number
  users: number
  auditLogs: number
  totalRecords: number
  estimatedSizeKo: number
}

interface GuestHouseItem {
  id: string
  name: string
  slug: string
  description: string | null
  city: string | null
  country: string | null
  email: string | null
  phone: string | null
  plan: string
  status: string
  isActive: boolean
  trialEndsAt: string | null
  createdAt: string
  updatedAt: string
  owner: GuestHouseOwner | null
  counts: GuestHouseCounts
}

interface PendingUser {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  isActive: boolean
  createdAt: string
}

interface AdminStats {
  total: number
  active: number
  pending: number
  blocked: number
  suspended: number
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
  active: { label: "Active", color: "bg-green-100 text-green-800 border-green-300", icon: Shield },
  blocked: { label: "Bloquée", color: "bg-red-100 text-red-800 border-red-300", icon: Lock },
  suspended: { label: "Suspendue", color: "bg-orange-100 text-orange-800 border-orange-300", icon: AlertTriangle },
}

const planConfig: Record<string, { label: string; color: string }> = {
  free: { label: "Gratuit", color: "bg-gray-100 text-gray-700" },
  starter: { label: "Starter", color: "bg-blue-100 text-blue-700" },
  pro: { label: "Pro", color: "bg-purple-100 text-purple-700" },
  enterprise: { label: "Enterprise", color: "bg-sky-100 text-sky-700" },
}

const countLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  rooms: { label: "Chambres", icon: BedDouble },
  guests: { label: "Clients", icon: Users },
  bookings: { label: "Réservations", icon: CalendarDays },
  invoices: { label: "Factures", icon: Receipt },
  payments: { label: "Paiements", icon: CreditCard },
  restaurantOrders: { label: "Commandes rest.", icon: UtensilsCrossed },
  menuItems: { label: "Articles menu", icon: UtensilsCrossed },
  expenses: { label: "Dépenses", icon: Wallet },
  amenities: { label: "Équipements", icon: Settings },
  users: { label: "Utilisateurs", icon: Users },
  auditLogs: { label: "Logs audit", icon: ClipboardList },
}

export default function AdminGuestHousesPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [guestHouses, setGuestHouses] = useState<GuestHouseItem[]>([])
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  // Password change state
  const [passwordDialogGhId, setPasswordDialogGhId] = useState<string | null>(null)
  const [passwordDialogUserId, setPasswordDialogUserId] = useState<string | null>(null)
  const [passwordDialogUserName, setPasswordDialogUserName] = useState<string>("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  // Vérifier que l'utilisateur est super_admin
  useEffect(() => {
    if (sessionStatus === "loading") return
    if (!session || session.user.role !== "super_admin") {
      router.push("/login")
      return
    }
  }, [session, sessionStatus, router])

  // Charger les données
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (planFilter !== "all") params.append("plan", planFilter)
      if (search) params.append("search", search)

      const res = await fetch(`/api/admin/guesthouses?${params.toString()}`)
      const data = await res.json()

      if (res.ok) {
        setGuestHouses(data.guestHouses)
        setStats(data.stats)
        setPendingUsers(data.pendingUsers || [])
      }
    } catch (err) {
      console.error("Erreur chargement:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === "super_admin") {
      fetchData()
    }
  }, [session, statusFilter, planFilter, search])

  // Open password dialog
  const handleOpenPasswordDialog = (ghId: string, userId: string, userName: string) => {
    setPasswordDialogGhId(ghId)
    setPasswordDialogUserId(userId)
    setPasswordDialogUserName(userName)
    setNewPassword("")
    setPasswordConfirm("")
    setPasswordError("")
    setPasswordSuccess(false)
  }

  // Close password dialog
  const handleClosePasswordDialog = () => {
    setPasswordDialogGhId(null)
    setPasswordDialogUserId(null)
    setPasswordDialogUserName("")
    setNewPassword("")
    setPasswordConfirm("")
    setPasswordError("")
    setPasswordSuccess(false)
  }

  // Handle password reset
  const handleResetPassword = async () => {
    setPasswordError("")
    setPasswordSuccess(false)

    if (!passwordDialogGhId || !passwordDialogUserId) return
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }
    if (newPassword !== passwordConfirm) {
      setPasswordError("Les mots de passe ne correspondent pas")
      return
    }

    setIsResettingPassword(true)
    try {
      const res = await fetch(`/api/admin/guesthouses/${passwordDialogGhId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resetPassword",
          userId: passwordDialogUserId,
          newPassword,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordSuccess(true)
        setTimeout(() => handleClosePasswordDialog(), 2000)
      } else {
        setPasswordError(data.error || "Erreur lors de la réinitialisation")
      }
    } catch {
      setPasswordError("Erreur réseau. Veuillez réessayer.")
    } finally {
      setIsResettingPassword(false)
    }
  }

  // Action: Changer le statut
  const handleStatusChange = async (id: string, newStatus: string) => {
    setIsUpdating(id)
    try {
      const res = await fetch(`/api/admin/guesthouses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        await fetchData()
      }
    } catch (err) {
      console.error("Erreur changement statut:", err)
    } finally {
      setIsUpdating(null)
    }
  }

  // Action: Supprimer
  const handleDelete = async () => {
    if (!deleteDialog) return
    setIsUpdating(deleteDialog)
    try {
      const res = await fetch(`/api/admin/guesthouses/${deleteDialog}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setDeleteDialog(null)
        await fetchData()
      }
    } catch (err) {
      console.error("Erreur suppression:", err)
    } finally {
      setIsUpdating(null)
    }
  }

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Administration</h1>
            <p className="text-sm text-gray-500">Gestion des maisons d'hôtes</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-500 mt-1">Actives</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-gray-500 mt-1">En attente</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{stats.blocked}</p>
              <p className="text-xs text-gray-500 mt-1">Bloquées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.suspended}</p>
              <p className="text-xs text-gray-500 mt-1">Suspendues</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inscriptions en attente (utilisateurs sans maison d'hôtes) */}
      {pendingUsers.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Inscriptions en attente
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300" variant="outline">
                {pendingUsers.length}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Utilisateurs inscrits qui n&apos;ont pas encore créé leur maison d&apos;hôtes
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pendingUsers.map((pu) => (
                <div key={pu.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-sm font-medium shrink-0">
                    {(pu.firstName?.[0] || pu.name?.[0] || "U").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {pu.firstName} {pu.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{pu.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(pu.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                    {pu.isActive ? (
                      <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0" variant="outline">Actif</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0" variant="outline">Inactif</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, slug, email, ville..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Bloquée</SelectItem>
                <SelectItem value="suspended">Suspendue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
                <SelectItem value="free">Gratuit</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des maisons d'hôtes */}
      {guestHouses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Aucune maison d'hôtes trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {guestHouses.map((gh) => {
            const isExpanded = expandedId === gh.id
            const st = statusConfig[gh.status] || statusConfig.pending
            const pl = planConfig[gh.plan] || planConfig.free
            const StatusIcon = st.icon
            const isUpdatingThis = isUpdating === gh.id

            return (
              <Card key={gh.id} className="overflow-hidden">
                {/* Row principale */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : gh.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{gh.name}</h3>
                      <Badge className={pl.color} variant="outline">{pl.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {gh.owner && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {gh.owner.firstName} {gh.owner.lastName}
                        </span>
                      )}
                      {gh.city && <span>{gh.city}{gh.country ? `, ${gh.country}` : ""}</span>}
                    </div>
                  </div>

                  {/* Statut */}
                  <Badge className={`${st.color} border shrink-0`} variant="outline">
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {st.label}
                  </Badge>

                  {/* Espace utilisé */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-sm font-semibold text-gray-700">{gh.counts.totalRecords} <span className="font-normal text-gray-400">enreg.</span></p>
                    <p className="text-xs text-gray-400">~{gh.counts.estimatedSizeKo} Ko</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {gh.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50 hover:text-green-700 h-8"
                        disabled={isUpdatingThis}
                        onClick={() => handleStatusChange(gh.id, "active")}
                      >
                        {isUpdatingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3 mr-1" />}
                        Activer
                      </Button>
                    )}
                    {gh.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 h-8"
                        disabled={isUpdatingThis}
                        onClick={() => handleStatusChange(gh.id, "blocked")}
                      >
                        {isUpdatingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3 mr-1" />}
                        Bloquer
                      </Button>
                    )}
                    {gh.status === "blocked" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50 hover:text-green-700 h-8"
                        disabled={isUpdatingThis}
                        onClick={() => handleStatusChange(gh.id, "active")}
                      >
                        {isUpdatingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3 mr-1" />}
                        Débloquer
                      </Button>
                    )}
                    {gh.status === "suspended" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50 hover:text-green-700 h-8"
                        disabled={isUpdatingThis}
                        onClick={() => handleStatusChange(gh.id, "active")}
                      >
                        {isUpdatingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3 mr-1" />}
                        Réactiver
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 h-8"
                      disabled={isUpdatingThis}
                      onClick={() => setDeleteDialog(gh.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    {gh.owner && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-sky-600 hover:bg-sky-50 hover:text-sky-700 h-8"
                        disabled={isUpdatingThis}
                        onClick={() => handleOpenPasswordDialog(gh.id, gh.owner.id, `${gh.owner.firstName || ''} ${gh.owner.lastName || ''}`.trim() || gh.owner.email)}
                        title="Réinitialiser le mot de passe"
                      >
                        <KeyRound className="w-3 h-3" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Détail expansible */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {Object.entries(countLabels).map(([key, { label, icon: Icon }]) => {
                        const count = (gh.counts as Record<string, number>)[key] || 0
                        return (
                          <div key={key} className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                            <Icon className="w-4 h-4 text-sky-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-gray-400 truncate">{label}</p>
                              <p className="text-sm font-semibold text-gray-700">{count}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Infos supplémentaires */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Propriétaire</span>
                        <p className="font-medium">{gh.owner ? `${gh.owner.firstName} ${gh.owner.lastName}` : "—"}</p>
                        <p className="text-gray-500">{gh.owner?.email || "—"}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Coordonnées</span>
                        <p className="font-medium">{gh.email || "—"}</p>
                        <p className="text-gray-500">{gh.phone || "—"}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Créée le</span>
                        <p className="font-medium">{new Date(gh.createdAt).toLocaleDateString("fr-FR")}</p>
                        <p className="text-gray-500">{new Date(gh.createdAt).toLocaleTimeString("fr-FR")}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de réinitialisation du mot de passe */}
      <Dialog open={!!passwordDialogGhId} onOpenChange={(open) => { if (!open) handleClosePasswordDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-sky-600" />
              Réinitialiser le mot de passe
            </DialogTitle>
            <DialogDescription>
              Définir un nouveau mot de passe pour <strong>{passwordDialogUserName}</strong>.<br />
              L'utilisateur devra utiliser ce mot de passe lors de sa prochaine connexion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nouveau mot de passe</label>
              <Input
                type="password"
                placeholder="Minimum 6 caractères"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isResettingPassword || passwordSuccess}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmer le mot de passe</label>
              <Input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                disabled={isResettingPassword || passwordSuccess}
              />
            </div>
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Mot de passe réinitialisé avec succès !
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClosePasswordDialog} disabled={isResettingPassword}>
                Annuler
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={isResettingPassword || passwordSuccess || !newPassword || !passwordConfirm}
                className="bg-sky-600 hover:bg-sky-700"
              >
                {isResettingPassword && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Réinitialiser
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Supprimer la maison d'hôtes
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes les données associées seront supprimées définitivement
              (chambres, clients, réservations, factures, paiements, etc.).
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={!!isUpdating}
              onClick={handleDelete}
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Supprimer définitivement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
