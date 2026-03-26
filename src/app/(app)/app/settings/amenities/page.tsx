"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Plus,
  Trash2,
  Loader2,
  GripVertical,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

interface Amenity {
  id: string
  name: string
  icon: string | null
  description: string | null
  sortOrder: number
}

// Available icons
const availableIcons = [
  { value: "Wifi", label: "WiFi" },
  { value: "Tv", label: "TV" },
  { value: "Wind", label: "Climatisation" },
  { value: "Coffee", label: "Café/Minibar" },
  { value: "Shield", label: "Sécurité" },
  { value: "Bath", label: "Baignoire" },
  { value: "Droplets", label: "Douche" },
  { value: "Toilet", label: "Toilettes" },
  { value: "DoorOpen", label: "Porte/Balcon" },
  { value: "Waves", label: "Vue mer" },
  { value: "Phone", label: "Téléphone" },
  { value: "LampDesk", label: "Bureau" },
  { value: "Sun", label: "Soleil" },
  { value: "Car", label: "Parking" },
  { value: "Utensils", label: "Cuisine" },
  { value: "Heart", label: "Cœur" },
  { value: "Star", label: "Étoile" },
  { value: "Flame", label: "Chauffage" },
  { value: "Snowflake", label: "Climatisation" },
  { value: "Shirt", label: "Fer à repasser" },
]

export default function AmenitiesSettingsPage() {
  const { data: session } = useSession()
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null)
  const [formData, setFormData] = useState({ name: "", icon: "", description: "" })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // Fetch amenities
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const response = await fetch("/api/amenities")
        const data = await response.json()
        if (response.ok) {
          // If no amenities, try to seed defaults
          if (data.amenities.length === 0) {
            const seedResponse = await fetch("/api/amenities/seed", { method: "POST" })
            if (seedResponse.ok) {
              const seedData = await seedResponse.json()
              if (seedData.seeded) {
                // Refetch after seeding
                const refetchResponse = await fetch("/api/amenities")
                const refetchData = await refetchResponse.json()
                if (refetchResponse.ok) {
                  setAmenities(refetchData.amenities)
                }
              }
            }
          } else {
            setAmenities(data.amenities)
          }
        }
      } catch (err) {
        console.error("Erreur chargement équipements:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.guestHouseId) {
      fetchAmenities()
    }
  }, [session])

  // Open dialog for new amenity
  const handleNewAmenity = () => {
    setEditingAmenity(null)
    setFormData({ name: "", icon: "", description: "" })
    setError("")
    setIsDialogOpen(true)
  }

  // Open dialog for editing
  const handleEditAmenity = (amenity: Amenity) => {
    setEditingAmenity(amenity)
    setFormData({
      name: amenity.name,
      icon: amenity.icon || "",
      description: amenity.description || "",
    })
    setError("")
    setIsDialogOpen(true)
  }

  // Save amenity
  const handleSaveAmenity = async () => {
    setError("")
    
    if (!formData.name.trim()) {
      setError("Le nom est requis")
      return
    }

    setIsSaving(true)

    try {
      const url = editingAmenity ? `/api/amenities/${editingAmenity.id}` : "/api/amenities"
      const method = editingAmenity ? "PUT" : "POST"

      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      
      // Refresh list in background
      fetch("/api/amenities")
        .then((res) => res.json())
        .then((data) => {
          if (data.amenities) {
            setAmenities(data.amenities)
          }
        })
        .catch((e) => console.error("Failed to refresh amenities:", e))
        
    } catch (err: unknown) {
      console.error("Save amenity error:", err)
      if (err instanceof Error && err.name === "AbortError") {
        setError("La requête a pris trop de temps")
      } else {
        setError("Une erreur inattendue s'est produite")
      }
      setIsSaving(false)
    }
  }

  // Delete amenity
  const handleDeleteAmenity = async (amenityId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet équipement ?")) return

    try {
      const response = await fetch(`/api/amenities/${amenityId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setAmenities((prev) => prev.filter((a) => a.id !== amenityId))
      }
    } catch (err) {
      console.error("Erreur suppression:", err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/rooms">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Équipements</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez les équipements disponibles pour vos chambres
          </p>
        </div>
        <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleNewAmenity}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800">
        <CardContent className="pt-4">
          <p className="text-sm text-sky-700 dark:text-sky-300">
            Les équipements configurés ici seront disponibles pour toutes vos chambres. 
            Vous pourrez les sélectionner lors de la création ou modification d'une chambre.
          </p>
        </CardContent>
      </Card>

      {/* Amenities List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des équipements</CardTitle>
          <CardDescription>
            {amenities.length} équipement{amenities.length > 1 ? "s" : ""} configuré{amenities.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
            </div>
          ) : amenities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Aucun équipement configuré</p>
              <Button onClick={handleNewAmenity}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un équipement
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {amenities.map((amenity) => (
                <div
                  key={amenity.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                    <div>
                      <p className="font-medium">{amenity.name}</p>
                      {amenity.description && (
                        <p className="text-sm text-gray-500">{amenity.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {amenity.icon && (
                      <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded">
                        {amenity.icon}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAmenity(amenity)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteAmenity(amenity.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAmenity ? "Modifier l'équipement" : "Ajouter un équipement"}
            </DialogTitle>
            <DialogDescription>
              Configurez un nouvel équipement pour vos chambres
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: WiFi, Climatisation..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icône (optionnel)</Label>
              <select
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Sélectionner une icône</option>
                {availableIcons.map((icon) => (
                  <option key={icon.value} value={icon.value}>
                    {icon.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                L'icône sera affichée à côté du nom de l'équipement
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description courte de l'équipement"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-sky-600 hover:bg-sky-700"
              onClick={handleSaveAmenity}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                editingAmenity ? "Modifier" : "Ajouter"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
