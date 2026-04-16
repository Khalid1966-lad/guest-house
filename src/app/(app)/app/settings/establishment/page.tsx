"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useCurrency } from "@/hooks/use-currency"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Building2,
  Clock,
  Globe,
  CreditCard,
  Save,
  Loader2,
  UtensilsCrossed,
  Upload,
  X,
  ImageIcon,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface GuestHouseSettings {
  id: string
  code: string | null
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
  ice: string | null
  taxId: string | null
  cnss: string | null
  currency: string
  timezone: string
  taxRate: number
  plan: string
  settings: {
    checkInTime: string
    checkOutTime: string
    minBookingNotice: number
    maxBookingAdvance: number
    cancellationPolicy: string | null
    emailNotifications: boolean
    smsNotifications: boolean
    restaurantEnabled: boolean
    restaurantOpenTime: string
    restaurantCloseTime: string
  } | null
}

const CURRENCIES = [
  { value: "EUR", label: "Euro (€)" },
  { value: "USD", label: "Dollar ($)" },
  { value: "GBP", label: "Livre (£)" },
  { value: "CHF", label: "Franc suisse (CHF)" },
  { value: "MAD", label: "Dirham marocain (MAD)" },
  { value: "XOF", label: "Franc CFA (XOF)" },
]

const TIMEZONES = [
  { value: "Europe/Paris", label: "Paris (UTC+1/+2)" },
  { value: "Europe/London", label: "Londres (UTC+0/+1)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1/+2)" },
  { value: "Africa/Casablanca", label: "Casablanca (UTC+0/+1)" },
  { value: "America/New_York", label: "New York (UTC-5/-4)" },
]

