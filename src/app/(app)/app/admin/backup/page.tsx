"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Database,
  Download,
  Upload,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileJson,
  HardDrive,
  Clock,
  Info,
  RefreshCcw,
} from "lucide-react"

interface BackupMeta {
  version: string
  exportedAt: string
  exportedBy: string
  totalRecords: number
  modelStats: Record<string, number>
  databaseType: string
}

interface BackupFile {
  meta: BackupMeta
  data: Record<string, unknown[]>
}

interface RestoreStats {
  totalRecordsRestored: number
  byModel: Record<string, number>
  backupInfo: {
    originalExportDate: string
    originalRecordCount: number
  }
}

export default function BackupPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [restoreProgress, setRestoreProgress] = useState(0)

  // Dialogs
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showResetConfirmDialog, setShowResetConfirmDialog] = useState(false)

  // Restore data
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [backupPreview, setBackupPreview] = useState<BackupFile | null>(null)
  const [restoreStats, setRestoreStats] = useState<RestoreStats | null>(null)

  // Check super_admin
  if (!session || session.user.role !== "super_admin") {
    router.push("/login")
    return null
  }

  // ============================================
  // EXPORT (Sauvegarde)
  // ============================================
  const handleExport = async () => {
    setIsExporting(true)
    setError("")
    try {
      const response = await fetch("/api/admin/backup")
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de l'export")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `pms-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess("Sauvegarde téléchargée avec succès")
      setTimeout(() => setSuccess(""), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'export")
    } finally {
      setIsExporting(false)
    }
  }

  // ============================================
  // IMPORT (Restauration) - Étape 1 : sélection du fichier
  // ============================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".json")) {
      setError("Veuillez sélectionner un fichier JSON")
      return
    }

    setSelectedFile(file)
    setError("")
    setRestoreStats(null)

    // Prévisualiser le contenu du fichier
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = JSON.parse(event.target?.result as string)
        if (content.meta && content.data) {
          setBackupPreview(content)
          setShowRestoreDialog(true)
        } else {
          setError("Format de fichier invalide. Le fichier doit contenir 'meta' et 'data'.")
        }
      } catch {
        setError("Impossible de lire le fichier. Vérifiez qu'il s'agit d'un JSON valide.")
      }
    }
    reader.readAsText(file)
  }

  // ============================================
  // IMPORT (Restauration) - Étape 2 : confirmation et envoi
  // ============================================
  const handleRestore = async () => {
    if (!selectedFile || !backupPreview) return

    setIsRestoring(true)
    setRestoreProgress(10)
    setError("")

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          setRestoreProgress(30)
          const content = JSON.parse(event.target?.result as string)

          setRestoreProgress(50)
          const response = await fetch("/api/admin/backup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...content,
              options: {
                confirm: true,
                skipAuthTables: true,
                skipAuditLogs: false,
              },
            }),
          })

          setRestoreProgress(80)

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || "Erreur lors de la restauration")
          }

          const result = await response.json()
          setRestoreProgress(100)
          setRestoreStats(result.stats)
          setSuccess(`Restauration terminée ! ${result.stats.totalRecordsRestored} enregistrements restaurés.`)
          setShowRestoreDialog(false)
          setSelectedFile(null)
          setBackupPreview(null)
          setTimeout(() => setSuccess(""), 6000)
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erreur lors de la restauration")
          setRestoreProgress(0)
        } finally {
          setIsRestoring(false)
        }
      }
      reader.readAsText(selectedFile)
    } catch {
      setIsRestoring(false)
      setError("Erreur de lecture du fichier")
    }
  }

  // ============================================
  // RESET (Réinitialisation complète)
  // ============================================
  const handleReset = async () => {
    setIsResetting(true)
    setError("")
    setShowResetConfirmDialog(false)
    try {
      const response = await fetch("/api/admin/backup?confirm=true", {
        method: "DELETE",
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la réinitialisation")
      }
      const result = await response.json()
      setSuccess(`${result.message}`)
      setRestoreStats(null)
      setTimeout(() => setSuccess(""), 6000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la réinitialisation")
    } finally {
      setIsResetting(false)
    }
  }

  const modelLabels: Record<string, string> = {
    guestHouse: "Maisons d'hôtes",
    guestHouseSetting: "Paramètres GH",
    user: "Utilisateurs",
    role: "Rôles",
    amenity: "Équipements",
    room: "Chambres",
    roomPrice: "Prix chambres",
    guest: "Clients",
    menuItem: "Articles menu",
    booking: "Réservations",
    invoice: "Factures",
    invoiceItem: "Lignes facture",
    payment: "Paiements",
    restaurantOrder: "Commandes rest.",
    orderItem: "Lignes commande",
    expense: "Dépenses",
    auditLog: "Logs d'audit",
    account: "Comptes (auth)",
    verificationToken: "Tokens (auth)",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6 text-violet-600" />
          Sauvegarde & Restauration
        </h1>
        <p className="text-gray-500 mt-1">
          Gérez les sauvegardes manuelles de votre base de données. Exportez, importez ou réinitialisez l'intégralité des données.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============================================
            SAUVEGARDE (EXPORT)
            ============================================ */}
        <Card className="border-violet-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Download className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p>Sauvegarder la base</p>
                <p className="text-sm font-normal text-gray-500">Exporter toutes les données en JSON</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Téléchargez une copie complète de toutes les données de la base de données. 
              Cette sauvegarde contient toutes les maisons d'hôtes, leurs utilisateurs, 
              réservations, factures, et toutes les données associées.
            </p>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800 space-y-1">
                  <p className="font-medium">Informations sur la sauvegarde</p>
                  <ul className="list-disc pl-4 text-xs space-y-0.5 text-blue-700">
                    <li>Les mots de passe sont exportés (hashés avec bcrypt)</li>
                    <li>Les sessions actives ne sont pas incluses</li>
                    <li>Le fichier peut être volumineux selon la quantité de données</li>
                    <li>Conservez ce fichier en lieu sûr</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-violet-600 hover:bg-violet-700"
              size="lg"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger la sauvegarde
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ============================================
            RESTAURATION (IMPORT)
            ============================================ */}
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Upload className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p>Restaurer la base</p>
                <p className="text-sm font-normal text-gray-500">Importer un fichier de sauvegarde</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Restaurez la base de données à partir d&apos;un fichier de sauvegarde précédemment exporté. 
              <span className="font-medium text-red-600"> Cette action écrasera toutes les données actuelles.</span>
            </p>

            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <div className="text-sm text-red-800 space-y-1">
                  <p className="font-medium">Attention</p>
                  <ul className="list-disc pl-4 text-xs space-y-0.5 text-red-700">
                    <li>Toutes les données actuelles seront supprimées avant la restauration</li>
                    <li>Cette action est irréversible</li>
                    <li>Assurez-vous d&apos;avoir fait une sauvegarde avant de restaurer</li>
                    <li>Les tables d&apos;authentification (sessions) ne seront pas restaurées</li>
                  </ul>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelect}
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full border-amber-300 text-amber-800 hover:bg-amber-50"
              size="lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              Sélectionner un fichier de sauvegarde
            </Button>

            {selectedFile && !showRestoreDialog && (
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 text-sm">
                <FileJson className="h-4 w-4 text-gray-400" />
                <span className="truncate">{selectedFile.name}</span>
                <span className="text-gray-400 text-xs">
                  ({(selectedFile.size / 1024).toFixed(1)} Ko)
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          RÉINITIALISATION COMPLÈTE
          ============================================ */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p>Réinitialisation complète</p>
              <p className="text-sm font-normal text-gray-500">Supprimer toutes les données</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Supprimez toutes les données de la base de données (maisons d&apos;hôtes, utilisateurs, 
            réservations, etc.). Seul le compte super admin sera conservé. 
            <span className="font-semibold text-red-600"> Cette action est définitive et irréversible.</span>
          </p>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowResetDialog(true)}
              variant="destructive"
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Réinitialiser la base de données
                </>
              )}
            </Button>
            <span className="text-xs text-gray-400">Cette action ne peut pas être annulée</span>
          </div>
        </CardContent>
      </Card>

      {/* ============================================
          STATISTIQUES DE RESTAURATION
          ============================================ */}
      {restoreStats && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Résultat de la restauration
            </CardTitle>
            <CardDescription>
              Sauvegarde originale du {new Date(restoreStats.backupInfo.originalExportDate).toLocaleString("fr-FR")}
              {" — "}
              {restoreStats.backupInfo.originalRecordCount} enregistrements dans le fichier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-200">
                <span className="font-medium text-green-800">Total restauré</span>
                <Badge className="bg-green-100 text-green-800 border-green-300" variant="outline">
                  {restoreStats.totalRecordsRestored} enregistrements
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Object.entries(restoreStats.byModel)
                  .filter(([, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([model, count]) => (
                    <div key={model} className="flex justify-between items-center p-2 rounded bg-gray-50 text-sm">
                      <span className="text-gray-600">{modelLabels[model] || model}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barre de progression restauration */}
      {(isRestoring || restoreProgress > 0) && restoreProgress < 100 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <RefreshCcw className={`h-3 w-3 ${isRestoring ? "animate-spin" : ""}`} />
              Restauration en cours...
            </span>
            <span className="font-medium">{restoreProgress}%</span>
          </div>
          <Progress value={restoreProgress} className="h-2" />
        </div>
      )}

      {/* ============================================
          DIALOG - Prévisualisation Restauration
          ============================================ */}
      <Dialog open={showRestoreDialog} onOpenChange={(open) => {
        if (!open) {
          setShowRestoreDialog(false)
          setSelectedFile(null)
          setBackupPreview(null)
          if (fileInputRef.current) fileInputRef.current.value = ""
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-amber-600" />
              Confirmer la restauration
            </DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de restaurer la base de données. Toutes les données actuelles seront remplacées.
            </DialogDescription>
          </DialogHeader>

          {backupPreview && (
            <div className="space-y-4 py-2">
              {/* Informations du fichier */}
              <div className="p-3 rounded-lg bg-gray-50 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileJson className="h-4 w-4 text-gray-500" />
                  {selectedFile?.name}
                  <span className="text-gray-400 text-xs">
                    ({(selectedFile?.size || 0 / 1024).toFixed(1)} Ko)
                  </span>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="h-3 w-3" />
                    Exporté le :
                  </div>
                  <div>
                    {new Date(backupPreview.meta.exportedAt).toLocaleString("fr-FR")}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <HardDrive className="h-3 w-3" />
                    Version :
                  </div>
                  <div>{backupPreview.meta.version}</div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Database className="h-3 w-3" />
                    Total :
                  </div>
                  <div className="font-semibold">{backupPreview.meta.totalRecords} enregistrements</div>
                </div>
              </div>

              {/* Détail par modèle */}
              <div className="max-h-48 overflow-y-auto space-y-1">
                <p className="text-xs font-medium text-gray-500 mb-2">Contenu de la sauvegarde :</p>
                {Object.entries(backupPreview.meta.modelStats || {})
                  .filter(([, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([model, count]) => (
                    <div key={model} className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50 text-sm">
                      <span className="text-gray-600">{modelLabels[model] || model}</span>
                      <Badge variant="secondary" className="text-xs">{count}</Badge>
                    </div>
                  ))}
              </div>

              {/* Avertissement final */}
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Action irréversible
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Toutes les données actuelles seront définitivement remplacées par le contenu de cette sauvegarde.
                  Il est recommandé de faire une sauvegarde avant de continuer.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRestoreDialog(false)
                setSelectedFile(null)
                setBackupPreview(null)
                if (fileInputRef.current) fileInputRef.current.value = ""
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRestore}
              disabled={isRestoring}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restauration...
                </>
              ) : (
                <>
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Restaurer la sauvegarde
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          DIALOG - Confirmation Reset
          ============================================ */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Réinitialisation complète de la base
            </DialogTitle>
            <DialogDescription>
              Cette action supprimera définitivement toutes les données de la base.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <div className="text-sm text-red-800 space-y-1">
                  <p className="font-medium">Ce qui sera supprimé :</p>
                  <ul className="list-disc pl-4 text-xs space-y-0.5 text-red-700">
                    <li>Toutes les maisons d&apos;hôtes et leurs paramètres</li>
                    <li>Tous les utilisateurs (sauf le super admin)</li>
                    <li>Toutes les réservations, clients et factures</li>
                    <li>Tous les articles de restaurant et commandes</li>
                    <li>Toutes les dépenses et logs d&apos;audit</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 border">
              <p className="text-sm text-gray-700">
                Tapez <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">CONFIRMER</span> pour continuer :
              </p>
              <input
                id="reset-confirm-input"
                type="text"
                className="mt-2 w-full px-3 py-2 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                placeholder="CONFIRMER"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const input = document.getElementById("reset-confirm-input") as HTMLInputElement
                if (input?.value === "CONFIRMER") {
                  setShowResetConfirmDialog(true)
                  setShowResetDialog(false)
                } else {
                  setError('Veuillez taper "CONFIRMER" pour continuer')
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          DIALOG - Confirmation finale Reset
          ============================================ */}
      <Dialog open={showResetConfirmDialog} onOpenChange={setShowResetConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Dernière confirmation
            </DialogTitle>
            <DialogDescription>
              Êtes-vous absolument certain de vouloir supprimer toutes les données ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowResetConfirmDialog(false)}>
              Annuler (garder les données)
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Oui, tout supprimer définitivement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
