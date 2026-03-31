"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  Users,
  CreditCard,
  UtensilsCrossed,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Hotel,
  Menu,
  ChevronDown,
  Bell,
  Moon,
  Sun,
  Shield,
  Building2,
  Activity,
  Database,
  UserCog,
  type LucideIcon,
} from "lucide-react"
import { useTheme } from "next-themes"

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  permission?: string
}

// ============================================
// Navigation GUEST HOUSE (utilisateurs normaux)
// ============================================
const guestHouseNavigation: NavItem[] = [
  { name: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard, permission: "canViewDashboard" },
  { name: "Chambres", href: "/app/rooms", icon: BedDouble, permission: "canViewRooms" },
  { name: "Réservations", href: "/app/bookings", icon: CalendarDays, permission: "canViewBookings" },
  { name: "Clients", href: "/app/guests", icon: Users, permission: "canViewGuests" },
  { name: "Facturation", href: "/app/invoices", icon: CreditCard, permission: "canViewInvoices" },
  { name: "Restaurant", href: "/app/restaurant", icon: UtensilsCrossed, permission: "canViewRestaurant" },
  { name: "Dépenses", href: "/app/expenses", icon: Receipt, permission: "canViewExpenses" },
  { name: "Statistiques", href: "/app/statistics", icon: BarChart3, permission: "canViewStatistics" },
  { name: "Paramètres", href: "/app/settings", icon: Settings, permission: "canViewSettings" },
]

// ============================================
// Navigation SUPER ADMIN (interface d'administration)
// ============================================
const adminNavigation: NavItem[] = [
  { name: "Maisons d'hôtes", href: "/app/admin/guesthouses", icon: Building2 },
  { name: "Sauvegarde", href: "/app/admin/backup", icon: Database },
]

interface Permissions {
  canViewDashboard?: boolean
  canViewRooms?: boolean
  canViewBookings?: boolean
  canViewGuests?: boolean
  canViewInvoices?: boolean
  canViewRestaurant?: boolean
  canViewExpenses?: boolean
  canViewStatistics?: boolean
  canViewSettings?: boolean
  canViewUsers?: boolean
  [key: string]: boolean | undefined
}

// ============================================
// SIDEBAR CONTENT — switch automatique selon le rôle
// ============================================
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [permissions, setPermissions] = useState<Permissions | null>(null)

  const isSuperAdmin = session?.user?.role === "super_admin"

  // Fetch permissions uniquement pour les utilisateurs non-admin
  useEffect(() => {
    if (isSuperAdmin) return
    const fetchPermissions = async () => {
      try {
        const response = await fetch("/api/permissions")
        if (response.ok) {
          const data = await response.json()
          setPermissions(data.permissions)
        }
      } catch (error) {
        console.error("Error fetching permissions:", error)
      }
    }

    if (session?.user) {
      fetchPermissions()
    }
  }, [session, isSuperAdmin])

  // Filtrer la navigation selon les permissions
  const filteredNavigation = useMemo(() => {
    if (!permissions) return guestHouseNavigation
    return guestHouseNavigation.filter((item) => {
      if (!item.permission) return true
      return permissions[item.permission] === true
    })
  }, [permissions])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  // Rendu conditionnel : Super Admin vs Guest House
  if (isSuperAdmin) {
    return (
      <div className="flex h-full flex-col">
        {/* Logo Admin */}
        <div className="flex h-16 items-center gap-2 px-6 border-b">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-lg leading-tight">PMS Admin</h1>
            <p className="text-xs text-muted-foreground">Administration système</p>
          </div>
        </div>

        {/* Navigation Admin */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {adminNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-100"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Badge Super Admin */}
        <div className="mx-3 mb-3 p-3 rounded-lg bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-600" />
            <span className="text-xs font-medium text-violet-700 dark:text-violet-300">Mode Administrateur</span>
          </div>
          <p className="text-xs text-violet-500 mt-1">Accès global à toutes les maisons d'hôtes</p>
        </div>

        {/* User menu */}
        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                  <p className="text-xs text-violet-600 font-medium">Super Admin</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? (
                  <><Sun className="mr-2 h-4 w-4" />Mode clair</>
                ) : (
                  <><Moon className="mr-2 h-4 w-4" />Mode sombre</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  // ============================================
  // SIDEBAR GUEST HOUSE (utilisateur normal)
  // ============================================
  return (
    <div className="flex h-full flex-col">
      {/* Logo Guest House */}
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
          <Hotel className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-lg leading-tight">PMS</h1>
          <p className="text-xs text-muted-foreground">
            {session?.user?.guestHouseName || "Guest House"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-100"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User menu */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sky-100 text-sky-700 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {session?.user?.role}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/settings/profile" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? (
                <><Sun className="mr-2 h-4 w-4" />Mode clair</>
              ) : (
                <><Moon className="mr-2 h-4 w-4" />Mode sombre</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-40 p-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="bg-white dark:bg-gray-900 shadow-md">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarContent onNavigate={() => setIsOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-gray-900 border-r">
        <SidebarContent />
      </aside>
    </>
  )
}

// ============================================
// HEADER — adapté selon le rôle
// ============================================
export function Header() {
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === "super_admin"

  return (
    <header className="h-16 border-b bg-white dark:bg-gray-900 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile spacer for menu button */}
      <div className="lg:hidden w-10" />

      {/* Breadcrumb or page title */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Notifications — uniquement pour les gestionnaires de maison d'hôtes */}
        {!isSuperAdmin && (
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>
        )}

        {/* Nouvelle réservation — uniquement pour les gestionnaires */}
        {!isSuperAdmin && (
          <Button className="bg-sky-600 hover:bg-sky-700 hidden sm:flex">
            + Nouvelle réservation
          </Button>
        )}
      </div>
    </header>
  )
}