export default function EstablishmentSettingsPage() {
  const { data: session, update } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [ghCode, setGhCode] = useState<string>("")
  const [logoCompression, setLogoCompression] = useState<{
    originalSize: string
    compressedSize: string
    compressionRatio: number
    dimensions: string
    format: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState("general")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    postalCode: "",
    country: "France",
    phone: "",
    email: "",
    website: "",
    ice: "",
    taxId: "",
    cnss: "",
    currency: "EUR",
    timezone: "Europe/Paris",
    taxRate: "10",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    minBookingNotice: "1",
    maxBookingAdvance: "365",
    cancellationPolicy: "",
    restaurantEnabled: true,
    restaurantOpenTime: "07:00",
    restaurantCloseTime: "22:00",
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/settings/establishment")
      const data = await response.json()

      if (response.ok) {
        const gh = data.guestHouse
        setLogoUrl(gh.logo || null)
        setGhCode(gh.code || "")
        setFormData({
          name: gh.name || "",
          description: gh.description || "",
          address: gh.address || "",
          city: gh.city || "",
          postalCode: gh.postalCode || "",
          country: gh.country || "France",
          phone: gh.phone || "",
          email: gh.email || "",
          website: gh.website || "",
          ice: gh.ice || "",
          taxId: gh.taxId || "",
          cnss: gh.cnss || "",
          currency: gh.currency || "EUR",
          timezone: gh.timezone || "Europe/Paris",
          taxRate: gh.taxRate?.toString() || "10",
          checkInTime: gh.settings?.checkInTime || "15:00",
          checkOutTime: gh.settings?.checkOutTime || "11:00",
          minBookingNotice: gh.settings?.minBookingNotice?.toString() || "1",
          maxBookingAdvance: gh.settings?.maxBookingAdvance?.toString() || "365",
          cancellationPolicy: gh.settings?.cancellationPolicy || "",
          restaurantEnabled: gh.settings?.restaurantEnabled ?? true,
          restaurantOpenTime: gh.settings?.restaurantOpenTime || "07:00",
          restaurantCloseTime: gh.settings?.restaurantCloseTime || "22:00",
        })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (max 10MB - will be compressed server-side)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "Le fichier est trop volumineux. Maximum 10 Mo.",
        variant: "destructive",
      })
      return
    }

    // Validate type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erreur",
        description: "Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.",
        variant: "destructive",
      })
      return
    }

    setUploadingLogo(true)
    setLogoCompression(null)
    try {
      const formData = new FormData()
      formData.append("logo", file)

      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setLogoUrl(data.logo)
        // Show compression info
        if (data.compression) {
          setLogoCompression(data.compression)
        }
        toast({
          title: "Succès",
          description: data.compression
            ? `Logo compressé : ${data.compression.originalSize} → ${data.compression.compressedSize} (-${data.compression.compressionRatio}%)`
            : "Logo mis à jour avec succès",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Erreur",
          description: data.error || "Erreur lors du téléchargement",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le logo",
        variant: "destructive",
      })
    } finally {
      setUploadingLogo(false)
      // Reset the file input
      e.target.value = ""
    }
  }

  const handleLogoDelete = async () => {
    setUploadingLogo(true)
    try {
      const response = await fetch("/api/upload/logo", { method: "DELETE" })

      if (response.ok) {
        setLogoUrl(null)
        setLogoCompression(null)
        toast({
          title: "Succès",
          description: "Logo supprimé",
        })
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le logo",
        variant: "destructive",
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/settings/establishment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          ice: formData.ice || null,
          taxId: formData.taxId || null,
          cnss: formData.cnss || null,
          currency: formData.currency,
          timezone: formData.timezone,
          taxRate: formData.taxRate,
          settings: {
            checkInTime: formData.checkInTime,
            checkOutTime: formData.checkOutTime,
            minBookingNotice: parseInt(formData.minBookingNotice),
            maxBookingAdvance: parseInt(formData.maxBookingAdvance),
            cancellationPolicy: formData.cancellationPolicy,
            restaurantEnabled: formData.restaurantEnabled,
            restaurantOpenTime: formData.restaurantOpenTime,
            restaurantCloseTime: formData.restaurantCloseTime,
          },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Mettre à jour la session avec la nouvelle devise
        if (formData.currency) {
          await update({ guestHouseCurrency: formData.currency })
        }
        toast({
          title: "Succès",
          description: "Paramètres mis à jour avec succès",
        })
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Erreur lors de la mise à jour",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les paramètres",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Paramètres de l&apos;établissement
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configurez les informations de votre maison d&apos;hôtes
          </p>
        </div>
        <Button
          className="bg-sky-600 hover:bg-sky-700"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <Building2 className="w-4 h-4 mr-2" />
            Général
          </TabsTrigger>
          <TabsTrigger value="booking">
            <Clock className="w-4 h-4 mr-2" />
            Réservations
          </TabsTrigger>
          <TabsTrigger value="restaurant">
            <UtensilsCrossed className="w-4 h-4 mr-2" />
            Restaurant
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="w-4 h-4 mr-2" />
            Facturation
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6 mt-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Logo de l&apos;établissement</CardTitle>
              <CardDescription>
                Ce logo apparaîtra sur les factures et documents imprimés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingLogo}
                      onClick={() => document.getElementById("logo-upload")?.click()}
                    >
                      {uploadingLogo ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {logoUrl ? "Changer" : "Télécharger"}
                    </Button>
                    {logoUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        disabled={uploadingLogo}
                        onClick={handleLogoDelete}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    JPG, PNG, WebP ou GIF — Max 10 Mo (compression auto)
                  </p>
                  {logoCompression && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {logoCompression.dimensions} {logoCompression.format.toUpperCase()} — {logoCompression.originalSize} → {logoCompression.compressedSize} (-{logoCompression.compressionRatio}%)
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Les informations de base de votre établissement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l&apos;établissement *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Décrivez votre établissement..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Site web</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adresse</CardTitle>
              <CardDescription>
                L&apos;adresse complète de votre établissement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Régional</CardTitle>
              <CardDescription>
                Paramètres de devise et de fuseau horaire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) =>
                      setFormData({ ...formData, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Tab */}
        <TabsContent value="booking" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Horaires</CardTitle>
              <CardDescription>
                Définissez les heures d&apos;arrivée et de départ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkInTime">Heure d&apos;arrivée</Label>
                  <Input
                    id="checkInTime"
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) =>
                      setFormData({ ...formData, checkInTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOutTime">Heure de départ</Label>
                  <Input
                    id="checkOutTime"
                    type="time"
                    value={formData.checkOutTime}
                    onChange={(e) =>
                      setFormData({ ...formData, checkOutTime: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Règles de réservation</CardTitle>
              <CardDescription>
                Configurez les délais de réservation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minBookingNotice">Préavis minimum (jours)</Label>
                  <Input
                    id="minBookingNotice"
                    type="number"
                    min="0"
                    value={formData.minBookingNotice}
                    onChange={(e) =>
                      setFormData({ ...formData, minBookingNotice: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Nombre de jours minimum avant une réservation
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxBookingAdvance">Réservation max à l&apos;avance (jours)</Label>
                  <Input
                    id="maxBookingAdvance"
                    type="number"
                    min="1"
                    value={formData.maxBookingAdvance}
                    onChange={(e) =>
                      setFormData({ ...formData, maxBookingAdvance: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Nombre de jours maximum à l&apos;avance
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellationPolicy">Politique d&apos;annulation</Label>
                <Textarea
                  id="cancellationPolicy"
                  value={formData.cancellationPolicy}
                  onChange={(e) =>
                    setFormData({ ...formData, cancellationPolicy: e.target.value })
                  }
                  rows={4}
                  placeholder="Décrivez votre politique d'annulation..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Restaurant Tab */}
        <TabsContent value="restaurant" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant</CardTitle>
              <CardDescription>
                Activez et configurez le module restaurant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="restaurantEnabled"
                  checked={formData.restaurantEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, restaurantEnabled: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="restaurantEnabled">Activer le module restaurant</Label>
              </div>

              {formData.restaurantEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="restaurantOpenTime">Heure d&apos;ouverture</Label>
                    <Input
                      id="restaurantOpenTime"
                      type="time"
                      value={formData.restaurantOpenTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          restaurantOpenTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restaurantCloseTime">Heure de fermeture</Label>
                    <Input
                      id="restaurantCloseTime"
                      type="time"
                      value={formData.restaurantCloseTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          restaurantCloseTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Identifiant de l&apos;établissement</CardTitle>
              <CardDescription>
                Code unique utilisé dans la numérotation des factures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-sky-50 dark:bg-sky-950 rounded-lg border border-sky-200 dark:border-sky-800">
                  <span className="font-mono text-lg font-bold text-sky-700 dark:text-sky-300">{ghCode || "—"}</span>
                </div>
                <p className="text-sm text-gray-500">
                  Ce code est généré automatiquement et apparaît dans vos numéros de facture
                  (ex: <span className="font-mono text-xs">FAC-2026-00001/{ghCode || "GH001"}</span>)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taxe de séjour</CardTitle>
              <CardDescription>
                Configurez la taxe de séjour appliquée aux réservations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Taux de taxe de séjour (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.taxRate}
                  onChange={(e) =>
                    setFormData({ ...formData, taxRate: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500">
                  Pourcentage appliqué sur le montant total de la réservation
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identifiants fiscaux et légaux</CardTitle>
              <CardDescription>
                Ces informations apparaîtront dans le pied de page de vos factures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ice">ICE</Label>
                  <Input
                    id="ice"
                    value={formData.ice}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\s/g, '').replace(/\D/g, '')
                      setFormData({ ...formData, ice: val })
                    }}
                    maxLength={15}
                    placeholder="000000000000000"
                    className={formData.ice && formData.ice.length !== 15 ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  <p className="text-xs text-gray-500">
                    Identifiant Commun des Entreprises (15 chiffres)
                  </p>
                  {formData.ice && formData.ice.length !== 15 && (
                    <p className="text-xs text-red-500">
                      L'ICE doit comporter exactement 15 chiffres
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">IF</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) =>
                      setFormData({ ...formData, taxId: e.target.value })
                    }
                    placeholder="00000000000"
                  />
                  <p className="text-xs text-gray-500">
                    Numéro d&apos;Identification Fiscale
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnss">CNSS</Label>
                  <Input
                    id="cnss"
                    value={formData.cnss}
                    onChange={(e) =>
                      setFormData({ ...formData, cnss: e.target.value })
                    }
                    placeholder="00000000000"
                  />
                  <p className="text-xs text-gray-500">
                    Numéro de la Caisse Nationale de Sécurité Sociale
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Abonnement</CardTitle>
              <CardDescription>
                Votre plan actuel et options de facturation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-sky-50 dark:bg-sky-950 rounded-lg">
                <div>
                  <p className="font-semibold text-sky-700 dark:text-sky-300 capitalize">
                    Plan {session?.user?.role === "owner" ? "Pro" : "Standard"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Toutes les fonctionnalités incluses
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Gérer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
