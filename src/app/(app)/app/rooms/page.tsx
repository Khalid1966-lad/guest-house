"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BedDouble,
  Plus,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Baby,
  Loader2,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Types
interface Amenity {
  id: string
  name: string
  icon: string | null
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
  basePrice: number
  weekendPrice: number | null
  extraBedPrice: number
  babyBedAvailable: boolean
  babyBedPrice: number
  status: string
  amenities: string | null
  images: string | null
  _count?: { bookings: number }
}

// Room types
const roomTypes = [
  { value: "single", label: "Simple" },
  { value: "double", label: "Double" },
  { value: "twin", label: "Twin" },
  { value: "suite", label: "Suite" },
  { value: "family", label: "Familiale" },
  { value: "dormitory", label: "Dortoir" },
]

// Bed types
const bedTypes = [
  { value: "single", label: "Simple" },
  { value: "double", label: "Double" },
  { value: "queen", label: "Queen" },
  { value: "king", label: "King" },
  { value: "bunk", label: "Lit superposé" },
]

// Status
const roomStatuses = [
  { value: "available", label: "Disponible", color: "bg-sky-100 text-sky-700" },
  { value: "occupied", label: "Occupée", color: "bg-blue-100 text-blue-700" },
  { value: "maintenance", label: "Maintenance", color: "bg-yellow-100 text-yellow-700" },
  { value: "out_of_order", label: "Hors service", color: "bg-red-100 text-red-700" },
]

// Default form data
const defaultFormData = {
  number: "",
  name: "",
  description: "",
  floor: "",
  type: "double",
  capacity: "2",
  bedCount: "1",
  bedType: "double",
  size: "",
  maxExtraBeds: "0",
  basePrice: "",
  weekendPrice: "",
  extraBedPrice: "0",
  babyBedAvailable: false,
  babyBedPrice: "0",
  amenities: [] as string[],
  status: "available",
}

// Default amenities (fallback)
const defaultAmenities = [
  { id: "wifi", name: "WiFi", icon: "Wifi" },
  { id: "tv", name: "TV", icon: "Tv" },
  { id: "ac", name: "Climatisation", icon: "Wind" },
  { id: "minibar", name: "Minibar", icon: "Coffee" },
  { id: "safe", name: "Coffre-fort", icon: "Shield" },
  { id: "bathtub", name: "Baignoire", icon: "Bath" },
  { id: "balcony", name: "Balcon", icon: "DoorOpen" },
  { id: "seaview", name: "Vue mer", icon: "Waves" },
  { id: "phone", name: "Téléphone", icon: "Phone" },
  { id: "desk", name: "Bureau", icon: "LampDesk" },
]

