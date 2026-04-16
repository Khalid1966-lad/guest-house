"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  Loader2,
  Save,
  Trash2,
  Trash,
  CalendarDays,
  LogIn,
  LogOut,
  XCircle,
  Receipt,
  CreditCard,
  UtensilsCrossed,
  Info,
  CheckCheck,
  Inbox,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

// ─── Types ────────────────────────────────────────────────────────────────

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

interface AppNotification {
  id: string
  type: string
  title: string
  message: string
  entityType?: string | null
  entityId?: string | null
  isRead: boolean
  createdAt: string
}

// ─── Icon by notification type ────────────────────────────────────────────

function getNotificationIcon(type: string) {
  switch (type) {
    case "new_booking":
    case "booking_updated":
      return <CalendarDays className="h-4 w-4 text-sky-500" />
    case "check_in":
      return <LogIn className="h-4 w-4 text-emerald-500" />
    case "check_out":
      return <LogOut className="h-4 w-4 text-amber-500" />
    case "booking_cancelled":
      return <XCircle className="h-4 w-4 text-red-500" />
    case "new_invoice":
      return <Receipt className="h-4 w-4 text-violet-500" />
    case "invoice_paid":
    case "payment_received":
      return <CreditCard className="h-4 w-4 text-green-500" />
    case "new_restaurant_order":
      return <UtensilsCrossed className="h-4 w-4 text-orange-500" />
    default:
      return <Info className="h-4 w-4 text-gray-500" />
  }
}

// ─── Component ────────────────────────────────────────────────────────────

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

  // Notifications management state
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false)
  const [isDeleteOneDialogOpen, setIsDeleteOneDialogOpen] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState<AppNotification | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchNotifications()
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

  const fetchNotifications = async () => {
    if (!session?.user?.guestHouseId) return
    try {
      setNotificationsLoading(true)
      const res = await fetch("/api/notifications?limit=50")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch {
      // silently fail
    } finally {
      setNotificationsLoading(false)
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

  const handleDeleteOne = async () => {
    if (!notificationToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/notifications/${notificationToDelete.id}`, { method: "DELETE" })
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationToDelete.id))
        toast({ title: "Notification supprimée", description: "La notification a été supprimée avec succès." })
      }
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer la notification", variant: "destructive" })
    } finally {
      setDeleting(false)
      setIsDeleteOneDialogOpen(false)
      setNotificationToDelete(null)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast({ title: "Succès", description: "Toutes les notifications ont été marquées comme lues" })
    } catch {
      toast({ title: "Erreur", description: "Impossible de marquer toutes les notifications", variant: "destructive" })
    }
  }

  const handleDeleteAll = async () => {
    setDeleting(true)
    try {
      const res = await fetch("/api/notifications/delete-all", { method: "DELETE" })
      if (res.ok) {
        setNotifications([])
        toast({ title: "Succès", description: "Toutes les notifications ont été supprimées" })
      }
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer les notifications", variant: "destructive" })
    } finally {
      setDeleting(false)
      setIsDeleteAllDialogOpen(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

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
            Gérez vos préférences et historique de notifications
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

      {/* ─── Notification History ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-sky-600" />
              <CardTitle>Historique des notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-1.5 text-xs">
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tout lire
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteAllDialogOpen(true)}
                  className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash className="w-3.5 h-3.5" />
                  Tout supprimer
                </Button>
              )}
            </div>
          </div>
          <CardDescription>
            {notifications.length} notification{notifications.length > 1 ? "s" : ""} au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notificationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Inbox className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Aucune notification</p>
              <p className="text-xs mt-1">Les nouvelles notifications apparaîtront ici</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96 overflow-y-auto">
              <div className="divide-y rounded-lg border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                      !notification.isRead && "bg-sky-50/50 dark:bg-sky-950/20"
                    )}
                  >
                    {/* Unread dot */}
                    {!notification.isRead && (
                      <div className="mt-2 w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                    )}

                    {/* Icon */}
                    <div className={cn(
                      "mt-0.5 flex-shrink-0 rounded-full p-1.5 bg-gray-100 dark:bg-gray-800",
                      !notification.isRead && "bg-sky-100 dark:bg-sky-900/40"
                    )}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm truncate",
                          !notification.isRead ? "font-semibold text-gray-900 dark:text-gray-100" : "font-medium text-gray-700 dark:text-gray-300"
                        )}>
                          {notification.title}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
                      </p>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => {
                        setNotificationToDelete(notification)
                        setIsDeleteOneDialogOpen(true)
                      }}
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* ─── Email Notifications ──────────────────────────────────────── */}
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

      {/* ─── SMS Notifications ─────────────────────────────────────────── */}
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

      {/* ─── Delete One Dialog ─────────────────────────────────────────── */}
      <AlertDialog open={isDeleteOneDialogOpen} onOpenChange={setIsDeleteOneDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette notification</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la notification{" "}
              <strong>&quot;{notificationToDelete?.title}&quot;</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOne}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete All Dialog ─────────────────────────────────────────── */}
      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer toutes les notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer les <strong>{notifications.length}</strong> notification{notifications.length > 1 ? "s" : ""} ?
              Cette action est irréversible et supprimera définitivement tout l&apos;historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash className="w-4 h-4 mr-2" />
                  Tout supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
