"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  UtensilsCrossed,
  Plus,
  Loader2,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Coffee,
  ChefHat,
  Wine,
  Cookie,
  Clock,
  Leaf,
  CheckCircle,
  XCircle,
  Filter,
  DollarSign,
  Users,
  ShoppingCart,
  Play,
  Pause,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

// Types
interface MenuItem {
  id: string
  name: string
  description: string | null
  category: string
  subcategory: string | null
  price: number
  currency: string
  image: string | null
  isAvailable: boolean
  isVegetarian: boolean
  isVegan: boolean
  allergens: string | null
  preparationTime: number | null
  sortOrder: number
}

interface OrderItem {
  id: string
  menuItemId: string
  quantity: number
  unitPrice: number
  total: number
  notes: string | null
  menuItem: {
    id: string
    name: string
    price: number
    category: string
  }
}

interface RestaurantOrder {
  id: string
  roomId: string | null
  bookingId: string | null
  tableNumber: string | null
  guestName: string | null
  orderType: string
  notes: string | null
  subtotal: number
  taxes: number
  total: number
  status: string
  paymentStatus: string
  orderDate: string
  readyAt: string | null
  deliveredAt: string | null
  items: OrderItem[]
}

// Categories
const categories = [
  { value: "breakfast", label: "Petit-déjeuner", icon: Coffee },
  { value: "lunch", label: "Déjeuner", icon: UtensilsCrossed },
  { value: "dinner", label: "Dîner", icon: ChefHat },
  { value: "drinks", label: "Boissons", icon: Wine },
  { value: "snacks", label: "Snacks", icon: Cookie },
]

// Order statuses
const orderStatuses: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "En attente", color: "text-yellow-700", bg: "bg-yellow-100" },
  preparing: { label: "En préparation", color: "text-sky-700", bg: "bg-sky-100" },
  ready: { label: "Prête", color: "text-green-700", bg: "bg-green-100" },
  delivered: { label: "Livrée", color: "text-gray-700", bg: "bg-gray-100" },
  cancelled: { label: "Annulée", color: "text-red-700", bg: "bg-red-100" },
}

// Payment statuses
const paymentStatuses: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "En attente", color: "text-yellow-700", bg: "bg-yellow-100" },
  paid: { label: "Payée", color: "text-green-700", bg: "bg-green-100" },
  billed_to_room: { label: "Facturée à la chambre", color: "text-sky-700", bg: "bg-sky-100" },
}

const defaultMenuItemForm = {
  name: "",
  description: "",
  category: "breakfast",
  subcategory: "",
  price: "",
  image: "",
  isAvailable: true,
  isVegetarian: false,
  isVegan: false,
  allergens: "",
  preparationTime: "",
}

