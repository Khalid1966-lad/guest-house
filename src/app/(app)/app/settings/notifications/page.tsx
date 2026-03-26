"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Loader2,
  Save,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  emailNewBooking: boolean
  emailCheckIn: boolean
  emailCheckOut: boolean
  emailPaymentReceived: boolean
  emailInvoiceGenerated: boolean
  smsNewBooking: boolean
  smsCheckIn: boolean
  smsCheckOut: boolean
}

export default function NotificationsSettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    emailNewBooking: true,
    emailCheckIn: true,
    emailCheckOut: true,
    emailPaymentReceived: true,
    emailInvoiceGenerated: true,
    smsNewBooking: false,
    smsCheckIn: false,
    smsCheckOut: false,
  })

  useEffect(() => {
    fetchSettings()
  }, [session])

  const fetchSettings = async () => {
    if (!session?.user?.guestHouseId) return
    
    try {
      setLoading(true)
      const response = await fetch("/api/settings/establishment")
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings({
            emailNotifications: data.settings.emailNotifications ?? true,
            smsNotifications: data.settings.smsNotifications ?? false,
            emailNewBooking: data.settings.emailNewBooking ?? true,
            emailCheckIn: data.settings.emailCheckIn ?? true,
            emailCheckOut: data.settings.emailCheckOut ?? true,
            emailPaymentReceived: true,
            emailInvoiceGenerated: true,
            smsNewBooking: false,
            smsCheckIn: false,
            smsCheckOut: false,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!session?.user?.guestHouseId) return

    try {
      setSaving(true)
      const response = await fetch("/api/settings/establishment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Paramètres de notification enregistrés",
        })
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'enregistrer les paramètres",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
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
            Notifications
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez vos préférences de notifications
          </p>
        </div>
        <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleSave} disabled={saving}>
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

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-sky-600" />
            <CardTitle>Notifications par email</CardTitle>
          </div>
          <CardDescription>
            Recevez des notifications par email pour les événements importants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Activer les emails</Label>
              <p className="text-sm text-gray-500">
                Recevoir des notifications par email
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Événements</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Nouvelle réservation</Label>
                <p className="text-sm text-gray-500">
                  Email lors d&apos;une nouvelle réservation
                </p>
              </div>
              <Switch
                checked={settings.emailNewBooking}
                onCheckedChange={(checked) => updateSetting("emailNewBooking", checked)}
                disabled={!settings.emailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Check-in</Label>
                <p className="text-sm text-gray-500">
                  Email lors d&apos;un check-in
                </p>
              </div>
              <Switch
                checked={settings.emailCheckIn}
                onCheckedChange={(checked) => updateSetting("emailCheckIn", checked)}
                disabled={!settings.emailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Check-out</Label>
                <p className="text-sm text-gray-500">
                  Email lors d&apos;un check-out
                </p>
              </div>
              <Switch
                checked={settings.emailCheckOut}
                onCheckedChange={(checked) => updateSetting("emailCheckOut", checked)}
                disabled={!settings.emailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Paiement reçu</Label>
                <p className="text-sm text-gray-500">
                  Email lors de la réception d&apos;un paiement
                </p>
              </div>
              <Switch
                checked={settings.emailPaymentReceived}
                onCheckedChange={(checked) => updateSetting("emailPaymentReceived", checked)}
                disabled={!settings.emailNotifications}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            <CardTitle>Notifications SMS</CardTitle>
          </div>
          <CardDescription>
            Recevez des notifications par SMS (nécessite une configuration supplémentaire)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Activer les SMS</Label>
              <p className="text-sm text-gray-500">
                Recevoir des notifications par SMS
              </p>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={(checked) => updateSetting("smsNotifications", checked)}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Événements</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Nouvelle réservation</Label>
                <p className="text-sm text-gray-500">
                  SMS lors d&apos;une nouvelle réservation
                </p>
              </div>
              <Switch
                checked={settings.smsNewBooking}
                onCheckedChange={(checked) => updateSetting("smsNewBooking", checked)}
                disabled={!settings.smsNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Check-in</Label>
                <p className="text-sm text-gray-500">
                  SMS lors d&apos;un check-in
                </p>
              </div>
              <Switch
                checked={settings.smsCheckIn}
                onCheckedChange={(checked) => updateSetting("smsCheckIn", checked)}
                disabled={!settings.smsNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Check-out</Label>
                <p className="text-sm text-gray-500">
                  SMS lors d&apos;un check-out
                </p>
              </div>
              <Switch
                checked={settings.smsCheckOut}
                onCheckedChange={(checked) => updateSetting("smsCheckOut", checked)}
                disabled={!settings.smsNotifications}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
