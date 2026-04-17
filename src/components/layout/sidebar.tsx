"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Shield,
  ShieldAlert,
  Building2,
  HelpCircle,
  Lock,
  UserCog,
  Sparkles,
  Database,
  Crown,
  type LucideIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useSidebarStore } from "@/stores/sidebar-store"
import { NotificationBell } from "@/components/notification-bell"

// ─── Nav Item with color & animation ─────────────────────────────────────

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  permission?: string
  // Color palette — each icon gets a logical color
  iconColor: string       // CSS color for icon — applied via inline style
  hoverBg: string        // e.g. "hover:bg-violet-50 dark:hover:bg-violet-950"
  activeBg: string       // e.g. "bg-violet-100 dark:bg-violet-900/40"
  activeText: string     // e.g. "text-violet-700 dark:text-violet-300"
  animClass: string      // e.g. "icon-pop"
  glowColor: string      // CSS color for tooltip border accent
  hoverTextColor: string // CSS color for title hover effect
}

const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
    permission: "canViewDashboard",
    iconColor: "#8b5cf6",
    hoverBg: "hover:bg-violet-50 dark:hover:bg-violet-950/60",
    activeBg: "bg-violet-100 dark:bg-violet-900/40",
    activeText: "text-violet-700 dark:text-violet-300",
    animClass: "icon-pop",
    glowColor: "rgba(139, 92, 246, 0.25)",
    hoverTextColor: "#7c3aed",
  },
  {
    name: "Chambres",
    href: "/app/rooms",
    icon: BedDouble,
    permission: "canViewRooms",
    iconColor: "#10b981",
    hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/60",
    activeBg: "bg-emerald-100 dark:bg-emerald-900/40",
    activeText: "text-emerald-700 dark:text-emerald-300",
    animClass: "icon-bounce",
    glowColor: "rgba(16, 185, 129, 0.25)",
    hoverTextColor: "#059669",
  },
  {
    name: "Ménage",
    href: "/app/housekeeping",
    icon: Sparkles,
    permission: "canManageHousekeeping",
    iconColor: "#ec4899",
    hoverBg: "hover:bg-pink-50 dark:hover:bg-pink-950/60",
    activeBg: "bg-pink-100 dark:bg-pink-900/40",
    activeText: "text-pink-700 dark:text-pink-300",
    animClass: "icon-glow",
    glowColor: "rgba(236, 72, 153, 0.25)",
    hoverTextColor: "#db2777",
  },
  {
    name: "Réservations",
    href: "/app/bookings",
    icon: CalendarDays,
    permission: "canViewBookings",
    iconColor: "#0ea5e9",
    hoverBg: "hover:bg-sky-50 dark:hover:bg-sky-950/60",
    activeBg: "bg-sky-100 dark:bg-sky-900/40",
    activeText: "text-sky-700 dark:text-sky-300",
    animClass: "icon-glow",
    glowColor: "rgba(14, 165, 233, 0.25)",
    hoverTextColor: "#0284c7",
  },
  {
    name: "Clients",
    href: "/app/guests",
    icon: Users,
    permission: "canViewGuests",
    iconColor: "#f59e0b",
    hoverBg: "hover:bg-amber-50 dark:hover:bg-amber-950/60",
    activeBg: "bg-amber-100 dark:bg-amber-900/40",
    activeText: "text-amber-700 dark:text-amber-300",
    animClass: "icon-slide",
    glowColor: "rgba(245, 158, 11, 0.25)",
    hoverTextColor: "#d97706",
  },
  {
    name: "Facturation",
    href: "/app/invoices",
    icon: CreditCard,
    permission: "canViewInvoices",
    iconColor: "#f43f5e",
    hoverBg: "hover:bg-rose-50 dark:hover:bg-rose-950/60",
    activeBg: "bg-rose-100 dark:bg-rose-900/40",
    activeText: "text-rose-700 dark:text-rose-300",
    animClass: "icon-wiggle",
    glowColor: "rgba(244, 63, 94, 0.25)",
    hoverTextColor: "#e11d48",
  },
  {
    name: "Restaurant",
    href: "/app/restaurant",
    icon: UtensilsCrossed,
    permission: "canViewRestaurant",
    iconColor: "#f97316",
    hoverBg: "hover:bg-orange-50 dark:hover:bg-orange-950/60",
    activeBg: "bg-orange-100 dark:bg-orange-900/40",
    activeText: "text-orange-700 dark:text-orange-300",
    animClass: "icon-wiggle",
    glowColor: "rgba(249, 115, 22, 0.25)",
    hoverTextColor: "#ea580c",
  },
  {
    name: "Dépenses",
    href: "/app/expenses",
    icon: Receipt,
    permission: "canViewExpenses",
    iconColor: "#ef4444",
    hoverBg: "hover:bg-red-50 dark:hover:bg-red-950/60",
    activeBg: "bg-red-100 dark:bg-red-900/40",
    activeText: "text-red-700 dark:text-red-300",
    animClass: "icon-slide",
    glowColor: "rgba(239, 68, 68, 0.25)",
    hoverTextColor: "#dc2626",
  },
  {
    name: "Statistiques",
    href: "/app/statistics",
    icon: BarChart3,
    permission: "canViewStatistics",
    iconColor: "#6366f1",
    hoverBg: "hover:bg-indigo-50 dark:hover:bg-indigo-950/60",
    activeBg: "bg-indigo-100 dark:bg-indigo-900/40",
    activeText: "text-indigo-700 dark:text-indigo-300",
    animClass: "icon-pop",
    glowColor: "rgba(99, 102, 241, 0.25)",
    hoverTextColor: "#4f46e5",
  },
  {
    name: "Utilisateurs",
    href: "/app/settings/users",
    icon: UserCog,
    permission: "canViewUsers",
    iconColor: "#a855f7",
    hoverBg: "hover:bg-purple-50 dark:hover:bg-purple-950/60",
    activeBg: "bg-purple-100 dark:bg-purple-900/40",
    activeText: "text-purple-700 dark:text-purple-300",
    animClass: "icon-glow",
    glowColor: "rgba(168, 85, 247, 0.25)",
    hoverTextColor: "#7c3aed",
  },
  {
    name: "Guide",
    href: "/app/guide",
    icon: HelpCircle,
    iconColor: "#14b8a6",
    hoverBg: "hover:bg-teal-50 dark:hover:bg-teal-950/60",
    activeBg: "bg-teal-100 dark:bg-teal-900/40",
    activeText: "text-teal-700 dark:text-teal-300",
    animClass: "icon-bounce",
    glowColor: "rgba(20, 184, 166, 0.25)",
    hoverTextColor: "#0d9488",
  },
  {
    name: "Paramètres",
    href: "/app/settings",
    icon: Settings,
    permission: "canViewSettings",
    iconColor: "#64748b",
    hoverBg: "hover:bg-slate-100 dark:hover:bg-slate-800",
    activeBg: "bg-slate-200 dark:bg-slate-700/50",
    activeText: "text-slate-700 dark:text-slate-300",
    animClass: "icon-glow",
    glowColor: "rgba(100, 116, 139, 0.25)",
    hoverTextColor: "#475569",
  },
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

