"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useCurrency } from "@/hooks/use-currency"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  BedDouble,
  Users,
  Edit,
  Calendar,
  Euro,
  Wifi,
  Tv,
  Wind,
  Coffee,
  Bath,
  DoorOpen,
  Shield,
  Loader2,
  Plus,
  Trash2,
  Baby,
  Flame,
  Waves,
  Phone,
  LampDesk,
  Check,
  Droplets,
  Toilet,
  Sun,
  Car,
  Utensils,
  Heart,
  Star,
  Snowflake,
  Shirt,
} from "lucide-react"

// Types
interface Amenity {
  id: string
  name: string
  icon: string | null
}

interface RoomPrice {
  id: string
  name: string
  price: number
  startDate: string
  endDate: string
}

interface Room {
  id: string
  number: string
  name: string | null
  description: string | null
  floor: number | null
  type: string
  capacity: number
  bedCount: number
  bedType: string
  size: number | null
  maxExtraBeds: number
  extraBedPrice: number
  babyBedAvailable: boolean
  babyBedPrice: number
  basePrice: number
  weekendPrice: number | null
  status: string
  amenities: string | null
  roomPrices: RoomPrice[]
  bookings: Array<{
    id: string
    checkIn: string
    checkOut: string
    guest: { firstName: string; lastName: string }
  }>
}

// Room types
const roomTypes: Record<string, string> = {
  single: "Simple",
  double: "Double",
  twin: "Twin",
  suite: "Suite",
  family: "Familiale",
  dormitory: "Dortoir",
}

// Bed types
const bedTypes: Record<string, string> = {
  single: "Simple",
  double: "Double",
  queen: "Queen",
  king: "King",
  bunk: "Lit superposé",
}

// Status
const roomStatuses: Record<string, { label: string; color: string }> = {
  available: { label: "Disponible", color: "bg-sky-100 text-sky-700" },
  occupied: { label: "Occupée", color: "bg-blue-100 text-blue-700" },
  maintenance: { label: "Maintenance", color: "bg-yellow-100 text-yellow-700" },
  out_of_order: { label: "Hors service", color: "bg-red-100 text-red-700" },
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wifi,
  Tv,
  Wind,
  Coffee,
  Shield,
  Bath,
  DoorOpen,
  Waves,
  Phone,
  LampDesk,
  Flame,
  Droplets,
  Toilet,
  Sun,
  Car,
  Utensils,
  Heart,
  Star,
  Snowflake,
  Shirt,
}

