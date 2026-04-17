"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Database,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  HardDrive,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Building2,
  ArrowLeft,
  Clock,
  Tag,
  FileArchive,
  Shield,
  Info,
  X,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────

interface BackupItem {
  id: string
  label: string | null
  type: "manual" | "auto"
  sizeKo: number
  tableCount: number
  tableSummary: Record<string, number>
  guestHouseList: { id: string; name: string; slug: string }[]
  createdBy: string
  createdAt: string
}

const tableLabels: Record<string, string> = {
  GuestHouse: "Maisons d'hôtes",
  GuestHouseSetting: "Paramètres",
  User: "Utilisateurs",
  Role: "Rôles",
  Room: "Chambres",
  RoomPrice: "Tarifs chambre",
  Amenity: "Équipements",
  Guest: "Clients",
  Booking: "Réservations",
  Invoice: "Factures",
  InvoiceItem: "Lignes facture",
  Payment: "Paiements",
  MenuItem: "Articles menu",
  RestaurantOrder: "Commandes rest.",
  OrderItem: "Lignes commande",
  Expense: "Dépenses",
  CleaningTask: "Tâches ménage",
  CleaningTaskItem: "Points contrôle",
  Notification: "Notifications",
  AuditLog: "Logs audit",
}

function formatSize(ko: number): string {
  if (ko < 1024) return `${ko} Ko`
  return `${(ko / 1024).toFixed(1)} Mo`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ─── Component ────────────────────────────────────────────────

export default function AdminBackupPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [backups, setBackups] = useState<BackupItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Create backup
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newBackupLabel, setNewBackupLabel] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Delete backup
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Restore backup
  const [restoreDialogId, setRestoreDialogId] = useState<string | null>(null)
  const [restoreMode, setRestoreMode] = useState<"full" | "guesthouse">("full")
  const [selectedGuestHouseId, setSelectedGuestHouseId] = useState("")
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreResult, setRestoreResult] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{ ok: boolean; message: string; recordCount: number; tableCount: number; issues: string[] } | null>(null)

  // Import backup
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLabel, setImportLabel] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  // Auth guard
  useEffect(() => {
    if (sessionStatus === "loading") return
    if (!session || session.user.role !== "super_admin") {
      router.push("/login")
      return
    }
  }, [session, sessionStatus, router])

  // Fetch backups
  const [listError, setListError] = useState<string | null>(null)

  const fetchBackups = async () => {
    setIsLoading(true)
    setListError(null)
    try {
      const res = await fetch("/api/admin/backup")
      const data = await res.json()
      if (res.ok) {
        setBackups(data.backups || [])
      } else {
        setListError(data.error || data.detail || `Erreur ${res.status}`)
      }
    } catch (err) {
      console.error("Erreur chargement backups:", err)
      setListError("Erreur réseau")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === "super_admin") {
      fetchBackups()
    }
  }, [session])

  // ─── Actions ──────────────────────────────────────────────

  const handleCreateBackup = async () => {
    setIsCreating(true)
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newBackupLabel || undefined,
          type: "manual",
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setCreateDialogOpen(false)
        setNewBackupLabel("")
        await fetchBackups()
      } else {
        alert(data.error || "Erreur lors de la création")
      }
    } catch (err) {
      alert("Erreur réseau")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteBackup = async () => {
    if (!deleteDialogId) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/backup?id=${deleteDialogId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (res.ok) {
        setDeleteDialogId(null)
        await fetchBackups()
      } else {
        alert(data.error || "Erreur lors de la suppression")
      }
    } catch {
      alert("Erreur réseau")
    } finally {
      setIsDeleting(false)
    }
  }

  // Validate backup (dry-run)
  const handleValidate = async () => {
    if (!restoreDialogId) return
    setIsValidating(true)
    setValidationResult(null)

    try {
      const params = new URLSearchParams()
      params.append("id", restoreDialogId)
      params.append("dryRun", "true")
      if (restoreMode === "guesthouse" && selectedGuestHouseId) {
        params.append("guestHouseId", selectedGuestHouseId)
      }

      const res = await fetch(`/api/admin/backup/restore?${params.toString()}`, {
        method: "POST",
      })
      const data = await res.json()

      if (res.ok && data.validation) {
        setValidationResult({
          ok: data.success && data.validation.issues.length === 0,
          message: data.message || "",
          recordCount: data.validation.totalRecords,
          tableCount: data.validation.tableCount,
          issues: data.validation.issues || [],
        })
      } else {
        setValidationResult({
          ok: false,
          message: data.error || "Erreur de validation",
          recordCount: 0,
          tableCount: 0,
          issues: [data.error || "Erreur inconnue"],
        })
      }
    } catch {
      setValidationResult({ ok: false, message: "Erreur réseau", recordCount: 0, tableCount: 0, issues: ["Erreur réseau"] })
    } finally {
      setIsValidating(false)
    }
  }

  const handleRestore = async () => {
    if (!restoreDialogId) return
    setIsRestoring(true)
    setRestoreResult(null)

    try {
      const params = new URLSearchParams()
      if (restoreMode === "guesthouse" && selectedGuestHouseId) {
        params.append("guestHouseId", selectedGuestHouseId)
      }

      params.append("id", restoreDialogId)
      const res = await fetch(`/api/admin/backup/restore?${params.toString()}`, {
        method: "POST",
      })
      const data = await res.json()

      if (res.ok) {
        const warningsMsg = data.warnings && data.warnings.length > 0
          ? ` (${data.warnings.length} avertissement(s))`
          : ""
        setRestoreResult(`${data.message}${warningsMsg}`)
        setTimeout(() => {
          setRestoreDialogId(null)
          setRestoreResult(null)
          setRestoreMode("full")
          setSelectedGuestHouseId("")
          setValidationResult(null)
          fetchBackups()
        }, 3000)
      } else {
        setRestoreResult(`Erreur: ${data.error}`)
      }
    } catch {
      setRestoreResult("Erreur réseau. Veuillez réessayer.")
    } finally {
      setIsRestoring(false)
    }
  }

  const handleDownload = async (backup: BackupItem) => {
    try {
      const res = await fetch(`/api/admin/backup/download?id=${backup.id}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        alert(data?.error || `Erreur ${res.status}: Impossible de télécharger`)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const timestamp = new Date(backup.createdAt).toISOString().replace(/[:.]/g, "-")
      const label = (backup.label || "sauvegarde").replace(/[^a-zA-Z0-9-_]/g, "_")
      a.download = `pms-backup-${label}-${timestamp}.json.gz`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert("Erreur réseau lors du téléchargement")
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      setImportLabel(file.name.replace(/\.json\.gz$/, "").replace(/\.gz$/, ""))
    }
  }

  const handleImport = async () => {
    if (!importFile) return
    setIsImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append("file", importFile)
      if (importLabel) {
        formData.append("label", importLabel)
      }
      formData.append("mode", "store")

      const res = await fetch("/api/admin/backup/import", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (res.ok) {
        setImportResult(`Importé avec succès ! (${formatSize(data.backup.sizeKo)}, ${data.backup.tableCount} tables)`)
        setImportFile(null)
        setImportLabel("")
        if (fileInputRef.current) fileInputRef.current.value = ""
        fetchBackups()
        setTimeout(() => setImportResult(null), 5000)
      } else {
        setImportResult(`Erreur: ${data.error}`)
      }
    } catch {
      setImportResult("Erreur réseau. Veuillez réessayer.")
    } finally {
      setIsImporting(false)
    }
  }

  // ─── Get backup for current dialog ──────────────────────
  const currentBackup = backups.find((b) => b.id === restoreDialogId)

  // ─── Render ──────────────────────────────────────────────

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => router.push("/app/admin/guesthouses")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Retour à l&apos;administration</TooltipContent>
        </Tooltip>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Database className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Sauvegardes</h1>
              <p className="text-sm text-gray-500">Gestion des sauvegardes de la base de données</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            onClick={handleImportClick}
          >
            <Upload className="w-4 h-4 mr-2" />
            Importer
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json.gz,.gz"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle sauvegarde
          </Button>
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${importResult.startsWith("Erreur") ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
          {importResult.startsWith("Erreur") ? (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 shrink-0" />
          )}
          <p className="text-sm">{importResult}</p>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto shrink-0" onClick={() => setImportResult(null)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Import section (when file selected) */}
      {importFile && !importResult && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <FileArchive className="w-8 h-8 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{importFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(importFile.size / 1024).toFixed(1)} Ko
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Input
                  value={importLabel}
                  onChange={(e) => setImportLabel(e.target.value)}
                  placeholder="Label (optionnel)"
                  className="w-48 h-9"
                />
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                  Importer
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => {
                    setImportFile(null)
                    setImportLabel("")
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{backups.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total sauvegardes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{backups.filter((b) => b.type === "manual").length}</p>
            <p className="text-xs text-gray-500 mt-1">Manuelles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-sky-600">{backups.filter((b) => b.type === "auto").length}</p>
            <p className="text-xs text-gray-500 mt-1">Automatiques</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-700">
              {backups.length > 0 ? formatSize(backups.reduce((a, b) => a + b.sizeKo, 0)) : "0 Ko"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Espace total</p>
          </CardContent>
        </Card>
      </div>

      {/* List error banner */}
      {listError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700">Erreur de chargement</p>
            <p className="text-xs text-red-600 mt-0.5">{listError}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchBackups} className="shrink-0 text-red-700 hover:text-red-800 hover:bg-red-100">
            Réessayer
          </Button>
        </div>
      )}

      {/* Info banner */}
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-sm text-sky-800">
          <p className="font-medium mb-1">Sauvegarde globale de la base de données</p>
          <p className="text-sky-700">
            Chaque sauvegarde contient toutes les données de toutes les maisons d&apos;hôtes. 
            Vous pouvez restaurer l&apos;intégralité de la base ou une seule maison d&apos;hôtes depuis une sauvegarde. 
            Les sauvegardes automatiques sont limitées à 5, les manuelles sont illimitées.
          </p>
        </div>
      </div>

      {/* Backup list */}
      {backups.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Database className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune sauvegarde</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Créez votre première sauvegarde pour protéger vos données. 
              Vous pouvez aussi importer une sauvegarde existante.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer une sauvegarde
              </Button>
              <Button variant="outline" onClick={handleImportClick}>
                <Upload className="w-4 h-4 mr-2" />
                Importer
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {backups.map((backup) => {
            const isExpanded = expandedId === backup.id
            const totalRecords = Object.values(backup.tableSummary).reduce((a, b) => a + b, 0)
            const nonEmptyTables = Object.entries(backup.tableSummary).filter(([, c]) => c > 0)

            return (
              <Card key={backup.id} className="overflow-hidden">
                {/* Main row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : backup.id)}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <HardDrive className="w-5 h-5 text-emerald-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {backup.label || "Sauvegarde sans nom"}
                      </h3>
                      <Badge
                        className={
                          backup.type === "auto"
                            ? "bg-sky-100 text-sky-700 border-sky-300"
                            : "bg-emerald-100 text-emerald-700 border-emerald-300"
                        }
                        variant="outline"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {backup.type === "auto" ? "Auto" : "Manuelle"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{formatDate(backup.createdAt)}</span>
                      <span>{formatSize(backup.sizeKo)}</span>
                      <span>{totalRecords} enregistrements</span>
                      <span>{nonEmptyTables.length} tables</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-sky-600 hover:bg-sky-50"
                          onClick={() => handleDownload(backup)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Télécharger (.json.gz)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => {
                            setRestoreDialogId(backup.id)
                            setRestoreMode("full")
                            setSelectedGuestHouseId("")
                            setRestoreResult(null)
                          }}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Restaurer</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteDialogId(backup.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Supprimer</TooltipContent>
                    </Tooltip>

                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    {/* Guesthouses in this backup */}
                    {backup.guestHouseList.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Maisons d&apos;hôtes ({backup.guestHouseList.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {backup.guestHouseList.map((gh) => (
                            <Badge key={gh.id} variant="outline" className="bg-white border-gray-200">
                              <Tag className="w-3 h-3 mr-1 text-gray-400" />
                              {gh.name}
                              <span className="text-xs text-gray-400 ml-1">({gh.slug})</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator className="mb-4" />

                    {/* Table details */}
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Détail des tables
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {nonEmptyTables.map(([table, count]) => (
                        <div
                          key={table}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border text-xs"
                        >
                          <span className="text-gray-600 truncate mr-2">
                            {tableLabels[table] || table}
                          </span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── CREATE BACKUP DIALOG ──────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              Nouvelle sauvegarde
            </DialogTitle>
            <DialogDescription>
              Créer une sauvegarde complète de toutes les données de la base de données.
              Cette opération peut prendre quelques secondes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Label (optionnel)</Label>
              <Input
                placeholder="Ex: Sauvegarde hebdomadaire, Avant mise à jour..."
                value={newBackupLabel}
                onChange={(e) => setNewBackupLabel(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-700 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                La sauvegarde contiendra toutes les données de toutes les maisons d&apos;hôtes,
                les utilisateurs, les réservations, les factures, etc.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isCreating}>
                Annuler
              </Button>
              <Button
                onClick={handleCreateBackup}
                disabled={isCreating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                <Database className="w-4 h-4 mr-2" />
                Créer la sauvegarde
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE BACKUP DIALOG ──────────────────────────── */}
      <Dialog open={!!deleteDialogId} onOpenChange={() => setDeleteDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Supprimer la sauvegarde
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La sauvegarde sera définitivement supprimée.
              {deleteDialogId && (
                <span className="block mt-2 font-medium">
                  {backups.find((b) => b.id === deleteDialogId)?.label || "Sauvegarde sans nom"}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogId(null)} disabled={isDeleting}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteBackup} disabled={isDeleting}>
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── RESTORE DIALOG ────────────────────────────────── */}
      <Dialog
        open={!!restoreDialogId}
        onOpenChange={(open) => {
          if (!open) {
            setRestoreDialogId(null)
            setRestoreResult(null)
            setRestoreMode("full")
            setSelectedGuestHouseId("")
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-emerald-600" />
              Restaurer une sauvegarde
            </DialogTitle>
            <DialogDescription>
              {currentBackup && (
                <>
                  Sauvegarde: <strong>{currentBackup.label || "Sans nom"}</strong>
                  <br />
                  Créée le {formatDate(currentBackup.createdAt)} — {formatSize(currentBackup.sizeKo)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {!restoreResult ? (
            <div className="space-y-4 pt-2">
              {/* Restore mode selection */}
              <div className="space-y-2">
                <Label>Mode de restauration</Label>
                <div className="grid grid-cols-1 gap-3">
                  {/* Full restore */}
                  <button
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      restoreMode === "full"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setRestoreMode("full")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        restoreMode === "full" ? "bg-emerald-200" : "bg-gray-100"
                      }`}>
                        <Database className={`w-5 h-5 ${restoreMode === "full" ? "text-emerald-700" : "text-gray-400"}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Restauration complète</p>
                        <p className="text-xs text-gray-500">
                          Remplace toutes les données de la base. Les données actuelles seront perdues.
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Guesthouse restore */}
                  <button
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      restoreMode === "guesthouse"
                        ? "border-sky-500 bg-sky-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setRestoreMode("guesthouse")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        restoreMode === "guesthouse" ? "bg-sky-200" : "bg-gray-100"
                      }`}>
                        <Building2 className={`w-5 h-5 ${restoreMode === "guesthouse" ? "text-sky-700" : "text-gray-400"}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Restaurer une maison d&apos;hôtes</p>
                        <p className="text-xs text-gray-500">
                          Restaure uniquement les données d&apos;une maison d&apos;hôtes depuis la sauvegarde.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Guesthouse selector */}
              {restoreMode === "guesthouse" && currentBackup && (
                <div className="space-y-2">
                  <Label>Maison d&apos;hôtes à restaurer</Label>
                  <Select value={selectedGuestHouseId} onValueChange={setSelectedGuestHouseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une maison d'hôtes..." />
                    </SelectTrigger>
                    <SelectContent>
                      {currentBackup.guestHouseList.map((gh) => (
                        <SelectItem key={gh.id} value={gh.id}>
                          {gh.name} ({gh.slug})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentBackup.guestHouseList.length === 0 && (
                    <p className="text-xs text-muted-foreground">Aucune maison d&apos;hôtes dans cette sauvegarde.</p>
                  )}
                </div>
              )}

              {/* Validation section */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={handleValidate}
                  disabled={isValidating || (restoreMode === "guesthouse" && !selectedGuestHouseId)}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Vérification en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-sky-600" />
                      Vérifier l&apos;intégrité de la sauvegarde
                    </>
                  )}
                </Button>

                {validationResult && (
                  <div className={`p-3 rounded-lg border text-sm ${
                    validationResult.ok
                      ? "bg-green-50 border-green-200"
                      : "bg-amber-50 border-amber-200"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {validationResult.ok ? (
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <p className={`font-medium ${validationResult.ok ? "text-green-700" : "text-amber-700"}`}>
                        {validationResult.ok ? "Sauvegarde valide" : "Problèmes détectés"}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 ml-6">
                      {validationResult.recordCount} enregistrements dans {validationResult.tableCount} tables
                    </p>
                    {validationResult.issues.length > 0 && (
                      <ul className="mt-2 ml-6 space-y-1">
                        {validationResult.issues.map((issue, i) => (
                          <li key={i} className="text-xs text-amber-700 flex items-start gap-1">
                            <span className="shrink-0">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Attention — Action irréversible</p>
                  <p>
                    {restoreMode === "full"
                      ? "Toutes les données actuelles de la base seront supprimées et remplacées par les données de la sauvegarde."
                      : "Les données actuelles de cette maison d'hôtes seront supprimées et remplacées (y compris les utilisateurs liés)."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRestoreDialogId(null)
                    setRestoreResult(null)
                    setValidationResult(null)
                  }}
                  disabled={isRestoring}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleRestore}
                  disabled={
                    isRestoring ||
                    (restoreMode === "guesthouse" && !selectedGuestHouseId)
                  }
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isRestoring ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Restauration en cours...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restaurer
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Restore result */
            <div className={`p-6 rounded-lg text-center ${
              restoreResult.startsWith("Erreur")
                ? "bg-red-50 border border-red-200"
                : "bg-green-50 border border-green-200"
            }`}>
              {restoreResult.startsWith("Erreur") ? (
                <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-3" />
              ) : (
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
              )}
              <p className={`text-sm font-medium ${restoreResult.startsWith("Erreur") ? "text-red-700" : "text-green-700"}`}>
                {restoreResult}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
