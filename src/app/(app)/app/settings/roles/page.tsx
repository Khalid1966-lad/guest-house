"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Users,
  Settings,
  DollarSign,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Permission {
  key: string
  label: string
  description: string
  category: "menu" | "action" | "financial"
}

const permissions: Permission[] = [
  // Menu access
  { key: "canViewDashboard", label: "Dashboard", description: "Accès au tableau de bord", category: "menu" },
  { key: "canViewRooms", label: "Chambres", description: "Accès à la gestion des chambres", category: "menu" },
  { key: "canViewBookings", label: "Réservations", description: "Accès aux réservations", category: "menu" },
  { key: "canViewGuests", label: "Clients", description: "Accès à la gestion des clients", category: "menu" },
  { key: "canViewInvoices", label: "Factures", description: "Accès à la facturation", category: "menu" },
  { key: "canViewRestaurant", label: "Restaurant", description: "Accès au module restaurant", category: "menu" },
  { key: "canViewExpenses", label: "Dépenses", description: "Accès aux dépenses", category: "menu" },
  { key: "canViewStatistics", label: "Statistiques", description: "Accès aux statistiques", category: "menu" },
  { key: "canViewSettings", label: "Paramètres", description: "Accès aux paramètres", category: "menu" },
  { key: "canViewUsers", label: "Utilisateurs", description: "Accès à la gestion des utilisateurs", category: "menu" },
  // Actions
  { key: "canCreateBookings", label: "Créer réservations", description: "Peut créer de nouvelles réservations", category: "action" },
  { key: "canEditBookings", label: "Modifier réservations", description: "Peut modifier les réservations", category: "action" },
  { key: "canDeleteBookings", label: "Supprimer réservations", description: "Peut annuler/supprimer des réservations", category: "action" },
  { key: "canCreateInvoices", label: "Créer factures", description: "Peut créer des factures", category: "action" },
  { key: "canEditInvoices", label: "Modifier factures", description: "Peut modifier les factures", category: "action" },
  { key: "canDeleteInvoices", label: "Supprimer factures", description: "Peut supprimer des factures", category: "action" },
  { key: "canManageRooms", label: "Gérer chambres", description: "Peut ajouter/modifier les chambres", category: "action" },
  { key: "canManageGuests", label: "Gérer clients", description: "Peut ajouter/modifier les clients", category: "action" },
  { key: "canManageExpenses", label: "Gérer dépenses", description: "Peut ajouter/modifier les dépenses", category: "action" },
  { key: "canManageUsers", label: "Gérer utilisateurs", description: "Peut ajouter/modifier les utilisateurs", category: "action" },
  { key: "canManageSettings", label: "Gérer paramètres", description: "Peut modifier les paramètres de l'établissement", category: "action" },
  // Financial
  { key: "canViewRevenue", label: "Voir revenus", description: "Peut voir les informations de revenus", category: "financial" },
  { key: "canApplyDiscounts", label: "Appliquer remises", description: "Peut appliquer des remises sur les factures", category: "financial" },
  { key: "canRefundPayments", label: "Rembourser paiements", description: "Peut effectuer des remboursements", category: "financial" },
]

interface Role {
  id: string
  name: string
  label: string
  [key: string]: string | boolean
}

interface RoleTemplate {
  name: string
  label: string
  description: string
  permissions: Record<string, boolean>
}

