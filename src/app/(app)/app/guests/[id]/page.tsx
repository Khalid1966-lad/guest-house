"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
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
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  Edit,
  BedDouble,
  Euro,
  Clock,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

// Types
interface Booking {
  id: string
  checkIn: string
  checkOut: string
  actualCheckIn: string | null
  actualCheckOut: string | null
  adults: number
  children: number
  nightlyRate: number
  totalPrice: number
  status: string
  source: string
  room: {
    id: string
    number: string
    name: string | null
    type: string
  }
}

interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  nationality: string | null
  idType: string | null
  idNumber: string | null
  birthDate: string | null
  isVip: boolean
  vipLevel: string | null
  totalStays: number
  totalSpent: number
  notes: string | null
  preferences: string | null
  createdAt: string
  bookings: Booking[]
}

// Status colors
const bookingStatuses: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "En attente", color: "text-yellow-700", bg: "bg-yellow-100" },
  confirmed: { label: "Confirmée", color: "text-sky-700", bg: "bg-sky-100" },
  checked_in: { label: "Arrivée", color: "text-green-700", bg: "bg-green-100" },
  checked_out: { label: "Parti", color: "text-gray-700", bg: "bg-gray-100" },
  cancelled: { label: "Annulée", color: "text-red-700", bg: "bg-red-100" },
  no_show: { label: "No-show", color: "text-orange-700", bg: "bg-orange-100" },
}

// VIP Levels
const vipLevels = [
  { value: "bronze", label: "Bronze", color: "text-amber-600 bg-amber-100" },
  { value: "silver", label: "Argent", color: "text-gray-600 bg-gray-100" },
  { value: "gold", label: "Or", color: "text-yellow-600 bg-yellow-100" },
  { value: "platinum", label: "Platine", color: "text-purple-600 bg-purple-100" },
]

export default function GuestDetailPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const guestId = params.id as string

  const [guest, setGuest] = useState<Guest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
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
  })

  // Fetch guest details
  useEffect(() => {
    const fetchGuest = async () => {
      if (!session?.user?.guestHouseId) return

      try {
        const response = await fetch(`/api/guests/${guestId}`)
        
        if (response.ok) {
          const data = await response.json()
          setGuest(data.guest)
        } else {
          router.push("/app/guests")
        }
      } catch (err) {
        console.error("Erreur chargement:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.guestHouseId) {
      fetchGuest()
    }
  }, [session, guestId, router])

  // Open edit dialog
  const handleEdit = () => {
    if (!guest) return
    setFormData({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email || "",
      phone: guest.phone || "",
      address: guest.address || "",
      city: guest.city || "",
      postalCode: guest.postalCode || "",
      country: guest.country || "France",
      nationality: guest.nationality || "",
      notes: guest.notes || "",
      isVip: guest.isVip,
      vipLevel: guest.vipLevel || "",
    })
    setIsEditDialogOpen(true)
  }

  // Save guest
  const handleSave = async () => {
    setIsSaving(true)

    try {
      const response = await fetch(`/api/guests/${guestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setGuest(data.guest)
        setIsEditDialogOpen(false)
      }
    } catch (err) {
      console.error("Erreur sauvegarde:", err)
    } finally {
      setIsSaving(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    )
  }

  if (!guest) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold">Client non trouvé</h2>
        <Button className="mt-4" onClick={() => router.push("/app/guests")}>
          Retour aux clients
        </Button>
      </div>
    )
  }

  const getVipBadge = () => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {guest.firstName} {guest.lastName}
            </h1>
            {getVipBadge()}
          </div>
          <p className="text-gray-500">
            Client depuis le {format(parseISO(guest.createdAt), "d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Modifier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg">
                <Calendar className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{guest.totalStays}</p>
                <p className="text-sm text-gray-500">Séjours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Euro className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{guest.totalSpent} €</p>
                <p className="text-sm text-gray-500">Total dépensé</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BedDouble className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{guest.bookings?.length || 0}</p>
                <p className="text-sm text-gray-500">Réservations</p>
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
                <p className="text-2xl font-bold">{guest.isVip ? guest.vipLevel || "VIP" : "-"}</p>
                <p className="text-sm text-gray-500">Statut</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {guest.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${guest.email}`} className="text-sky-600 hover:underline">
                    {guest.email}
                  </a>
                </div>
              )}
              {guest.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${guest.phone}`} className="text-sky-600 hover:underline">
                    {guest.phone}
                  </a>
                </div>
              )}
              {(guest.address || guest.city) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    {guest.address && <p>{guest.address}</p>}
                    {guest.city && (
                      <p>
                        {guest.postalCode} {guest.city}
                      </p>
                    )}
                    {guest.country && <p>{guest.country}</p>}
                  </div>
                </div>
              )}
              {guest.nationality && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">Nationalité:</span>
                  <span>{guest.nationality}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {guest.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 whitespace-pre-wrap">{guest.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Preferences */}
          {guest.preferences && (
            <Card>
              <CardHeader>
                <CardTitle>Préférences</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 whitespace-pre-wrap">{guest.preferences}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Historique des séjours</CardTitle>
              <CardDescription>
                {guest.bookings?.length || 0} réservation{guest.bookings?.length > 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!guest.bookings || guest.bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Aucune réservation</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {guest.bookings.map((booking) => {
                    const status = bookingStatuses[booking.status] || bookingStatuses.pending
                    return (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("w-3 h-3 rounded-full", status.bg)} />
                          <div>
                            <p className="font-medium">
                              Chambre {booking.room.number}
                              {booking.room.name && ` - ${booking.room.name}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(parseISO(booking.checkIn), "d MMM", { locale: fr })} -{" "}
                              {format(parseISO(booking.checkOut), "d MMM yyyy", { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{booking.totalPrice} €</p>
                          <Badge className={cn(status.bg, status.color, "border-0")}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription>
              Modifiez les informations du client
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>

            {/* Nationality */}
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationalité</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              />
            </div>

            {/* VIP */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <Label>Client VIP</Label>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isVip}
                  onChange={(e) => setFormData({ ...formData, isVip: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </div>
              {formData.isVip && (
                <Select 
                  value={formData.vipLevel} 
                  onValueChange={(v) => setFormData({ ...formData, vipLevel: v })}
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
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-sky-600 hover:bg-sky-700"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
