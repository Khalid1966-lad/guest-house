"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Building2,
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Lock,
  Key,
  Users,
  BedDouble,
  CalendarDays,
  Receipt,
  CreditCard,
  UtensilsCrossed,
  Wallet,
  Settings,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Globe,
} from "lucide-react"

interface Owner {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

interface Counts {
  rooms: number
  guests: number
  bookings: number
  invoices: number
  payments: number
  restaurantOrders: number
  menuItems: number
  expenses: number
  amenities: number
  roles: number
  auditLogs: number
  totalRecords: number
  estimatedSizeKo: number
}

interface GuestHouseDetail {
  id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  logo: string | null
  coverImage: string | null
  currency: string
  timezone: string
  taxRate: number
  plan: string
  status: string
  isActive: boolean
  trialEndsAt: string | null
  subscriptionStartDate: string | null
  subscriptionEndDate: string | null
  createdAt: string
  updatedAt: string
  users: Owner[]
  counts: Counts
}

export default function GuestHouseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const id = params.id as string

  const [guestHouse, setGuestHouse] = useState<GuestHouseDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Formulaire
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    address: "",
    city: "",
    postalCode: "",
    country: "France",
    phone: "",
    email: "",
    website: "",
    currency: "EUR",
    timezone: "Europe/Paris",
    taxRate: 10,
    plan: "free",
    status: "pending",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
  })

  // Reset mot de passe
  const [resetDialog, setResetDialog] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Vérifier super_admin
  useEffect(() => {
    if (session && session.user.role !== "super_admin") {
      router.push("/login")
    }
  }, [session, router])

  // Charger les données
  const fetchGuestHouse = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/guesthouses/${id}`)
      if (res.ok) {
        const data = await res.json()
        const gh = data.guestHouse as GuestHouseDetail
        setGuestHouse(gh)
        setForm({
          name: gh.name,
          slug: gh.slug,
          description: gh.description || "",
          address: gh.address || "",
          city: gh.city || "",
          postalCode: gh.postalCode || "",
          country: gh.country,
          phone: gh.phone || "",
          email: gh.email || "",
          website: gh.website || "",
          currency: gh.currency,
          timezone: gh.timezone,
          taxRate: gh.taxRate,
          plan: gh.plan,
          status: gh.status,
          subscriptionStartDate: gh.subscriptionStartDate ? gh.subscriptionStartDate.slice(0, 10) : "",
          subscriptionEndDate: gh.subscriptionEndDate ? gh.subscriptionEndDate.slice(0, 10) : "",
        })
      } else {
        setError("Maison d'hôtes non trouvée")
      }
    } catch {
      setError("Erreur de chargement")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (session?.user?.role === "super_admin" && id) {
      fetchGuestHouse()
    }
  }, [session, id, fetchGuestHouse])

  // Sauvegarder les modifications
  const handleSave = async () => {
    setIsSaving(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch(`/api/admin/guesthouses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSuccess("Modifications enregistrées avec succès")
        fetchGuestHouse()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await res.json()
        setError(data.error || "Erreur lors de la sauvegarde")
      }
    } catch {
      setError("Erreur réseau")
    } finally {
      setIsSaving(false)
    }
  }

  // Réinitialiser le mot de passe
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }
    setIsResetting(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/guesthouses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetOwnerId: resetDialog,
          resetOwnerPassword: newPassword,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setSuccess(data.message)
        setResetDialog(null)
        setNewPassword("")
        setTimeout(() => setSuccess(""), 4000)
      } else {
        const data = await res.json()
        setError(data.error || "Erreur")
      }
    } catch {
      setError("Erreur réseau")
    } finally {
      setIsResetting(false)
    }
  }

  if (!session || session.user.role !== "super_admin") return null
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }
  if (!guestHouse) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Maison d'hôtes non trouvée</p>
        <Link href="/app/admin/guesthouses" className="text-violet-600 hover:underline mt-2 inline-block">
          Retour à la liste
        </Link>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    active: "bg-green-100 text-green-800 border-green-300",
    blocked: "bg-red-100 text-red-800 border-red-300",
    suspended: "bg-orange-100 text-orange-800 border-orange-300",
  }
  const statusLabels: Record<string, string> = {
    pending: "En attente",
    active: "Active",
    blocked: "Bloquée",
    suspended: "Suspendue",
  }

  const owner = guestHouse.users.find((u) => u.role === "owner")
  const otherUsers = guestHouse.users.filter((u) => u.role !== "owner")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/admin/guesthouses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{guestHouse.name}</h1>
          <p className="text-sm text-gray-500">{guestHouse.city}{guestHouse.country ? `, ${guestHouse.country}` : ""}</p>
        </div>
        <Badge className={`${statusColors[guestHouse.status] || ""} border`} variant="outline">
          {statusLabels[guestHouse.status] || guestHouse.status}
        </Badge>
      </div>

      {/* Alertes */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale - Formulaire */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-violet-600" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Adresse</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Code postal</Label>
                    <Input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Pays</Label>
                  <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> Téléphone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Globe className="h-3 w-3" /> Site web</Label>
                  <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Devise</Label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="MAD">MAD (DH)</SelectItem>
                        <SelectItem value="TND">TND (DT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Taux de taxe (%)</Label>
                    <Input type="number" step="0.1" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Abonnement & Statut */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-violet-600" />
                Abonnement & Statut
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="blocked">Bloquée</SelectItem>
                      <SelectItem value="suspended">Suspendue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Gratuit</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Début de l'abonnement
                  </Label>
                  <Input
                    type="date"
                    value={form.subscriptionStartDate}
                    onChange={(e) => setForm({ ...form, subscriptionStartDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Fin de l'abonnement
                  </Label>
                  <Input
                    type="date"
                    value={form.subscriptionEndDate}
                    onChange={(e) => setForm({ ...form, subscriptionEndDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Période d'essai automatique */}
              {!guestHouse.subscriptionStartDate && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">Période d'essai en cours</p>
                      <p className="text-amber-700 mt-1">
                        Se termine automatiquement le{" "}
                        <span className="font-semibold">
                          {guestHouse.trialEndsAt
                            ? new Date(guestHouse.trialEndsAt).toLocaleDateString("fr-FR")
                            : new Date(new Date(guestHouse.createdAt).getTime() + 14 * 86400000).toLocaleDateString("fr-FR")
                          }
                        </span>
                      </p>
                      {!guestHouse.trialEndsAt && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100"
                          onClick={async () => {
                            const trialEnd = new Date(new Date(guestHouse.createdAt).getTime() + 14 * 86400000).toISOString()
                            const res = await fetch(`/api/admin/guesthouses/${id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ trialEndsAt: trialEnd }),
                            })
                            if (res.ok) {
                              fetchGuestHouse()
                              setSuccess("Période d'essai définie à 14 jours")
                              setTimeout(() => setSuccess(""), 3000)
                            }
                          }}
                        >
                          Définir fin d'essai (14 jours)
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Abonnement actif */}
              {guestHouse.subscriptionStartDate && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="text-sm space-y-1">
                      <p className="font-medium text-green-800">Abonnement actif</p>
                      <p className="text-green-700">
                        Du {new Date(guestHouse.subscriptionStartDate).toLocaleDateString("fr-FR")}
                        {guestHouse.subscriptionEndDate && (
                          <> au {new Date(guestHouse.subscriptionEndDate).toLocaleDateString("fr-FR")}</>
                        )}
                      </p>
                      {guestHouse.subscriptionEndDate && new Date(guestHouse.subscriptionEndDate) < new Date() && (
                        <p className="text-red-600 font-medium mt-1">⚠️ Abonnement expiré !</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Pas encore d'abonnement */}
              {!guestHouse.subscriptionStartDate && !guestHouse.trialEndsAt && (
                <p className="text-xs text-gray-500 italic">
                  Aucune période d'essai ni abonnement défini. La période d'essai démarre automatiquement à la création du compte (14 jours).
                </p>
              )}
            </CardContent>
          </Card>

          {/* Bouton sauvegarder */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="bg-violet-600 hover:bg-violet-700">
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : <><Save className="w-4 h-4 mr-2" />Enregistrer les modifications</>}
            </Button>
          </div>
        </div>

        {/* Colonne latérale - Sidebar info */}
        <div className="space-y-6">
          {/* Propriétaire */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-600" />
                Propriétaire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {owner ? (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold">
                      {(owner.firstName?.[0] || owner.name?.[0] || "U").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{owner.firstName} {owner.lastName}</p>
                      <p className="text-sm text-gray-500 truncate">{owner.email}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Rôle : <span className="capitalize">{owner.role}</span></p>
                    <p>Inscrit le : {new Date(owner.createdAt).toLocaleDateString("fr-FR")}</p>
                    <p>Statut : {owner.isActive ? <span className="text-green-600">Actif</span> : <span className="text-red-600">Inactif</span>}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => { setResetDialog(owner.id); setNewPassword(""); setError(""); }}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Réinitialiser le mot de passe
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucun propriétaire</p>
              )}

              {/* Autres utilisateurs */}
              {otherUsers.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-400 mb-2">Autres utilisateurs ({otherUsers.length})</p>
                  {otherUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => { setResetDialog(u.id); setNewPassword(""); setError(""); }}
                      >
                        <Key className="w-3 h-3 mr-1" />
                        Mot de passe
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-violet-600" />
                Utilisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: "Chambres", count: guestHouse.counts.rooms, icon: BedDouble },
                  { label: "Clients", count: guestHouse.counts.guests, icon: Users },
                  { label: "Réservations", count: guestHouse.counts.bookings, icon: CalendarDays },
                  { label: "Factures", count: guestHouse.counts.invoices, icon: Receipt },
                  { label: "Paiements", count: guestHouse.counts.payments, icon: CreditCard },
                  { label: "Commandes rest.", count: guestHouse.counts.restaurantOrders, icon: UtensilsCrossed },
                  { label: "Dépenses", count: guestHouse.counts.expenses, icon: Wallet },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <item.icon className="h-4 w-4 text-gray-400" />
                      {item.label}
                    </div>
                    <span className="font-semibold text-sm">{item.count}</span>
                  </div>
                ))}
                <div className="pt-3 mt-2 border-t space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total enregistrements</span>
                    <span className="font-bold">{guestHouse.counts.totalRecords}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Espace estimé</span>
                    <span className="font-bold">~{guestHouse.counts.estimatedSizeKo} Ko</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Infos système */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">Informations système</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-400 space-y-1">
              <p>ID : <code className="bg-gray-100 px-1 rounded">{guestHouse.id.slice(0, 12)}...</code></p>
              <p>Créée le : {new Date(guestHouse.createdAt).toLocaleDateString("fr-FR")} à {new Date(guestHouse.createdAt).toLocaleTimeString("fr-FR")}</p>
              <p>Modifiée le : {new Date(guestHouse.updatedAt).toLocaleDateString("fr-FR")} à {new Date(guestHouse.updatedAt).toLocaleTimeString("fr-FR")}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Réinitialisation mot de passe */}
      <Dialog open={!!resetDialog} onOpenChange={() => { setResetDialog(null); setNewPassword(""); setError("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-violet-600" />
              Réinitialiser le mot de passe
            </DialogTitle>
            <DialogDescription>
              Définissez un nouveau mot de passe pour cet utilisateur. Il devra le changer à la prochaine connexion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {resetDialog && (() => {
              const targetUser = guestHouse.users.find((u) => u.id === resetDialog)
              return targetUser ? (
                <div className="p-3 rounded-lg bg-gray-50 text-sm">
                  <p className="font-medium">{targetUser.firstName} {targetUser.lastName}</p>
                  <p className="text-gray-500">{targetUser.email}</p>
                </div>
              ) : null
            })()}
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && !error.includes("enregistrées") && !error.includes("succès") && !error.includes("réinitialisé") && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetDialog(null); setNewPassword(""); setError("") }}>
              Annuler
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isResetting || !newPassword || newPassword.length < 6}
            >
              {isResetting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Réinitialisation...</> : <><Key className="w-4 h-4 mr-2" />Réinitialiser</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
