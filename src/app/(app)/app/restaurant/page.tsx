"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { useCurrency } from "@/hooks/use-currency"
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
  BedDouble,
  DoorOpen,
  ShoppingBag,
  Minus,
  Camera,
  X,
  LayoutGrid,
  List,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
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

interface ActiveBooking {
  id: string
  roomId: string
  guestId: string
  checkIn: string
  checkOut: string
  status: string
  guest: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
  }
  room: {
    id: string
    number: string
    name: string | null
    type: string
  }
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
  const { formatAmount } = useCurrency()
  
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
  const [isDeleteOrderDialogOpen, setIsDeleteOrderDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<RestaurantOrder | null>(null)
  const [menuItemToDelete, setMenuItemToDelete] = useState<MenuItem | null>(null)
  const [isDeletingMenu, setIsDeletingMenu] = useState(false)
  
  // Orders state
  const [orderStatusFilter, setOrderStatusFilter] = useState("all")
  const [orderSearchQuery, setOrderSearchQuery] = useState("")
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null)
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false)

  // New order form state
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([])
  const [isBookingsLoading, setIsBookingsLoading] = useState(false)
  const [newOrderType, setNewOrderType] = useState<"room" | "table" | "takeaway">("room")
  const [selectedBookingId, setSelectedBookingId] = useState("")
  const [newOrderGuestName, setNewOrderGuestName] = useState("")
  const [newOrderTableNumber, setNewOrderTableNumber] = useState("")
  const [newOrderNotes, setNewOrderNotes] = useState("")
  const [newOrderItems, setNewOrderItems] = useState<{ menuItemId: string; quantity: number; notes: string }[]>([])
  const [orderMenuSearch, setOrderMenuSearch] = useState("")
  const [orderMenuCategory, setOrderMenuCategory] = useState("all")
  const [isNewOrderSaving, setIsNewOrderSaving] = useState(false)
  const [newOrderError, setNewOrderError] = useState("")

  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [menuViewMode, setMenuViewMode] = useState<"grid" | "list">("grid")
  const menuImageInputRef = useRef<HTMLInputElement>(null)

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

  // Available menu items for order
  const availableMenuItems = useMemo(() => {
    return menuItems
      .filter((item) => item.isAvailable)
      .filter((item) => orderMenuCategory === "all" || item.category === orderMenuCategory)
      .filter((item) => !orderMenuSearch || item.name.toLowerCase().includes(orderMenuSearch.toLowerCase()))
  }, [menuItems, orderMenuCategory, orderMenuSearch])

  // New order total
  const newOrderTotal = useMemo(() => {
    return newOrderItems.reduce((sum, item) => {
      const menuItem = menuItems.find((m) => m.id === item.menuItemId)
      return sum + (menuItem ? menuItem.price * item.quantity : 0)
    }, 0)
  }, [newOrderItems, menuItems])

  // Selected booking info
  const selectedBooking = useMemo(() => {
    return activeBookings.find((b) => b.id === selectedBookingId) || null
  }, [activeBookings, selectedBookingId])

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
    setImagePreview(null)
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
    setImagePreview(item.image || null)
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

  const handleUploadMenuImage = async (file: File) => {
    if (file.size > 200 * 1024) {
      setMenuFormError("L'image ne doit pas dépasser 200 Ko")
      return
    }

    setIsUploadingImage(true)

    if (editingMenuItem) {
      try {
        const formData = new FormData()
        formData.append("image", file)
        formData.append("type", "menu")
        formData.append("target", "menuItem")
        formData.append("targetId", editingMenuItem.id)

        const res = await fetch("/api/upload/image", { method: "POST", body: formData })
        const data = await res.json()

        if (res.ok) {
          setMenuFormData((prev) => ({ ...prev, image: data.image }))
          setImagePreview(data.image)
        } else {
          setMenuFormError(data.error || "Erreur lors du téléchargement de l'image")
        }
      } catch {
        setMenuFormError("Erreur lors du téléchargement de l'image")
      }
    } else {
      try {
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          setMenuFormData((prev) => ({ ...prev, image: dataUrl }))
          setImagePreview(dataUrl)
        }
        reader.readAsDataURL(file)
      } catch {
        setMenuFormError("Erreur lors de la lecture de l'image")
      }
    }

    setIsUploadingImage(false)
  }

  const handleRemoveMenuImage = () => {
    setMenuFormData((prev) => ({ ...prev, image: "" }))
    setImagePreview(null)
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

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return
    try {
      const response = await fetch(`/api/restaurant-orders/${orderToDelete.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setIsDeleteOrderDialogOpen(false)
        setOrderToDelete(null)
        fetchData()
      }
    } catch (err) {
      console.error("Erreur suppression commande:", err)
    }
  }

  const handleViewOrder = (order: RestaurantOrder) => {
    setSelectedOrder(order)
    setIsOrderDetailOpen(true)
  }

  // New order handlers
  const handleOpenNewOrder = async () => {
    setNewOrderType("room")
    setSelectedBookingId("")
    setNewOrderGuestName("")
    setNewOrderTableNumber("")
    setNewOrderNotes("")
    setNewOrderItems([])
    setOrderMenuSearch("")
    setOrderMenuCategory("all")
    setNewOrderError("")
    setIsNewOrderOpen(true)
    
    // Fetch active bookings (checked_in)
    setIsBookingsLoading(true)
    try {
      const res = await fetch("/api/bookings?status=checked_in")
      if (res.ok) {
        const data = await res.json()
        setActiveBookings(data.bookings || [])
      }
    } catch (err) {
      console.error("Erreur chargement réservations:", err)
    } finally {
      setIsBookingsLoading(false)
    }
  }

  const handleBookingSelect = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    const booking = activeBookings.find((b) => b.id === bookingId)
    if (booking) {
      setNewOrderGuestName(`${booking.guest.firstName} ${booking.guest.lastName}`)
    }
  }

  const handleAddOrderItem = (menuItemId: string) => {
    const existing = newOrderItems.find((item) => item.menuItemId === menuItemId)
    if (existing) {
      setNewOrderItems(newOrderItems.map((item) =>
        item.menuItemId === menuItemId ? { ...item, quantity: item.quantity + 1 } : item
      ))
    } else {
      setNewOrderItems([...newOrderItems, { menuItemId, quantity: 1, notes: "" }])
    }
  }

  const handleRemoveOrderItem = (menuItemId: string) => {
    setNewOrderItems(newOrderItems.filter((item) => item.menuItemId !== menuItemId))
  }

  const handleUpdateItemQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveOrderItem(menuItemId)
      return
    }
    setNewOrderItems(newOrderItems.map((item) =>
      item.menuItemId === menuItemId ? { ...item, quantity } : item
    ))
  }

  const handleSaveNewOrder = async () => {
    setNewOrderError("")

    if (newOrderItems.length === 0) {
      setNewOrderError("Ajoutez au moins un article à la commande")
      return
    }

    if (newOrderType === "room" && !selectedBookingId) {
      setNewOrderError("Sélectionnez une réservation (chambre)")
      return
    }

    if (newOrderType === "table" && !newOrderTableNumber) {
      setNewOrderError("Indiquez le numéro de table")
      return
    }

    if (newOrderType === "takeaway" && !newOrderGuestName) {
      setNewOrderError("Indiquez le nom du client")
      return
    }

    setIsNewOrderSaving(true)

    try {
      const booking = activeBookings.find((b) => b.id === selectedBookingId)
      
      const response = await fetch("/api/restaurant-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: newOrderType,
          roomId: booking?.roomId || null,
          bookingId: booking?.id || null,
          tableNumber: newOrderType === "table" ? newOrderTableNumber : null,
          guestName: newOrderGuestName || null,
          notes: newOrderNotes || null,
          items: newOrderItems.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes || null,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setNewOrderError(errorData.error || "Erreur lors de la création de la commande")
        setIsNewOrderSaving(false)
        return
      }

      setIsNewOrderOpen(false)
      setIsNewOrderSaving(false)
      setActiveTab("orders")
      fetchData()
    } catch (err) {
      setNewOrderError("Une erreur inattendue s'est produite")
      setIsNewOrderSaving(false)
    }
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
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-gray-500"><UtensilsCrossed className="w-3.5 h-3.5" /> Total: <strong>{menuStats.total}</strong></span>
            <span className="flex items-center gap-1.5 text-green-600"><CheckCircle className="w-3.5 h-3.5" /> Disponibles: <strong>{menuStats.available}</strong></span>
            <span className="flex items-center gap-1.5 text-green-600"><Leaf className="w-3.5 h-3.5" /> Végétarien: <strong>{menuStats.vegetarian}</strong></span>
            <span className="flex items-center gap-1.5 text-green-600"><Leaf className="w-3.5 h-3.5" /> Vegan: <strong>{menuStats.vegan}</strong></span>
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
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-r-none h-9 w-9", menuViewMode === "grid" && "bg-gray-100")}
                onClick={() => setMenuViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-l-none h-9 w-9", menuViewMode === "list" && "bg-gray-100")}
                onClick={() => setMenuViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
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

          {/* Menu Items - Grid View */}
          {menuViewMode === "grid" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenuItems.map((item) => (
              <Card key={item.id} className={cn(!item.isAvailable && "opacity-60", "overflow-hidden")}>
                {/* Image */}
                {item.image ? (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Badge variant="secondary" className="bg-red-500/90 text-white border-0">Indisponible</Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center">
                    <UtensilsCrossed className="w-12 h-12 text-orange-400" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{item.name}</h3>
                        {!item.isAvailable && !item.image && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">Indisponible</Badge>
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
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
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
          )}

          {/* Menu Items - List View */}
          {menuViewMode === "list" && (
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-2">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors",
                    !item.isAvailable && "opacity-60"
                  )}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center flex-shrink-0">
                      <UtensilsCrossed className="w-6 h-6 text-orange-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{item.name}</h3>
                      {!item.isAvailable && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">Indisponible</Badge>
                      )}
                      {item.isVegetarian && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">Végétarien</Badge>
                      )}
                      {item.isVegan && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">Vegan</Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-500 truncate">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className="font-semibold text-sky-600">{formatAmount(item.price)}</span>
                      {item.preparationTime && (
                        <span className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {item.preparationTime} min
                        </span>
                      )}
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
                </div>
              ))}
            </div>
          </ScrollArea>
          )}

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
          <div className="flex flex-wrap gap-3 text-sm">
            <button onClick={() => setOrderStatusFilter("pending")} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors">
              <Clock className="w-3.5 h-3.5 text-yellow-600" /> <strong>{orderStats.pending}</strong> En attente
            </button>
            <button onClick={() => setOrderStatusFilter("preparing")} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors">
              <ChefHat className="w-3.5 h-3.5 text-sky-600" /> <strong>{orderStats.preparing}</strong> En préparation
            </button>
            <button onClick={() => setOrderStatusFilter("ready")} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors">
              <CheckCircle className="w-3.5 h-3.5 text-green-600" /> <strong>{orderStats.ready}</strong> Prêtes
            </button>
            <span className="flex items-center gap-1.5 text-gray-500">
              <DollarSign className="w-3.5 h-3.5 text-sky-600" /> <strong>{formatAmount(orderStats.todayRevenue)}</strong> Revenus aujourd'hui
            </span>
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Commandes</CardTitle>
                <CardDescription>
                  {filteredOrders.length} commande{filteredOrders.length > 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleOpenNewOrder}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle commande
              </Button>
            </CardHeader>
            <CardContent>
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">Aucune commande</h3>
                  <p className="text-gray-500 mb-4">
                    {orderStatusFilter !== "all"
                      ? "Aucune commande avec ce statut"
                      : "Créez votre première commande restaurant"}
                  </p>
                  {orderStatusFilter === "all" && (
                    <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleOpenNewOrder}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle commande
                    </Button>
                  )}
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
                              {order.status === "cancelled" && (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setOrderToDelete(order)
                                    setIsDeleteOrderDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer la commande
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
                <Label>Photo</Label>
                <input
                  ref={menuImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUploadMenuImage(file)
                    e.target.value = ""
                  }}
                />
                {imagePreview || menuFormData.image ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview || menuFormData.image}
                      alt="Aperçu"
                      className="w-20 h-20 rounded-lg object-cover border"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveMenuImage}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-20 h-20 rounded-lg border-dashed flex flex-col items-center justify-center gap-1"
                    onClick={() => menuImageInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-gray-400" />
                        <span className="text-xs text-gray-400">Photo</span>
                      </>
                    )}
                  </Button>
                )}
                <p className="text-xs text-gray-400">Max 200 Ko</p>
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

      {/* Delete Order Dialog */}
      <AlertDialog open={isDeleteOrderDialogOpen} onOpenChange={setIsDeleteOrderDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la commande</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la commande{" "}
              <strong>de {orderToDelete?.guestName || "client"}</strong>
              {orderToDelete?.orderType === "room" ? " (Service en chambre)" : orderToDelete?.orderType === "table" ? " (Sur place)" : " (À emporter)"} ?
              <br />
              <span className="text-red-600 font-medium">Cette action est irréversible.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
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

      {/* New Order Dialog */}
      <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-600" />
              Nouvelle commande
            </DialogTitle>
            <DialogDescription>
              Créez une commande pour un client ou une chambre
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 py-4">
            {newOrderError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-lg">
                {newOrderError}
              </div>
            )}

            {/* Order Type Selection */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "room" as const, label: "Service en chambre", icon: BedDouble, desc: "Commande livrée à la chambre" },
                { value: "table" as const, label: "Sur place", icon: UtensilsCrossed, desc: "Commande à table" },
                { value: "takeaway" as const, label: "À emporter", icon: DoorOpen, desc: "Commande à emporter" },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => { setNewOrderType(type.value) }}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-all",
                    newOrderType === type.value
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  )}
                >
                  <type.icon className={cn("w-6 h-6 mb-2", newOrderType === type.value ? "text-orange-600" : "text-gray-400")} />
                  <p className={cn("font-medium text-sm", newOrderType === type.value ? "text-orange-700" : "")}>{type.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                </button>
              ))}
            </div>

            {/* Room/Booking Selection (for room service) */}
            {newOrderType === "room" && (
              <div className="space-y-2">
                <Label>Chambre / Réservation *</Label>
                {isBookingsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement des réservations...
                  </div>
                ) : activeBookings.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">Aucun client enregistré (check-in) trouvé</p>
                ) : (
                  <Select value={selectedBookingId} onValueChange={handleBookingSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une chambre..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeBookings.map((booking) => (
                        <SelectItem key={booking.id} value={booking.id}>
                          Ch. {booking.room.number}{booking.room.name ? ` - ${booking.room.name}` : ""} — {booking.guest.firstName} {booking.guest.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedBooking && (
                  <div className="p-3 bg-sky-50 dark:bg-sky-950 rounded-lg text-sm">
                    <p className="font-medium">{selectedBooking.guest.firstName} {selectedBooking.guest.lastName}</p>
                    <p className="text-gray-500">Chambre {selectedBooking.room.number} • {selectedBooking.room.type}</p>
                    {selectedBooking.guest.phone && <p className="text-gray-500">{selectedBooking.guest.phone}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Table Number (for dine-in) */}
            {newOrderType === "table" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Numéro de table *</Label>
                  <Input
                    placeholder="Ex: 1, 5, Terrasse..."
                    value={newOrderTableNumber}
                    onChange={(e) => setNewOrderTableNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom du client</Label>
                  <Input
                    placeholder="Optionnel"
                    value={newOrderGuestName}
                    onChange={(e) => setNewOrderGuestName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Guest Name (for takeaway) */}
            {newOrderType === "takeaway" && (
              <div className="space-y-2">
                <Label>Nom du client *</Label>
                <Input
                  placeholder="Nom du client"
                  value={newOrderGuestName}
                  onChange={(e) => setNewOrderGuestName(e.target.value)}
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Notes ou instructions spéciales..."
                value={newOrderNotes}
                onChange={(e) => setNewOrderNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Menu Items Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Articles</Label>
                {newOrderItems.length > 0 && (
                  <Badge variant="secondary">{newOrderItems.length} article{newOrderItems.length > 1 ? "s" : ""}</Badge>
                )}
              </div>

              {/* Menu search/filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un article..."
                    value={orderMenuSearch}
                    onChange={(e) => setOrderMenuSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={orderMenuCategory} onValueChange={setOrderMenuCategory}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Available menu items */}
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                {availableMenuItems.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Aucun article disponible</p>
                ) : (
                  availableMenuItems.map((item) => {
                    const inOrder = newOrderItems.find((oi) => oi.menuItemId === item.id)
                    return (
                      <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-900 rounded">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">{formatAmount(item.price)}</p>
                        </div>
                        {inOrder ? (
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleUpdateItemQuantity(item.id, inOrder.quantity - 1)}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">{inOrder.quantity}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleUpdateItemQuantity(item.id, inOrder.quantity + 1)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAddOrderItem(item.id)}>
                            <Plus className="w-3 h-3 mr-1" />
                            Ajouter
                          </Button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Selected items summary */}
              {newOrderItems.length > 0 && (
                <div className="border rounded-lg p-3 space-y-2 bg-gray-50 dark:bg-gray-900">
                  <p className="text-sm font-medium text-gray-500">Récapitulatif</p>
                  {newOrderItems.map((item) => {
                    const menuItem = menuItems.find((m) => m.id === item.menuItemId)
                    if (!menuItem) return null
                    return (
                      <div key={item.menuItemId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-gray-500">{item.quantity}x</span>
                          <span className="truncate">{menuItem.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatAmount(menuItem.price * item.quantity)}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-600" onClick={() => handleRemoveOrderItem(item.menuItemId)}>
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>Total</span>
                    <span className="text-orange-600">{formatAmount(newOrderTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsNewOrderOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleSaveNewOrder}
              disabled={isNewOrderSaving || newOrderItems.length === 0}
            >
              {isNewOrderSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Créer la commande
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