// ─── Sidebar Content ──────────────────────────────────────────────────────

function SidebarContent({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [permissions, setPermissions] = useState<Permissions | null>(null)

  useEffect(() => {
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
    if (session?.user) fetchPermissions()
  }, [session])

  // ALL non-super_admin users see ALL menus — unauthorized ones get locked badge
  const filteredNavigation = useMemo(() => {
    if (session?.user?.role === "super_admin") return []
    return navigation
  }, [session])

  const hasPermission = (item: NavItem) => {
    if (!item.permission) return true
    return permissions?.[item.permission] === true
  }

  const isSuperAdmin = session?.user?.role === "super_admin"

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b transition-all duration-300",
        collapsed ? "h-16 justify-center px-2" : "h-16 gap-2 px-4"
      )}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-200 dark:shadow-sky-900/40">
          <Hotel className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-lg leading-tight bg-gradient-to-r from-sky-600 to-sky-800 dark:from-sky-400 dark:to-sky-200 bg-clip-text text-transparent">
              PMS GUESTHOUSE
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {isSuperAdmin ? "Administration" : (session?.user?.guestHouseName || "Guest House")}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto overflow-x-hidden">
        {isSuperAdmin ? (
          <>
            <Link
              href="/app/admin/guesthouses"
              onClick={onNavigate}
              className={cn(
                "sidebar-nav-item flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors text-gray-600 hover:bg-sky-50 dark:text-gray-400 dark:hover:bg-sky-950/60",
                pathname === "/app/admin/guesthouses" && "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 font-semibold shadow-sm"
              )}
            >
              <Building2 className="h-5 w-5 flex-shrink-0 text-sky-500 sidebar-icon icon-glow" />
              {!collapsed && <span className="ml-3">Maisons d&apos;hôtes</span>}
            </Link>
            <Link
              href="/app/admin/subscriptions"
              onClick={onNavigate}
              className={cn(
                "sidebar-nav-item flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors text-gray-600 hover:bg-violet-50 dark:text-gray-400 dark:hover:bg-violet-950/60",
                pathname === "/app/admin/subscriptions" && "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-semibold shadow-sm"
              )}
            >
              <Crown className="h-5 w-5 flex-shrink-0 text-violet-500 sidebar-icon icon-pop" />
              {!collapsed && <span className="ml-3">Abonnements</span>}
            </Link>
            <Link
              href="/app/admin/backup"
              onClick={onNavigate}
              className={cn(
                "sidebar-nav-item flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors text-gray-600 hover:bg-amber-50 dark:text-gray-400 dark:hover:bg-amber-950/60",
                pathname === "/app/admin/backup" && "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold shadow-sm"
              )}
            >
              <Database className="h-5 w-5 flex-shrink-0 text-amber-500 sidebar-icon icon-slide" />
              {!collapsed && <span className="ml-3">Sauvegardes</span>}
            </Link>
          </>
        ) : (
          filteredNavigation.map((item) => {
            const permitted = hasPermission(item)
            // Smart active check: exact match OR prefix match (but not if a more specific nav item matches)
            const hasMoreSpecificMatch = filteredNavigation.some(
              (other) => other.href !== item.href && pathname.startsWith(other.href) && other.href.length > item.href.length
            )
            const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && !hasMoreSpecificMatch)

            // Restricted item — show locked badge for unauthorized menus
            if (!permitted) {
              const restrictedEl = (
                <div
                  key={item.name}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-200 w-full",
                    collapsed && "justify-center px-0",
                    "text-gray-300 dark:text-gray-600 cursor-not-allowed select-none"
                  )}
                  title="Accès restreint"
                >
                  <div className="relative">
                    <item.icon
                      className="h-5 w-5 flex-shrink-0"
                      style={{ color: "currentColor" }}
                    />
                    <Lock className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-gray-400 dark:text-gray-600" />
                  </div>
                  {!collapsed && (
                    <span className="ml-3 flex items-center gap-1.5">
                      <span>{item.name}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full leading-none">
                        Restreint
                      </span>
                    </span>
                  )}
                </div>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.name} delayDuration={0}>
                    <TooltipTrigger asChild>
                      {restrictedEl}
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="font-medium text-gray-400"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{item.name} — Accès restreint</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return restrictedEl
            }

            const linkEl = (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "sidebar-nav-item flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 w-full",
                  collapsed && "justify-center px-0",
                  // Default state
                  !isActive && cn(
                    "text-gray-500 dark:text-gray-500",
                    item.hoverBg
                  ),
                  // Active state: colorful
                  isActive && cn(
                    item.activeBg,
                    item.activeText,
                    "font-semibold",
                    "shadow-sm"
                  ),
                )}
                style={{ '--nav-hover-color': item.hoverTextColor } as React.CSSProperties}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 sidebar-icon",
                    item.animClass
                  )}
                  style={{ color: item.iconColor }}
                />
                {!collapsed && (
                  <span className={cn(
                    "ml-3 transition-colors duration-200 nav-label",
                    !isActive && "text-gray-600 dark:text-gray-400"
                  )}>
                    {item.name}
                  </span>
                )}
              </Link>
            )

            // Collapsed: wrap with tooltip
            if (collapsed) {
              return (
                <Tooltip key={item.name} delayDuration={0}>
                  <TooltipTrigger asChild>
                    {linkEl}
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="font-medium"
                    style={{ borderLeft: `3px solid ${item.glowColor}` }}
                  >
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return linkEl
          })
        )}
      </nav>

      {/* User menu */}
      <div className="border-t p-3">
        {collapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-full mx-auto">
                <Avatar className="h-8 w-8 ring-2 ring-sky-200 dark:ring-sky-800">
                  {session?.user?.avatar && <AvatarImage src={session.user.avatar} alt={session.user.name || ""} />}
                  <AvatarFallback className="bg-sky-100 text-sky-700 text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
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
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    Mode clair
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    Mode sombre
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 px-2">
                <Avatar className="h-8 w-8 ring-2 ring-sky-200 dark:ring-sky-800">
                  {session?.user?.avatar && <AvatarImage src={session.user.avatar} alt={session.user.name || ""} />}
                  <AvatarFallback className="bg-sky-100 text-sky-700 text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {session?.user?.role === "super_admin" ? "Super Admin" : session?.user?.role}
                  </p>
                </div>
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
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    Mode clair
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    Mode sombre
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

// ─── Sidebar (Desktop + Mobile) ───────────────────────────────────────────

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const collapsed = useSidebarStore((s) => s.collapsed)
  const toggle = useSidebarStore((s) => s.toggle)

  return (
    <>
      {/* Mobile */}
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

      {/* Desktop */}
      <aside className={cn(
        "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-gray-900 border-r transition-all duration-300 z-30",
        collapsed ? "lg:w-[68px]" : "lg:w-64"
      )}>
        <SidebarContent collapsed={collapsed} />

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className={cn(
            "absolute -right-3 top-20 w-6 h-6 rounded-full border bg-white dark:bg-gray-900 dark:border-gray-700",
            "flex items-center justify-center text-gray-400 hover:text-sky-600 dark:hover:text-sky-400",
            "transition-all duration-200 hover:scale-125 hover:bg-sky-50 dark:hover:bg-sky-950 shadow-sm z-40"
          )}
          title={collapsed ? "Développer le menu" : "Réduire le menu"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </aside>
    </>
  )
}

// ─── Header ────────────────────────────────────────────────────────────────

function HeaderUserMenu() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Avatar className="h-8 w-8 ring-2 ring-sky-200 dark:ring-sky-800">
            {session?.user?.avatar && <AvatarImage src={session.user.avatar} alt={session.user.name || ""} />}
            <AvatarFallback className="bg-sky-100 text-sky-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="text-sm font-medium truncate">{session?.user?.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {session?.user?.role === "super_admin" ? "Super Admin" : session?.user?.role}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/settings/profile" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              Mode clair
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              Mode sombre
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Header() {
  return (
    <header className="h-16 border-b bg-white dark:bg-gray-900 flex items-center justify-between px-4 lg:px-6">
      <div className="lg:hidden w-10" />
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <NotificationBell />
        {/* Mobile-only user menu for quick disconnect */}
        <div className="lg:hidden">
          <HeaderUserMenu />
        </div>
      </div>
    </header>
  )
}