export default function RoomDetailsPage() {
  const { data: session } = useSession()
  const { formatAmount } = useCurrency()
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string

  const [room, setRoom] = useState<Room | null>(null)
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false)
  const [priceForm, setPriceForm] = useState({
    name: "",
    price: "",
    startDate: "",
    endDate: "",
  })
  const [isSavingPrice, setIsSavingPrice] = useState(false)

  // Fetch room details and amenities
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomRes, amenitiesRes] = await Promise.all([
          fetch(`/api/rooms/${roomId}`),
          fetch("/api/amenities").catch(() => null),
        ])

        const roomData = await roomRes.json()

        if (roomRes.ok) {
          setRoom(roomData.room)
        } else {
          router.push("/app/rooms")
        }

        if (amenitiesRes && amenitiesRes.ok) {
          const amenitiesData = await amenitiesRes.json()
          setAmenities(amenitiesData.amenities || [])
        }
      } catch (err) {
        console.error("Erreur chargement chambre:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.guestHouseId) {
      fetchData()
    }
  }, [session, roomId, router])

  // Add seasonal price
  const handleAddPrice = async () => {
    if (!priceForm.name || !priceForm.price || !priceForm.startDate || !priceForm.endDate) {
      return
    }

    setIsSavingPrice(true)

    try {
      const response = await fetch(`/api/rooms/${roomId}/prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(priceForm),
      })

      const data = await response.json()

      if (response.ok) {
        setRoom((prev) =>
          prev
            ? { ...prev, roomPrices: [...prev.roomPrices, data.price] }
            : null
        )
        setIsPriceDialogOpen(false)
        setPriceForm({ name: "", price: "", startDate: "", endDate: "" })
      }
    } catch (err) {
      console.error("Erreur ajout tarif:", err)
    } finally {
      setIsSavingPrice(false)
    }
  }

  // Delete seasonal price
  const handleDeletePrice = async (priceId: string) => {
    if (!confirm("Supprimer ce tarif saisonnier ?")) return

    try {
      const response = await fetch(`/api/rooms/${roomId}/prices/${priceId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setRoom((prev) =>
          prev
            ? {
                ...prev,
                roomPrices: prev.roomPrices.filter((p) => p.id !== priceId),
              }
            : null
        )
      }
    } catch (err) {
      console.error("Erreur suppression tarif:", err)
    }
  }

  // Get amenities for display
  const getRoomAmenities = () => {
    if (!room?.amenities) return []
    try {
      const amenityIds = JSON.parse(room.amenities) as string[]
      return amenityIds.map((id) => {
        const found = amenities.find((a) => a.id === id)
        return found ? { ...found, Icon: found.icon ? iconMap[found.icon] : Check } : null
      }).filter(Boolean)
    } catch {
      return []
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Chambre non trouvée</h2>
        <Button className="mt-4" onClick={() => router.push("/app/rooms")}>
          Retour aux chambres
        </Button>
      </div>
    )
  }

  const statusInfo = roomStatuses[room.status] || roomStatuses.available
  const roomAmenities = getRoomAmenities()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Chambre {room.number}</h1>
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {room.name || roomTypes[room.type] || "Chambre"}
          </p>
        </div>
        <Button className="bg-sky-600 hover:bg-sky-700" onClick={() => router.push(`/app/rooms`)}>
          <Edit className="w-4 h-4 mr-2" />
          Modifier
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Placeholder */}
          <Card>
            <div className="h-64 bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900 dark:to-blue-900 flex items-center justify-center rounded-t-lg">
              <BedDouble className="w-20 h-20 text-sky-400" />
            </div>
            <CardContent className="p-4">
              <p className="text-gray-600 dark:text-gray-400">
                {room.description || "Aucune description"}
              </p>
            </CardContent>
          </Card>

          {/* Room Details */}
          <Card>
            <CardHeader>
              <CardTitle>Détails de la chambre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <BedDouble className="w-6 h-6 mx-auto text-sky-600 mb-2" />
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-semibold">{roomTypes[room.type]}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <Users className="w-6 h-6 mx-auto text-sky-600 mb-2" />
                  <p className="text-sm text-gray-500">Capacité</p>
                  <p className="font-semibold">{room.capacity} pers.</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <BedDouble className="w-6 h-6 mx-auto text-sky-600 mb-2" />
                  <p className="text-sm text-gray-500">Lits</p>
                  <p className="font-semibold">
                    {room.bedCount} {bedTypes[room.bedType]}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <Euro className="w-6 h-6 mx-auto text-sky-600 mb-2" />
                  <p className="text-sm text-gray-500">Taille</p>
                  <p className="font-semibold">{room.size ? `${room.size} m²` : "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Équipements</CardTitle>
            </CardHeader>
            <CardContent>
              {roomAmenities.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {roomAmenities.map((amenity: { id: string; name: string; icon: string | null; Icon: React.ComponentType<{ className?: string }> } | null) => {
                    if (!amenity) return null
                    const Icon = amenity.Icon || Check
                    return (
                      <div
                        key={amenity.id}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-50 dark:bg-sky-950 rounded-lg"
                      >
                        <Icon className="w-4 h-4 text-sky-600" />
                        <span>{amenity.name}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500">Aucun équipement renseigné</p>
              )}
            </CardContent>
          </Card>

          {/* Seasonal Prices */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tarifs saisonniers</CardTitle>
                <Button size="sm" onClick={() => setIsPriceDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {room.roomPrices.length > 0 ? (
                <div className="space-y-3">
                  {room.roomPrices.map((price) => (
                    <div
                      key={price.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{price.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(price.startDate).toLocaleDateString("fr-FR")} -{" "}
                          {new Date(price.endDate).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sky-600">{formatAmount(price.price)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => handleDeletePrice(price.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Aucun tarif saisonnier</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Tarification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Prix de base</span>
                <span className="text-xl font-bold text-sky-600">{formatAmount(room.basePrice)}</span>
              </div>
              {room.weekendPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Prix weekend</span>
                  <span className="font-semibold">{formatAmount(room.weekendPrice)}</span>
                </div>
              )}
              <p className="text-xs text-gray-400">Par nuit</p>
              
              {/* Extra beds */}
              {room.maxExtraBeds > 0 && (
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <BedDouble className="w-4 h-4 text-sky-600" />
                    <span className="text-gray-600">Lit supplémentaire</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">Max {room.maxExtraBeds} lit(s)</span>
                    <span className="font-medium text-sky-600">
                      {room.extraBedPrice > 0 ? `+${formatAmount(room.extraBedPrice)}/nuit` : "Gratuit"}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Baby bed */}
              {room.babyBedAvailable && (
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Baby className="w-4 h-4 text-pink-600" />
                    <span className="text-gray-600">Lit bébé disponible</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">Sur demande</span>
                    <span className="font-medium text-pink-600">
                      {room.babyBedPrice > 0 ? `+${formatAmount(room.babyBedPrice)}/nuit` : "Gratuit"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Réservations à venir
              </CardTitle>
            </CardHeader>
            <CardContent>
              {room.bookings.length > 0 ? (
                <div className="space-y-3">
                  {room.bookings.map((booking) => (
                    <div key={booking.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="font-medium">
                        {booking.guest.firstName} {booking.guest.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.checkIn).toLocaleDateString("fr-FR")} -{" "}
                        {new Date(booking.checkOut).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Aucune réservation à venir</p>
              )}
            </CardContent>
          </Card>

          {/* Floor */}
          {room.floor && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-gray-500">Étage</p>
                  <p className="text-3xl font-bold">{room.floor}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Price Dialog */}
      <Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un tarif saisonnier</DialogTitle>
            <DialogDescription>
              Définissez un prix spécial pour une période donnée
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="priceName">Nom de la période</Label>
              <Input
                id="priceName"
                value={priceForm.name}
                onChange={(e) => setPriceForm({ ...priceForm, name: e.target.value })}
                placeholder="Ex: Haute saison, Noël..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceAmount">Prix par nuit</Label>
              <Input
                id="priceAmount"
                type="number"
                value={priceForm.price}
                onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })}
                placeholder="150"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={priceForm.startDate}
                  onChange={(e) => setPriceForm({ ...priceForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={priceForm.endDate}
                  onChange={(e) => setPriceForm({ ...priceForm, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsPriceDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-sky-600 hover:bg-sky-700"
              onClick={handleAddPrice}
              disabled={isSavingPrice}
            >
              {isSavingPrice ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Ajouter"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
