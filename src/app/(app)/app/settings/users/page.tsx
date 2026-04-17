"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import {
  ArrowLeft,
  Crown,
  Briefcase,
  Headset,
  Calculator,
  Sparkles,
  Users,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  UserPlus,
  Shield,
  Lock,
  Unlock,
  KeyRound,
  UserCheck,
  UserX,
  Broom,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────────

interface User {
  id: string
  email: string
  name: string | null
  firstName: string | null
  lastName: string | null
  role: string
  isActive: boolean
  createdAt: string
  menuAccess: Record<string, boolean> | null
}

// ── Role configuration ─────────────────────────────────────────────────────────

const ROLES = [
  {
    value: "owner",
    label: "Propriétaire",
    icon: Crown,
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    avatar: "bg-purple-500",
  },
  {
    value: "manager",
    label: "Gestionnaire",
    icon: Briefcase,
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    avatar: "bg-blue-500",
  },
  {
    value: "receptionist",
    label: "Réceptionniste",
    icon: Headset,
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    avatar: "bg-emerald-500",
  },
  {
    value: "accountant",
    label: "Comptable",
    icon: Calculator,
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    avatar: "bg-amber-500",
  },
  {
    value: "femmeDeMenage",
    label: "Femme de ménage",
    icon: Broom,
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    avatar: "bg-rose-500",
  },
  {
    value: "gouvernant",
    label: "Gouvernant",
    icon: Eye,
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    avatar: "bg-orange-500",
  },
  {
    value: "gouvernante",
    label: "Gouvernante",
    icon: Eye,
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    avatar: "bg-orange-500",
  },
] as const

const MENU_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { key: "rooms", label: "Chambres", icon: "BedDouble" },
  { key: "housekeeping", label: "Ménage", icon: "Sparkles" },
  { key: "bookings", label: "Réservations", icon: "CalendarDays" },
  { key: "guests", label: "Clients", icon: "Users" },
  { key: "invoices", label: "Facturation", icon: "CreditCard" },
  { key: "restaurant", label: "Restaurant", icon: "UtensilsCrossed" },
  { key: "expenses", label: "Dépenses", icon: "Receipt" },
  { key: "statistics", label: "Statistiques", icon: "BarChart3" },
  { key: "users", label: "Utilisateurs", icon: "UserCog" },
  { key: "settings", label: "Paramètres", icon: "Settings" },
] as const

function getRoleConfig(role: string) {
  return ROLES.find((r) => r.value === role) ?? ROLES[2] // fallback to receptionist
}

// ── French date formatter ──────────────────────────────────────────────────────

const FRENCH_MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]

function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDate()
  const month = FRENCH_MONTHS[d.getMonth()]
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

// ── Password strength ──────────────────────────────────────────────────────────

function getPasswordStrength(password: string): { label: string; percent: number; color: string } {
  if (!password) return { label: "", percent: 0, color: "" }
  if (password.length < 6)
    return { label: "Faible", percent: 20, color: "bg-red-500" }
  if (password.length < 10)
    return { label: "Moyen", percent: 55, color: "bg-amber-500" }
  return { label: "Fort", percent: 100, color: "bg-emerald-500" }
}

// ── Page Component ─────────────────────────────────────────────────────────────

