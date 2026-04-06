"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  User,
  Lock,
  Palette,
  Save,
  Loader2,
  CheckCircle,
  Upload,
  X,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  email: string
  name: string | null
  firstName: string | null
  lastName: string | null
  phone: string | null
  avatar: string | null
  role: string
  language: string
  theme: string
  createdAt: string
  guestHouse: {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    country: string | null
  } | null
}

export default function ProfileSettingsPage() {
  const { data: session, update: updateSession } = useSession()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    firstName: "",
    lastName: "",
    phone: "",
    language: "fr",
    theme: "system",
  })

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordError, setPasswordError] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/settings/profile")
      const data = await response.json()

      if (response.ok) {
        setProfile(data.user)
        setFormData({
          name: data.user.name || "",
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          phone: data.user.phone || "",
          language: data.user.language || "fr",
          theme: data.user.theme || "system",
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Profil mis à jour avec succès",
        })
        // Update session
        await updateSession()
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
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append("image", file)
      formData.append("type", "avatar")
      formData.append("target", "user")
      formData.append("targetId", profile?.id || "")

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setAvatarUrl(data.image)
        toast({
          title: "Succès",
          description: data.compression
            ? `Photo compressée : ${data.compression.originalSize} → ${data.compression.compressedSize} (-${data.compression.compressionRatio}%)`
            : "Photo de profil mise à jour",
        })
        // Refresh profile
        await fetchProfile()
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
        description: "Impossible de télécharger la photo",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
      e.target.value = ""
    }
  }

  const handleAvatarDelete = async () => {
    setUploadingAvatar(true)
    try {
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: null }),
      })

      if (response.ok) {
        setAvatarUrl(null)
        toast({
          title: "Succès",
          description: "Photo de profil supprimée",
        })
        await fetchProfile()
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la photo",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError("")

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas")
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    try {
      setChangingPassword(true)
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Mot de passe modifié avec succès",
        })
        setShowPasswordDialog(false)
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        setPasswordError(data.error || "Erreur lors du changement de mot de passe")
      }
    } catch (error) {
      setPasswordError("Impossible de changer le mot de passe")
    } finally {
      setChangingPassword(false)
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
            Mon profil
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez vos informations personnelles
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

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="w-4 h-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Palette className="w-4 h-4 mr-2" />
            Préférences
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Avatar Card */}
          <Card>
            <CardHeader>
              <CardTitle>Photo de profil</CardTitle>
              <CardDescription>
                Personnalisez votre avatar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900">
                  {avatarUrl || profile?.avatar ? (
                    <img
                      src={avatarUrl || profile?.avatar || undefined}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingAvatar}
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {avatarUrl || profile?.avatar ? "Changer" : "Télécharger"}
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        disabled={uploadingAvatar}
                        onClick={handleAvatarDelete}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    JPG, PNG, WebP ou GIF — Max 10 Mo (compression auto)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Vos coordonnées et informations de contact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nom d&apos;affichage</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Comment vous souhaitez être appelé"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ""}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    L&apos;email ne peut pas être modifié
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+33 6 00 00 00 00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rôle</Label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm capitalize">
                    {profile?.role}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organization Info */}
          {profile?.guestHouse && (
            <Card>
              <CardHeader>
                <CardTitle>Établissement</CardTitle>
                <CardDescription>
                  Informations sur votre maison d&apos;hôtes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nom</p>
                    <p className="font-medium">{profile.guestHouse.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{profile.guestHouse.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium">{profile.guestHouse.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="font-medium">
                      {[profile.guestHouse.address, profile.guestHouse.city, profile.guestHouse.country]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mot de passe</CardTitle>
              <CardDescription>
                Changez votre mot de passe pour sécuriser votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mot de passe</p>
                  <p className="text-sm text-gray-500">
                    Dernière modification : Non disponible
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                  Changer le mot de passe
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessions actives</CardTitle>
              <CardDescription>
                Gérez vos appareils connectés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Session actuelle</p>
                  <p className="text-sm text-gray-500">Cet appareil</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Langue et région</CardTitle>
              <CardDescription>
                Configurez vos préférences linguistiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Langue</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) =>
                    setFormData({ ...formData, language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Apparence</CardTitle>
              <CardDescription>
                Personnalisez l&apos;apparence de l&apos;application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="theme">Thème</Label>
                <Select
                  value={formData.theme}
                  onValueChange={(value) =>
                    setFormData({ ...formData, theme: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un thème" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription>
              Entrez votre mot de passe actuel et le nouveau mot de passe
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {passwordError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Annuler
            </Button>
            <Button
              className="bg-sky-600 hover:bg-sky-700"
              onClick={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Modification...
                </>
              ) : (
                "Changer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
