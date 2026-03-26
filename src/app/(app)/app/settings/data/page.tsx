"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Loader2,
  FileJson,
  FileSpreadsheet,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function DataSettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [exporting, setExporting] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleExport = async (format: "json" | "csv") => {
    try {
      setExporting(true)
      
      const response = await fetch(`/api/export?format=${format}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `export-${format}-${new Date().toISOString().split("T")[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Succès",
          description: `Export ${format.toUpperCase()} téléchargé`,
        })
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'exporter les données",
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
      setExporting(false)
    }
  }

  const handleReset = async () => {
    try {
      setResetting(true)
      
      const response = await fetch("/api/reset-data", { method: "POST" })
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "Toutes les données ont été supprimées",
        })
        setShowResetDialog(false)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de réinitialiser les données",
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
      setResetting(false)
    }
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
            Données
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Exportez ou sauvegardez vos données
          </p>
        </div>
      </div>

      {/* Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-sky-600" />
            <CardTitle>Exporter les données</CardTitle>
          </div>
          <CardDescription>
            Téléchargez une copie de toutes vos données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <FileJson className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="font-medium">Format JSON</p>
                  <p className="text-sm text-gray-500">
                    Idéal pour les développeurs
                  </p>
                </div>
              </div>
              <Button
                className="w-full mt-3"
                variant="outline"
                onClick={() => handleExport("json")}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Export...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exporter JSON
                  </>
                )}
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium">Format CSV</p>
                  <p className="text-sm text-gray-500">
                    Compatible Excel, Google Sheets
                  </p>
                </div>
              </div>
              <Button
                className="w-full mt-3"
                variant="outline"
                onClick={() => handleExport("csv")}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Export...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exporter CSV
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-600" />
            <CardTitle>Importer des données</CardTitle>
          </div>
          <CardDescription>
            Restaurez une sauvegarde précédente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
            <p className="font-medium mb-1">Glissez-déposez votre fichier</p>
            <p className="text-sm text-gray-500 mb-4">
              ou cliquez pour sélectionner (JSON uniquement)
            </p>
            <Button variant="outline" disabled>
              Sélectionner un fichier
            </Button>
            <p className="text-xs text-gray-400 mt-2">
              Fonctionnalité bientôt disponible
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" />
            <CardTitle>Sauvegardes automatiques</CardTitle>
          </div>
          <CardDescription>
            Vos données sont sauvegardées automatiquement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div>
                <p className="font-medium">Dernière sauvegarde</p>
                <p className="text-sm text-gray-500">Aujourd'hui à 03:00</p>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sauvegarder maintenant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            <CardTitle>Zone de danger</CardTitle>
          </div>
          <CardDescription className="text-red-600/70">
            Actions irréversibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Réinitialiser toutes les données</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Supprime toutes les réservations, clients, chambres et factures
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowResetDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser toutes les données ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes vos données (réservations, clients, 
              chambres, factures) seront définitivement supprimées. L&apos;établissement 
              et votre compte seront conservés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={resetting}
              className="bg-red-600 hover:bg-red-700"
            >
              {resetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Réinitialiser"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