export default function RolesPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [roles, setRoles] = useState<Role[]>([])
  const [templates, setTemplates] = useState<RoleTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string | boolean>>({})
  const [createForm, setCreateForm] = useState({
    name: "",
    label: "",
    ...Object.fromEntries(permissions.map(p => [p.key, false])),
  })

  const isOwner = session?.user?.role === "owner"

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/roles")
      const data = await response.json()
      if (data.roles) {
        setRoles(data.roles)
      }
      if (data.templates) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error("Error fetching roles:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les rôles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (role: Role) => {
    setSelectedRole(role)
    setEditForm({ ...role })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedRole) return

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la mise à jour")
      }

      toast({
        title: "Succès",
        description: "Rôle mis à jour avec succès",
      })
      setIsEditDialogOpen(false)
      fetchRoles()
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la mise à jour",
        variant: "destructive",
      })
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la création")
      }

      toast({
        title: "Succès",
        description: "Rôle créé avec succès",
      })
      setIsCreateDialogOpen(false)
      setCreateForm({
        name: "",
        label: "",
        ...Object.fromEntries(permissions.map(p => [p.key, false])),
      })
      fetchRoles()
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la création",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/roles/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la suppression")
      }

      toast({
        title: "Succès",
        description: "Rôle supprimé avec succès",
      })
      setDeleteRoleId(null)
      fetchRoles()
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la suppression",
        variant: "destructive",
      })
    }
  }

  const handleCreateFromTemplate = (template: RoleTemplate) => {
    setCreateForm({
      name: template.name,
      label: template.label,
      ...template.permissions,
    })
    setIsCreateDialogOpen(true)
  }

  const togglePermission = (key: string, isEdit: boolean) => {
    if (isEdit) {
      setEditForm(prev => ({ ...prev, [key]: !prev[key] }))
    } else {
      setCreateForm(prev => ({ ...prev, [key]: !prev[key] }))
    }
  }

  const toggleCategory = (category: string, isEdit: boolean, value: boolean) => {
    const categoryPermissions = permissions.filter(p => p.category === category)
    const updates = Object.fromEntries(categoryPermissions.map(p => [p.key, value]))

    if (isEdit) {
      setEditForm(prev => ({ ...prev, ...updates }))
    } else {
      setCreateForm(prev => ({ ...prev, ...updates }))
    }
  }

  const PermissionCheckboxes = ({ form, isEdit }: { form: Record<string, string | boolean>, isEdit: boolean }) => (
    <div className="space-y-6">
      {["menu", "action", "financial"].map(category => (
        <div key={category}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium capitalize">
              {category === "menu" && "Accès aux menus"}
              {category === "action" && "Actions"}
              {category === "financial" && "Financier"}
            </h4>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => toggleCategory(category, isEdit, true)}
              >
                Tout cocher
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => toggleCategory(category, isEdit, false)}
              >
                Tout décocher
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {permissions.filter(p => p.category === category).map(permission => (
              <div
                key={permission.key}
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={permission.key}
                  checked={!!form[permission.key]}
                  onCheckedChange={() => togglePermission(permission.key, isEdit)}
                />
                <div className="flex-1">
                  <Label htmlFor={permission.key} className="font-medium cursor-pointer">
                    {permission.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{permission.description}</p>
                </div>
              </div>
            ))}
          </div>
          {category !== "financial" && <Separator className="mt-4" />}
        </div>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Gestion des Rôles
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configurez les permissions pour chaque rôle d&apos;utilisateur
          </p>
        </div>
        {isOwner && roles.length === 0 && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-sky-600 hover:bg-sky-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau rôle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un nouveau rôle</DialogTitle>
                <DialogDescription>
                  Définissez un nouveau rôle avec ses permissions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom technique</Label>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="ex: receptionist"
                    />
                  </div>
                  <div>
                    <Label htmlFor="label">Libellé affiché</Label>
                    <Input
                      id="label"
                      value={createForm.label}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="ex: Réceptionniste"
                    />
                  </div>
                </div>
                <PermissionCheckboxes form={createForm} isEdit={false} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} className="bg-sky-600 hover:bg-sky-700">
                  Créer le rôle
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Warning for non-owners */}
      {!isOwner && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800 dark:text-yellow-200">
                Seul le propriétaire peut modifier les rôles et permissions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates (shown when no roles exist yet) */}
      {roles.length === 0 && templates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Modèles de rôles recommandés</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {template.label}
                    {template.name === "owner" && (
                      <Badge className="bg-yellow-500">Protégé</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {permissions.filter(p => template.permissions[p.key] && p.category === "menu").length} menus accessibles
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>
                        {permissions.filter(p => template.permissions[p.key] && p.category === "action").length} actions autorisées
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {permissions.filter(p => template.permissions[p.key] && p.category === "financial").length} permissions financières
                      </span>
                    </div>
                  </div>
                  {isOwner && template.name !== "owner" && (
                    <Button
                      className="w-full mt-4 bg-sky-600 hover:bg-sky-700"
                      onClick={() => handleCreateFromTemplate(template)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Utiliser ce modèle
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Existing roles */}
      {roles.length > 0 && (
        <Tabs defaultValue={roles[0]?.id} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
            {roles.map((role) => (
              <TabsTrigger
                key={role.id}
                value={role.id}
                className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700 dark:data-[state=active]:bg-sky-900 dark:data-[state=active]:text-sky-100"
              >
                {role.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {roles.map((role) => (
            <TabsContent key={role.id} value={role.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{role.label}</CardTitle>
                      <CardDescription>
                        Rôle technique : <code className="text-xs bg-muted px-1 rounded">{role.name}</code>
                      </CardDescription>
                    </div>
                    {isOwner && role.name !== "owner" && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(role)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteRoleId(role.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Menu permissions */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Accès aux menus
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {permissions.filter(p => p.category === "menu").map((p) => (
                          <div
                            key={p.key}
                            className={`flex items-center gap-2 p-2 rounded ${
                              role[p.key]
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {role[p.key] ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            <span className="text-sm">{p.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action permissions */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Actions
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {permissions.filter(p => p.category === "action").map((p) => (
                          <div
                            key={p.key}
                            className={`flex items-center gap-2 p-2 rounded ${
                              role[p.key]
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {role[p.key] ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            <span className="text-sm">{p.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial permissions */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Financier
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {permissions.filter(p => p.category === "financial").map((p) => (
                          <div
                            key={p.key}
                            className={`flex items-center gap-2 p-2 rounded ${
                              role[p.key]
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {role[p.key] ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            <span className="text-sm">{p.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Modifiez les permissions pour ce rôle
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-label">Libellé affiché</Label>
              <Input
                id="edit-label"
                value={editForm.label as string || ""}
                onChange={(e) => setEditForm(prev => ({ ...prev, label: e.target.value }))}
              />
            </div>
            <PermissionCheckboxes form={editForm} isEdit={true} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} className="bg-sky-600 hover:bg-sky-700">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce rôle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les utilisateurs avec ce rôle devront être réassignés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRoleId && handleDelete(deleteRoleId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