export default function RoomsPage() {
  const { data: session, status } = useSession()
  const [rooms, setRooms] = useState<Room[]>([])
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState(defaultFormData)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // Fetch rooms and amenities
  const fetchData = useCallback(async () => {
    const guestHouseId = session?.user?.guestHouseId
    if (!guestHouseId) return

    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (typeFilter !== "all") params.append("type", typeFilter)
      if (search) params.append("search", search)

      const [roomsRes, amenitiesRes] = await Promise.all([
        fetch(`/api/rooms?${params.toString()}`),
        fetch("/api/amenities").catch(() => null),
      ])

      const roomsData = await roomsRes.json()
      
      if (roomsRes.ok) {
        setRooms(roomsData.rooms || [])
      }
      
      // Handle amenities
      if (amenitiesRes && amenitiesRes.ok) {
        const amenitiesData = await amenitiesRes.json()
        // If no amenities, try to seed defaults
        if (amenitiesData.amenities.length === 0) {
          const seedResponse = await fetch("/api/amenities/seed", { method: "POST" })
          if (seedResponse.ok) {
            const refetchResponse = await fetch("/api/amenities")
            const refetchData = await refetchResponse.json()
            setAmenities(refetchData.amenities || defaultAmenities)
          } else {
            setAmenities(defaultAmenities)
          }
        } else {
          setAmenities(amenitiesData.amenities)
        }
      } else {
        setAmenities(defaultAmenities)
      }
    } catch (err) {
      console.error("Erreur chargement:", err)
      // Use default amenities on error
      setAmenities(defaultAmenities)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.guestHouseId, statusFilter, typeFilter, search])

  // Initial load and when filters change
  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") return
    if (session?.user?.guestHouseId) {
      fetchData()
    }
  }, [session?.user?.guestHouseId, status, statusFilter, typeFilter, search, fetchData])

  // Open dialog for new room
  const handleNewRoom = () => {
    setEditingRoom(null)
    setFormData(defaultFormData)
    setError("")
    setIsDialogOpen(true)
  }

  // Open dialog for editing
  const handleEditRoom = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      number: room.number,
      name: room.name || "",
      description: room.description || "",
      floor: room.floor?.toString() || "",
      type: room.type,
      capacity: room.capacity.toString(),
      bedCount: room.bedCount.toString(),
      bedType: room.bedType,
      size: room.size?.toString() || "",
      maxExtraBeds: room.maxExtraBeds?.toString() || "0",
      basePrice: room.basePrice.toString(),
      weekendPrice: room.weekendPrice?.toString() || "",
      extraBedPrice: room.extraBedPrice?.toString() || "0",
      babyBedAvailable: room.babyBedAvailable || false,
      babyBedPrice: room.babyBedPrice?.toString() || "0",
      amenities: room.amenities ? JSON.parse(room.amenities) : [],
      status: room.status,
    })
    setError("")
    setIsDialogOpen(true)
  }

  // Handle form change
  const handleFormChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Toggle amenity
  const toggleAmenity = (amenityId: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((a) => a !== amenityId)
        : [...prev.amenities, amenityId],
    }))
  }

  // Save room
  const handleSaveRoom = async () => {
    setError("")
    
    if (!formData.number || !formData.basePrice) {
      setError("Le numéro et le prix de base sont requis")
      return
    }

    setIsSaving(true)

    try {
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : "/api/rooms"
      const method = editingRoom ? "PUT" : "POST"

      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amenities: JSON.stringify(formData.amenities),
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorMsg = "Erreur lors de la sauvegarde"
        try {
          const errorData = await response.json()
          errorMsg = errorData.error || errorMsg
        } catch (e) {
          // Ignore JSON parse errors
        }
        setError(errorMsg)
        setIsSaving(false)
        return
      }

      // Close dialog first for better UX
      setIsDialogOpen(false)
      setIsSaving(false)
      
      // Refresh data in background
      fetchData()
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("La requête a pris trop de temps")
      } else {
        setError("Une erreur inattendue s'est produite")
      }
      setIsSaving(false)
    }
  }

  // Delete room
  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette chambre ?")) return

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchData()
      }
    } catch (err) {
      console.error("Erreur suppression:", err)
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusInfo = roomStatuses.find((s) => s.value === status)
    return (
      <Badge className={statusInfo?.color || "bg-gray-100 text-gray-700"}>
        {statusInfo?.label || status}
      </Badge>
    )
  }

  // Get type label
  const getTypeLabel = (type: string) => {
    return roomTypes.find((t) => t.value === type)?.label || type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Chambres</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez les chambres de votre établissement
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/settings/amenities">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Équipements
            </Button>
          </Link>
          <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleNewRoom}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une chambre
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher une chambre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {roomStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {roomTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Rooms Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12">
          <BedDouble className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">Aucune chambre</h3>
          <p className="text-gray-500 mb-4">
            Commencez par ajouter votre première chambre
          </p>
          <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleNewRoom}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une chambre
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Room Image Placeholder */}
              <div className="h-40 bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900 dark:to-blue-900 flex items-center justify-center relative">
                <BedDouble className="w-12 h-12 text-sky-400" />
                <div className="absolute top-2 right-2">
                  {getStatusBadge(room.status)}
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Chambre {room.number}
                    </CardTitle>
                    <CardDescription>
                      {room.name || getTypeLabel(room.type)}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditRoom(room)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {room.capacity}
                  </div>
                  <div className="flex items-center gap-1">
                    <BedDouble className="w-4 h-4" />
                    {room.bedCount}
                  </div>
                  {room.maxExtraBeds > 0 && (
                    <div className="flex items-center gap-1 text-sky-600">
                      <Plus className="w-3 h-3" />
                      {room.maxExtraBeds} lit(s)
                    </div>
                  )}
                  {room.babyBedAvailable && (
                    <div className="flex items-center gap-1 text-pink-600">
                      <Baby className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-sky-600">
                    {room.basePrice} €<span className="text-sm font-normal text-gray-500">/nuit</span>
                  </span>
                  {room._count && (
                    <span className="text-xs text-gray-400">
                      {room._count.bookings} réservations
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-900">
                  <th className="text-left p-4 font-medium">Chambre</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Capacité</th>
                  <th className="text-left p-4 font-medium">Suppléments</th>
                  <th className="text-left p-4 font-medium">Prix</th>
                  <th className="text-left p-4 font-medium">Statut</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                          <BedDouble className="w-5 h-5 text-sky-600" />
                        </div>
                        <div>
                          <p className="font-medium">Chambre {room.number}</p>
                          <p className="text-sm text-gray-500">{room.name || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{getTypeLabel(room.type)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        {room.capacity} pers.
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {room.maxExtraBeds > 0 && (
                          <Badge variant="outline" className="text-xs">
                            +{room.maxExtraBeds} lit(s) ({room.extraBedPrice}€)
                          </Badge>
                        )}
                        {room.babyBedAvailable && (
                          <Badge variant="outline" className="text-xs text-pink-600">
                            <Baby className="w-3 h-3 mr-1" />
                            {room.babyBedPrice > 0 ? `${room.babyBedPrice}€` : "Gratuit"}
                          </Badge>
                        )}
                        {!room.maxExtraBeds && !room.babyBedAvailable && "-"}
                      </div>
                    </td>
                    <td className="p-4 font-medium">{room.basePrice} €</td>
                    <td className="p-4">{getStatusBadge(room.status)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditRoom(room)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-600"
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? "Modifier la chambre" : "Ajouter une chambre"}
            </DialogTitle>
            <DialogDescription>
              {editingRoom
                ? "Modifiez les informations de la chambre"
                : "Remplissez les informations pour créer une nouvelle chambre"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Numéro *</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => handleFormChange("number", e.target.value)}
                  placeholder="101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nom (optionnel)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  placeholder="Chambre Rose"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                placeholder="Description de la chambre..."
                rows={2}
              />
            </div>

            {/* Room Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(v) => handleFormChange("type", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacité</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => handleFormChange("capacity", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedCount">Nb. lits</Label>
                <Input
                  id="bedCount"
                  type="number"
                  min="1"
                  value={formData.bedCount}
                  onChange={(e) => handleFormChange("bedCount", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedType">Type de lit</Label>
                <Select value={formData.bedType} onValueChange={(v) => handleFormChange("bedType", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bedTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Étage</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => handleFormChange("floor", e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Surface (m²)</Label>
                <Input
                  id="size"
                  type="number"
                  value={formData.size}
                  onChange={(e) => handleFormChange("size", e.target.value)}
                  placeholder="25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxExtraBeds">Max lits sup.</Label>
                <Input
                  id="maxExtraBeds"
                  type="number"
                  min="0"
                  value={formData.maxExtraBeds}
                  onChange={(e) => handleFormChange("maxExtraBeds", e.target.value)}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="font-medium">Tarification</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Prix de base (€) *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => handleFormChange("basePrice", e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekendPrice">Prix weekend (€)</Label>
                  <Input
                    id="weekendPrice"
                    type="number"
                    step="0.01"
                    value={formData.weekendPrice}
                    onChange={(e) => handleFormChange("weekendPrice", e.target.value)}
                    placeholder="120"
                  />
                </div>
              </div>
              
              {/* Extra bed pricing */}
              {parseInt(formData.maxExtraBeds) > 0 && (
                <div className="p-4 bg-sky-50 dark:bg-sky-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <BedDouble className="w-4 h-4 text-sky-600" />
                    <Label>Supplément lit supplémentaire</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="extraBedPrice">Prix par lit supplémentaire (€/nuit)</Label>
                    <Input
                      id="extraBedPrice"
                      type="number"
                      step="0.01"
                      value={formData.extraBedPrice}
                      onChange={(e) => handleFormChange("extraBedPrice", e.target.value)}
                      placeholder="20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Baby bed */}
            <div className="p-4 bg-pink-50 dark:bg-pink-950 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Baby className="w-4 h-4 text-pink-600" />
                  <Label>Lit bébé disponible</Label>
                </div>
                <Switch
                  checked={formData.babyBedAvailable}
                  onCheckedChange={(checked) => handleFormChange("babyBedAvailable", checked)}
                />
              </div>
              {formData.babyBedAvailable && (
                <div className="space-y-2">
                  <Label htmlFor="babyBedPrice">Supplément lit bébé (€/nuit)</Label>
                  <Input
                    id="babyBedPrice"
                    type="number"
                    step="0.01"
                    value={formData.babyBedPrice}
                    onChange={(e) => handleFormChange("babyBedPrice", e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500">Mettez 0 pour gratuit</p>
                </div>
              )}
            </div>

            {/* Status (only for editing) */}
            {editingRoom && (
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={formData.status} onValueChange={(v) => handleFormChange("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Amenities */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Équipements</Label>
                <Link href="/app/settings/amenities" className="text-sm text-sky-600 hover:underline">
                  Personnaliser
                </Link>
              </div>
              {amenities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <Button
                      key={amenity.id}
                      type="button"
                      variant={formData.amenities.includes(amenity.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAmenity(amenity.id)}
                      className={cn(
                        formData.amenities.includes(amenity.id) && "bg-sky-600 hover:bg-sky-700"
                      )}
                    >
                      {amenity.name}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Aucun équipement configuré.{" "}
                  <Link href="/app/settings/amenities" className="text-sky-600 hover:underline">
                    Ajouter des équipements
                  </Link>
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-sky-600 hover:bg-sky-700" 
              onClick={handleSaveRoom}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                editingRoom ? "Modifier" : "Créer"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