export default function UsersSettingsPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()

  // ── State ─────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog: add / edit
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "receptionist",
    password: "",
    menuAccess: {} as Record<string, boolean>,
  })

  // Dialog: reset password
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [resetPassword, setResetPassword] = useState("")
  const [resetConfirm, setResetConfirm] = useState("")
  const [resetting, setResetting] = useState(false)

  // Alert: delete confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Auto-migrate menuAccess column if missing ────────────────────────────
  const [migrating, setMigrating] = useState(false)
  const isOwner = session?.user?.role === "owner"

  const runMigration = async () => {
    try {
      setMigrating(true)
      const res = await fetch("/api/setup/migrate", { method: "POST" })
      if (res.ok) {
        toast({ title: "Migration réussie", description: "La colonne menuAccess a été ajoutée." })
        fetchUsers() // Re-fetch after migration
      } else {
        toast({ title: "Erreur de migration", description: "Vérifiez la console serveur.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erreur", description: "Impossible d'exécuter la migration.", variant: "destructive" })
    } finally {
      setMigrating(false)
    }
  }

  // ── Fetch users ───────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    if (!session?.user?.guestHouseId) return
    try {
      setLoading(true)
      const res = await fetch("/api/users")
      if (res.ok) {
        const data = await res.json()
        const usersList = data.users || []
        // Detect missing menuAccess column: no user has the field
        const hasMenuAccess = usersList.length === 0 || usersList.some((u: User) => u.menuAccess !== undefined)
        if (!hasMenuAccess && isOwner && !migrating) {
          console.log("[users] menuAccess column missing, triggering migration...")
          runMigration()
        }
        setUsers(usersList)
      }
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les utilisateurs", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.guestHouseId) fetchUsers()
  }, [session])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isSelf = (userId: string) => session?.user?.id === userId
  const ownerCount = users.filter((u) => u.role === "owner").length
  const isLastOwner = (userId: string) =>
    users.find((u) => u.id === userId)?.role === "owner" && ownerCount <= 1

  const activeCount = users.filter((u) => u.isActive).length
  const blockedCount = users.filter((u) => !u.isActive).length

  // ── Dialog: Add / Edit handlers ───────────────────────────────────────────
  const openAddDialog = () => {
    setEditingUser(null)
    setFormData({ email: "", firstName: "", lastName: "", role: "receptionist", password: "", menuAccess: {} as Record<string, boolean> })
    setIsDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    let menuAccess: Record<string, boolean> = {}
    if (user.menuAccess) {
      if (typeof user.menuAccess === 'string') {
        try { menuAccess = JSON.parse(user.menuAccess) } catch { menuAccess = {} }
      } else {
        menuAccess = user.menuAccess as Record<string, boolean>
      }
    }
    setFormData({
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
      password: "",
      menuAccess,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.email.trim()) {
      toast({ title: "Erreur", description: "L'email est requis", variant: "destructive" })
      return
    }
    if (!editingUser && formData.password.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères", variant: "destructive" })
      return
    }

    try {
      setSaving(true)
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users"
      const method = editingUser ? "PUT" : "POST"

      // Build menuAccess with only true values
      const menuAccess: Record<string, boolean> = {}
      for (const menu of MENU_ITEMS) {
        if (formData.menuAccess[menu.key]) {
          menuAccess[menu.key] = true
        }
      }

      const body = editingUser
        ? { firstName: formData.firstName, lastName: formData.lastName, role: formData.role, menuAccess }
        : {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role,
            password: formData.password,
            menuAccess,
          }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast({
          title: "Succès",
          description: editingUser ? "Utilisateur modifié avec succès" : "Utilisateur créé avec succès",
        })
        setIsDialogOpen(false)
        fetchUsers()
      } else {
        const data = await res.json()
        toast({ title: "Erreur", description: data.error || "Une erreur est survenue", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // ── Dialog: Reset password handlers ───────────────────────────────────────
  const openResetDialog = (user: User) => {
    setResetUser(user)
    setResetPassword("")
    setResetConfirm("")
    setIsResetOpen(true)
  }

  const handleResetPassword = async () => {
    if (resetPassword.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères", variant: "destructive" })
      return
    }
    if (resetPassword !== resetConfirm) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" })
      return
    }

    try {
      setResetting(true)
      const res = await fetch(`/api/users/${resetUser!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resetPassword", newPassword: resetPassword }),
      })

      if (res.ok) {
        toast({ title: "Succès", description: "Mot de passe réinitialisé avec succès" })
        setIsResetOpen(false)
      } else {
        const data = await res.json()
        toast({ title: "Erreur", description: data.error || "Une erreur est survenue", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" })
    } finally {
      setResetting(false)
    }
  }

  // ── Handler: Toggle block ─────────────────────────────────────────────────
  const handleToggleBlock = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleBlock" }),
      })

      if (res.ok) {
        const data = await res.json()
        toast({ title: "Succès", description: data.message })
        fetchUsers()
      } else {
        const data = await res.json()
        toast({ title: "Erreur", description: data.error || "Une erreur est survenue", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" })
    }
  }

  // ── Alert: Delete handlers ────────────────────────────────────────────────
  const openDeleteDialog = (user: User) => {
    setDeletingUser(user)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingUser) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/users/${deletingUser.id}`, { method: "DELETE" })

      if (res.ok) {
        toast({ title: "Succès", description: "Utilisateur supprimé avec succès" })
        setIsDeleteOpen(false)
        setDeletingUser(null)
        fetchUsers()
      } else {
        const data = await res.json()
        toast({ title: "Erreur", description: data.error || "Une erreur est survenue", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer l'utilisateur", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  // ── Render: Session loading ───────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  // ── Render: Owner-only guard ──────────────────────────────────────────────
  if (!isOwner) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/app/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestion des Utilisateurs
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gérez les accès et les rôles de votre équipe
            </p>
          </div>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2">
              <Shield className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-xl">Accès restreint</CardTitle>
            <CardDescription>
              Seul le propriétaire peut gérer les utilisateurs.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Contactez le propriétaire de votre établissement pour toute demande
              de création, modification ou suppression de compte utilisateur.
            </p>
            <Link href="/app/settings">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux paramètres
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Render: Loading users ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  // ── Role breakdown for stats ──────────────────────────────────────────────
  const roleBreakdown = ROLES.map((role) => ({
    ...role,
    count: users.filter((u) => u.role === role.value).length,
  })).filter((r) => r.count > 0)

  // ── Render: Main page ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/app/settings">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
            Gestion des Utilisateurs
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez les accès et les rôles de votre équipe
          </p>
        </div>
        <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un utilisateur
        </Button>
      </div>

      {/* ── Stats summary cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total utilisateurs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{blockedCount}</p>
                <p className="text-sm text-muted-foreground">Bloqués</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Role breakdown badges ───────────────────────────────────────────── */}
      {roleBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {roleBreakdown.map((r) => {
            const Icon = r.icon
            return (
              <Badge key={r.value} variant="secondary" className="gap-1.5 py-1 px-2.5">
                <Icon className="w-3.5 h-3.5" />
                {r.label} ({r.count})
              </Badge>
            )
          })}
        </div>
      )}

      {/* ── Users list ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <CardTitle>Liste des utilisateurs</CardTitle>
          </div>
          <CardDescription>
            {users.length} utilisateur{users.length > 1 ? "s" : ""} dans votre établissement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun utilisateur</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par ajouter votre premier utilisateur
              </p>
              <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un utilisateur
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
              {users.map((user) => {
                const roleCfg = getRoleConfig(user.role)
                const RoleIcon = roleCfg.icon
                const fullName =
                  user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.name || user.email
                const initials =
                  user.firstName && user.lastName
                    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                    : user.email[0].toUpperCase()
                const self = isSelf(user.id)
                const canDelete = isOwner && !self && !isLastOwner(user.id)

                return (
                  <div
                    key={user.id}
                    className={cn(
                      "relative flex flex-col gap-3 rounded-lg border p-4 transition-all",
                      user.isActive
                        ? "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
                        : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-70"
                    )}
                  >
                    {/* "Vous" badge for current user */}
                    {self && (
                      <Badge className="absolute top-3 right-3 bg-emerald-500 text-white border-0 text-[10px] px-1.5 py-0">
                        Vous
                      </Badge>
                    )}

                    {/* Blocked overlay badge */}
                    {!user.isActive && (
                      <Badge className="absolute top-3 right-3 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-0 text-[10px] px-1.5 py-0">
                        Bloqué
                      </Badge>
                    )}

                    {/* Top row: Avatar + info */}
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0",
                          roleCfg.avatar
                        )}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {fullName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className={cn("border-0 gap-1", roleCfg.badge)}>
                        <RoleIcon className="w-3.5 h-3.5" />
                        {roleCfg.label}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "border-0 gap-1",
                          user.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        )}
                      >
                        {user.isActive ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            Actif
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            Bloqué
                          </>
                        )}
                      </Badge>
                      {user.menuAccess && typeof user.menuAccess === 'object' && (
                        <Badge variant="secondary" className="border-0 gap-1 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                          <Lock className="w-3 h-3" />
                          {Object.values(user.menuAccess as Record<string, boolean>).filter(Boolean).length}/{MENU_ITEMS.length} menus
                        </Badge>
                      )}
                    </div>

                    {/* Bottom row: date + actions */}
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <p className="text-xs text-muted-foreground">
                        Créé le {formatDateFr(user.createdAt)}
                      </p>
                      {isOwner && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(user)} disabled={self}>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleBlock(user)}
                              disabled={self}
                            >
                              {user.isActive ? (
                                <>
                                  <Lock className="w-4 h-4 mr-2" />
                                  Bloquer
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-4 h-4 mr-2" />
                                  Débloquer
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openResetDialog(user)} disabled={self}>
                              <KeyRound className="w-4 h-4 mr-2" />
                              Réinitialiser le mot de passe
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => openDeleteDialog(user)}
                              disabled={!canDelete}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add / Edit Dialog ───────────────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Modifiez les informations et le rôle de l'utilisateur."
                : "Créez un nouveau compte pour un membre de votre équipe."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  placeholder="Prénom"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  placeholder="Nom"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editingUser}
              />
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 caractères"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                {formData.password && formData.password.length < 6 && (
                  <p className="text-xs text-red-500">Le mot de passe doit contenir au moins 6 caractères</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => {
                  // Auto-fill menuAccess for housekeeping roles
                  let newMenuAccess = { ...formData.menuAccess }
                  if (value === "femmeDeMenage") {
                    // Femme de ménage: only housekeeping
                    newMenuAccess = { housekeeping: true }
                  } else if (value === "gouvernant" || value === "gouvernante") {
                    // Gouvernant(e): housekeeping + dashboard
                    newMenuAccess = { housekeeping: true, dashboard: true }
                  }
                  setFormData({ ...formData, role: value, menuAccess: newMenuAccess })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => {
                    const Icon = role.icon
                    return (
                      <SelectItem key={role.value} value={role.value}>
                        <span className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {role.label}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {!(editingUser?.role === "owner") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Accès aux menus</Label>
                  <button
                    type="button"
                    onClick={() => {
                      const allChecked = MENU_ITEMS.every(m => formData.menuAccess[m.key])
                      const newAccess = { ...formData.menuAccess }
                      MENU_ITEMS.forEach(m => {
                        newAccess[m.key] = !allChecked
                      })
                      setFormData({ ...formData, menuAccess: newAccess })
                    }}
                    className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                  >
                    {MENU_ITEMS.every(m => formData.menuAccess[m.key]) ? "Tout désactiver" : "Tout activer"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  {MENU_ITEMS.map((menu) => (
                    <label
                      key={menu.key}
                      className="flex items-center gap-2 cursor-pointer text-sm py-1 px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.menuAccess[menu.key] === true}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            menuAccess: {
                              ...formData.menuAccess,
                              [menu.key]: e.target.checked,
                            },
                          })
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{menu.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚠️ Les menus non cochés seront visibles mais afficheront « Accès restreint »
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || (!editingUser && formData.password.length < 6) || !formData.email.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : editingUser ? (
                "Modifier"
              ) : (
                "Créer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset Password Dialog ───────────────────────────────────────────── */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              Réinitialiser le mot de passe
            </DialogTitle>
            <DialogDescription>
              Définissez un nouveau mot de passe pour cet utilisateur.
            </DialogDescription>
          </DialogHeader>

          {resetUser && (
            <div className="space-y-4 py-2">
              {/* User info summary */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white font-semibold text-sm">
                  {resetUser.firstName && resetUser.lastName
                    ? `${resetUser.firstName[0]}${resetUser.lastName[0]}`.toUpperCase()
                    : resetUser.email[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {resetUser.firstName && resetUser.lastName
                      ? `${resetUser.firstName} ${resetUser.lastName}`
                      : resetUser.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{resetUser.email}</p>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-2">
                <Label htmlFor="resetPassword">Nouveau mot de passe</Label>
                <Input
                  id="resetPassword"
                  type="password"
                  placeholder="Minimum 6 caractères"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                />
                {/* Password strength indicator */}
                {resetPassword.length > 0 && (
                  <div className="space-y-1">
                    <Progress
                      value={getPasswordStrength(resetPassword).percent}
                      className={cn("h-1.5", getPasswordStrength(resetPassword).color === "" && "hidden")}
                    >
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          getPasswordStrength(resetPassword).color
                        )}
                        style={{ width: `${getPasswordStrength(resetPassword).percent}%` }}
                      />
                    </Progress>
                    <p
                      className={cn(
                        "text-xs",
                        getPasswordStrength(resetPassword).label === "Faible" && "text-red-500",
                        getPasswordStrength(resetPassword).label === "Moyen" && "text-amber-500",
                        getPasswordStrength(resetPassword).label === "Fort" && "text-emerald-500"
                      )}
                    >
                      Force : {getPasswordStrength(resetPassword).label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <Label htmlFor="resetConfirm">Confirmer le mot de passe</Label>
                <Input
                  id="resetConfirm"
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                />
                {resetConfirm.length > 0 && resetPassword !== resetConfirm && (
                  <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={
                resetting ||
                resetPassword.length < 6 ||
                resetPassword !== resetConfirm
              }
              className="bg-amber-600 hover:bg-amber-700"
            >
              {resetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                "Réinitialiser"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation AlertDialog ─────────────────────────────────── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Supprimer l&apos;utilisateur
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?
                </p>
                {deletingUser && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold text-sm">
                      {deletingUser.firstName && deletingUser.lastName
                        ? `${deletingUser.firstName[0]}${deletingUser.lastName[0]}`.toUpperCase()
                        : deletingUser.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {deletingUser.firstName && deletingUser.lastName
                          ? `${deletingUser.firstName} ${deletingUser.lastName}`
                          : deletingUser.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{deletingUser.email}</p>
                    </div>
                  </div>
                )}
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  ⚠️ Cette action est irréversible. Toutes les données associées seront perdues.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || !deletingUser || !canDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer définitivement"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