export default function RestaurantPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const currency = session?.user?.guestHouseCurrency || "EUR"
  const formatAmount = (amount: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount)
  
  // State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<RestaurantOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("menu")
  
  // Menu items state
  const [menuCategoryFilter, setMenuCategoryFilter] = useState("all")
  const [menuSearchQuery, setMenuSearchQuery] = useState("")
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  const [menuFormData, setMenuFormData] = useState(defaultMenuItemForm)
  const [isMenuSaving, setIsMenuSaving] = useState(false)
  const [menuFormError, setMenuFormError] = useState("")
  const [isDeleteMenuDialogOpen, setIsDeleteMenuDialogOpen] = useState(false)
  const [menuItemToDelete, setMenuItemToDelete] = useState<MenuItem | null>(null)
  const [isDeletingMenu, setIsDeletingMenu] = useState(false)
  
  // Orders state
  const [orderStatusFilter, setOrderStatusFilter] = useState("all")
  const [orderSearchQuery, setOrderSearchQuery] = useState("")
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null)
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false)

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = menuCategoryFilter === "all" || item.category === menuCategoryFilter
      const matchesSearch = !menuSearchQuery || 
        item.name.toLowerCase().includes(menuSearchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [menuItems, menuCategoryFilter, menuSearchQuery])

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter
      const matchesSearch = !orderSearchQuery ||
        order.guestName?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        order.tableNumber?.includes(orderSearchQuery)
      return matchesStatus && matchesSearch
    })
  }, [orders, orderStatusFilter, orderSearchQuery])

  // Stats
  const menuStats = useMemo(() => ({
    total: menuItems.length,
    available: menuItems.filter((i) => i.isAvailable).length,
    vegetarian: menuItems.filter((i) => i.isVegetarian).length,
    vegan: menuItems.filter((i) => i.isVegan).length,
  }), [menuItems])

  const orderStats = useMemo(() => ({
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    todayRevenue: orders
      .filter((o) => format(parseISO(o.orderDate), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"))
      .reduce((sum, o) => sum + o.total, 0),
  }), [orders])

  // Fetch data
  const fetchData = async () => {
    if (!session?.user?.guestHouseId) {
      setIsLoading(false)
      return
    }

    try {
      const [menuRes, ordersRes] = await Promise.all([
        fetch("/api/menu-items"),
        fetch("/api/restaurant-orders"),
      ])

      if (menuRes.ok) {
        const data = await menuRes.json()
        setMenuItems(data.menuItems || [])
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json()
        setOrders(data.orders || [])
      }
    } catch (err) {
      console.error("Erreur chargement:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    fetchData()
  }, [session, status, router])

  // Menu item handlers
  const handleNewMenuItem = () => {
    setEditingMenuItem(null)
    setMenuFormData(defaultMenuItemForm)
    setMenuFormError("")
    setIsMenuDialogOpen(true)
  }

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item)
    setMenuFormData({
      name: item.name,
      description: item.description || "",
      category: item.category,
      subcategory: item.subcategory || "",
      price: item.price.toString(),
      image: item.image || "",
      isAvailable: item.isAvailable,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      allergens: item.allergens || "",
      preparationTime: item.preparationTime?.toString() || "",
    })
    setMenuFormError("")
    setIsMenuDialogOpen(true)
  }

  const handleMenuFormChange = (field: string, value: string | boolean) => {
    setMenuFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveMenuItem = async () => {
    setMenuFormError("")

    if (!menuFormData.name || !menuFormData.price) {
      setMenuFormError("Le nom et le prix sont requis")
      return
    }

    setIsMenuSaving(true)

    try {
      const url = editingMenuItem ? `/api/menu-items/${editingMenuItem.id}` : "/api/menu-items"
      const method = editingMenuItem ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...menuFormData,
          price: parseFloat(menuFormData.price),
          preparationTime: menuFormData.preparationTime ? parseInt(menuFormData.preparationTime) : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setMenuFormError(errorData.error || "Erreur lors de la sauvegarde")
        setIsMenuSaving(false)
        return
      }

      setIsMenuDialogOpen(false)
      setIsMenuSaving(false)
      fetchData()
    } catch (err) {
      setMenuFormError("Une erreur inattendue s'est produite")
      setIsMenuSaving(false)
    }
  }

  const handleDeleteMenuItem = async () => {
    if (!menuItemToDelete) return

    setIsDeletingMenu(true)

    try {
      const response = await fetch(`/api/menu-items/${menuItemToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setIsDeleteMenuDialogOpen(false)
        setMenuItemToDelete(null)
        fetchData()
      }
    } catch (err) {
      console.error("Erreur suppression:", err)
    } finally {
      setIsDeletingMenu(false)
    }
  }

  // Toggle availability
  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await fetch(`/api/menu-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      })
      fetchData()
    } catch (err) {
      console.error("Erreur:", err)
    }
  }

  // Order handlers
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/restaurant-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (err) {
      console.error("Erreur mise à jour:", err)
    }
  }

  const handleViewOrder = (order: RestaurantOrder) => {
    setSelectedOrder(order)
    setIsOrderDetailOpen(true)
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    )
  }

  if (status === "authenticated" && !session?.user?.guestHouseId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <UtensilsCrossed className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Configuration requise</h2>
        <p className="text-gray-500 mb-4 text-center">
          Vous devez créer votre maison d'hôtes avant de gérer le restaurant.
        </p>
        <Button onClick={() => router.push("/onboarding")}>
          Créer ma maison d'hôtes
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Restaurant</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez votre menu et les commandes
          </p>
        </div>
        <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleNewMenuItem}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvel article
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="menu">Menu ({menuItems.length})</TabsTrigger>
          <TabsTrigger value="orders">Commandes ({orders.length})</TabsTrigger>
        </TabsList>

        {/* Menu Tab */}
        <TabsContent value="menu" className="space-y-6">
          {/* Menu Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <UtensilsCrossed className="w-4 h-4" />
                  <span className="text-sm">Total</span>
                </div>
                <p className="text-2xl font-bold">{menuStats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Disponibles</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{menuStats.available}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Leaf className="w-4 h-4" />
                  <span className="text-sm">Végétarien</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{menuStats.vegetarian}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Leaf className="w-4 h-4" />
                  <span className="text-sm">Vegan</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{menuStats.vegan}</p>
              </CardContent>
            </Card>
          </div>

          {/* Menu Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un article..."
                value={menuSearchQuery}
                onChange={(e) => setMenuSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={menuCategoryFilter} onValueChange={setMenuCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Filter className="w-4 h-4" />
              Catégorie:
            </span>
            <button
              onClick={() => setMenuCategoryFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                menuCategoryFilter === "all"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              )}
            >
              Tous
            </button>
            {categories.map((cat) => {
              const count = menuItems.filter((i) => i.category === cat.value).length
              return (
                <button
                  key={cat.value}
                  onClick={() => setMenuCategoryFilter(menuCategoryFilter === cat.value ? "all" : cat.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all border flex items-center gap-2",
                    menuCategoryFilter === cat.value
                      ? "bg-sky-100 text-sky-700 border-sky-300"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  )}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    menuCategoryFilter === cat.value ? "bg-sky-200" : "bg-gray-100"
                  )}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Menu Items Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenuItems.map((item) => (
              <Card key={item.id} className={cn(!item.isAvailable && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{item.name}</h3>
                        {!item.isAvailable && (
                          <Badge variant="outline" className="text-xs">Indisponible</Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-semibold text-sky-600">{formatAmount(item.price)}</span>
                        {item.preparationTime && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.preparationTime} min
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {item.isVegetarian && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200">Végétarien</Badge>
                        )}
                        {item.isVegan && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200">Vegan</Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleAvailability(item)}>
                          {item.isAvailable ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Rendre indisponible
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Rendre disponible
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditMenuItem(item)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setMenuItemToDelete(item)
                            setIsDeleteMenuDialogOpen(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMenuItems.length === 0 && (
            <div className="text-center py-12">
              <UtensilsCrossed className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">Aucun article</h3>
              <p className="text-gray-500 mb-4">
                {menuCategoryFilter !== "all"
                  ? "Aucun article dans cette catégorie"
                  : "Commencez par ajouter des articles à votre menu"}
              </p>
              <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleNewMenuItem}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un article
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          {/* Order Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOrderStatusFilter("pending")}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-1">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-2xl font-bold">{orderStats.pending}</span>
                </div>
                <p className="text-sm text-gray-500">En attente</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOrderStatusFilter("preparing")}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-1">
                  <ChefHat className="w-4 h-4 text-sky-600" />
                  <span className="text-2xl font-bold">{orderStats.preparing}</span>
                </div>
                <p className="text-sm text-gray-500">En préparation</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOrderStatusFilter("ready")}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-2xl font-bold">{orderStats.ready}</span>
                </div>
                <p className="text-sm text-gray-500">Prêtes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-1">
                  <DollarSign className="w-4 h-4 text-sky-600" />
                  <span className="text-2xl font-bold">{formatAmount(orderStats.todayRevenue)}</span>
                </div>
                <p className="text-sm text-gray-500">Revenus aujourd'hui</p>
              </CardContent>
            </Card>
          </div>

          {/* Order Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher par client ou table..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(orderStatuses).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle>Commandes</CardTitle>
              <CardDescription>
                {filteredOrders.length} commande{filteredOrders.length > 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">Aucune commande</h3>
                  <p className="text-gray-500">
                    {orderStatusFilter !== "all"
                      ? "Aucune commande avec ce statut"
                      : "Les nouvelles commandes apparaîtront ici"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => {
                    const statusInfo = orderStatuses[order.status] || orderStatuses.pending
                    const paymentInfo = paymentStatuses[order.paymentStatus] || paymentStatuses.pending
                    
                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div
                          className="flex items-center gap-4 flex-1 cursor-pointer"
                          onClick={() => handleViewOrder(order)}
                        >
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", statusInfo.bg)}>
                            <UtensilsCrossed className={cn("w-5 h-5", statusInfo.color)} />
                          </div>
                          <div>
                            <p className="font-medium">
                              {order.guestName || `Table ${order.tableNumber || "N/A"}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.items.length} article{order.items.length > 1 ? "s" : ""} •{" "}
                              {format(parseISO(order.orderDate), "d MMM à HH:mm", { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block">
                            <p className="font-semibold">{formatAmount(order.total)}</p>
                            <div className="flex gap-1">
                              <Badge className={cn(statusInfo.bg, statusInfo.color, "border-0 text-xs")}>
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                                <UtensilsCrossed className="w-4 h-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {order.status === "pending" && (
                                <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "preparing")}>
                                  <ChefHat className="w-4 h-4 mr-2" />
                                  Commencer la préparation
                                </DropdownMenuItem>
                              )}
                              {order.status === "preparing" && (
                                <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "ready")}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marquer comme prête
                                </DropdownMenuItem>
                              )}
                              {order.status === "ready" && (
                                <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "delivered")}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marquer comme livrée
                                </DropdownMenuItem>
                              )}
                              {order.status !== "cancelled" && order.status !== "delivered" && (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Annuler
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Menu Item Dialog */}
      <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMenuItem ? "Modifier l'article" : "Nouvel article"}
            </DialogTitle>
            <DialogDescription>
              {editingMenuItem ? "Modifiez les informations de l'article" : "Ajoutez un nouvel article au menu"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {menuFormError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {menuFormError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={menuFormData.name}
                onChange={(e) => handleMenuFormChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={menuFormData.description}
                onChange={(e) => handleMenuFormChange("description", e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={menuFormData.category} onValueChange={(v) => handleMenuFormChange("category", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Prix *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={menuFormData.price}
                  onChange={(e) => handleMenuFormChange("price", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preparationTime">Temps de préparation (min)</Label>
                <Input
                  id="preparationTime"
                  type="number"
                  value={menuFormData.preparationTime}
                  onChange={(e) => handleMenuFormChange("preparationTime", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={menuFormData.image}
                  onChange={(e) => handleMenuFormChange("image", e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={menuFormData.isAvailable}
                  onChange={(e) => handleMenuFormChange("isAvailable", e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Disponible</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={menuFormData.isVegetarian}
                  onChange={(e) => handleMenuFormChange("isVegetarian", e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Végétarien</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={menuFormData.isVegan}
                  onChange={(e) => handleMenuFormChange("isVegan", e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Vegan</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsMenuDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-sky-600 hover:bg-sky-700"
              onClick={handleSaveMenuItem}
              disabled={isMenuSaving}
            >
              {isMenuSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                editingMenuItem ? "Modifier" : "Créer"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Menu Item Dialog */}
      <AlertDialog open={isDeleteMenuDialogOpen} onOpenChange={setIsDeleteMenuDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'article</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer{" "}
              <strong>{menuItemToDelete?.name}</strong> ?
              <br />
              <span className="text-red-600 font-medium">Cette action est irréversible.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingMenu}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMenuItem}
              disabled={isDeletingMenu}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingMenu ? (
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

      {/* Order Detail Dialog */}
      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Statut</span>
                <Badge className={cn(
                  orderStatuses[selectedOrder.status]?.bg,
                  orderStatuses[selectedOrder.status]?.color,
                  "border-0"
                )}>
                  {orderStatuses[selectedOrder.status]?.label}
                </Badge>
              </div>

              {/* Guest Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Client</p>
                <p className="font-medium">{selectedOrder.guestName || "Non spécifié"}</p>
                {selectedOrder.tableNumber && (
                  <p className="text-sm text-gray-500">Table: {selectedOrder.tableNumber}</p>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Articles</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.menuItem.name}</span>
                      <span>{formatAmount(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="p-4 bg-sky-50 dark:bg-sky-950 rounded-lg">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-sky-600">{formatAmount(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Notes</p>
                  <p className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleUpdateOrderStatus(selectedOrder.id, "preparing")
                      setIsOrderDetailOpen(false)
                    }}
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    Préparer
                  </Button>
                )}
                {selectedOrder.status === "preparing" && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleUpdateOrderStatus(selectedOrder.id, "ready")
                      setIsOrderDetailOpen(false)
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Prête
                  </Button>
                )}
                {selectedOrder.status === "ready" && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleUpdateOrderStatus(selectedOrder.id, "delivered")
                      setIsOrderDetailOpen(false)
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Livrée
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
