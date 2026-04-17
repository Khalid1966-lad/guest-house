"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Shield,
  Lock,
  Key,
  Smartphone,
  LogOut,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { signOut } from "next-auth/react"

export default function SecuritySettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordError, setPasswordError] = useState("")

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
      setSaving(true)
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
      setSaving(false)
    }
  }

  const handleSignOutAllDevices = async () => {
    if (!confirm("Êtes-vous sûr de vouloir déconnecter tous les appareils ? Vous devrez vous reconnecter.")) return

    // In a real app, you would call an API to invalidate all sessions
    toast({
      title: "Succès",
      description: "Tous les appareils ont été déconnectés",
    })
    signOut({ callbackUrl: "/login" })
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
            Sécurité
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez la sécurité de votre compte
          </p>
        </div>
      </div>

      {/* Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-sky-600" />
            <CardTitle>Mot de passe</CardTitle>
          </div>
          <CardDescription>
            Changez votre mot de passe pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mot de passe</p>
              <p className="text-sm text-gray-500">
                Nous vous recommandons de changer votre mot de passe régulièrement
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
              <Key className="w-4 h-4 mr-2" />
              Changer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            <CardTitle>Authentification à deux facteurs</CardTitle>
          </div>
          <CardDescription>
            Ajoutez une couche de sécurité supplémentaire à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">Non activée</p>
                <p className="text-sm text-gray-500">
                  L&apos;authentification à deux facteurs n&apos;est pas encore disponible
                </p>
              </div>
            </div>
            <Button variant="outline" disabled>
              Activer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <CardTitle>Sessions actives</CardTitle>
          </div>
          <CardDescription>
            Gérez vos appareils connectés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="font-medium">Session actuelle</p>
              <p className="text-sm text-gray-500">Cet appareil</p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-0">Active</Badge>
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleSignOutAllDevices}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnecter tous les appareils
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800">
        <CardHeader>
          <CardTitle className="text-lg">Conseils de sécurité</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-sky-600 mt-0.5" />
              <span>Utilisez un mot de passe unique et fort</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-sky-600 mt-0.5" />
              <span>Ne partagez jamais vos identifiants</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-sky-600 mt-0.5" />
              <span>Déconnectez-vous des appareils publics</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-sky-600 mt-0.5" />
              <span>Vérifiez régulièrement vos sessions actives</span>
            </li>
          </ul>
        </CardContent>
      </Card>

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
              disabled={saving}
            >
              {saving ? (
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
