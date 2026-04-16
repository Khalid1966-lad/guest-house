import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

// Menu keys matching the sidebar navigation
const ALL_MENUS = [
  "dashboard",
  "rooms",
  "housekeeping",
  "bookings",
  "guests",
  "invoices",
  "restaurant",
  "expenses",
  "statistics",
  "users",
  "settings",
] as const

// Map menu keys to the old permission names (for backward compatibility)
const MENU_TO_PERMISSION: Record<string, string> = {
  dashboard: "canViewDashboard",
  rooms: "canViewRooms",
  housekeeping: "canManageHousekeeping",
  bookings: "canViewBookings",
  guests: "canViewGuests",
  invoices: "canViewInvoices",
  restaurant: "canViewRestaurant",
  expenses: "canViewExpenses",
  statistics: "canViewStatistics",
  users: "canViewUsers",
  settings: "canViewSettings",
}

// GET - Get current user's permissions based on menuAccess
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Super admin: no permissions needed, return empty (sidebar handles it)
    if (session.user.role === "super_admin") {
      return NextResponse.json({ permissions: {} })
    }

    if (!session.user.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Owners ALWAYS have all permissions
    if (session.user.role === "owner") {
      const allPermissions: Record<string, boolean> = {}
      for (const perm of Object.values(MENU_TO_PERMISSION)) {
        allPermissions[perm] = true
      }
      // Add action-level permissions for owners
      allPermissions.canCreateBookings = true
      allPermissions.canEditBookings = true
      allPermissions.canDeleteBookings = true
      allPermissions.canCreateInvoices = true
      allPermissions.canEditInvoices = true
      allPermissions.canDeleteInvoices = true
      allPermissions.canManageRooms = true
      allPermissions.canManageGuests = true
      allPermissions.canManageExpenses = true
      allPermissions.canManageUsers = true
      allPermissions.canManageSettings = true
      allPermissions.canViewRevenue = true
      allPermissions.canApplyDiscounts = true
      allPermissions.canRefundPayments = true
      return NextResponse.json({ permissions: allPermissions })
    }

    // Fetch user's menuAccess from database — resilient to missing column
    let menuAccess: Record<string, boolean> | null = null
    try {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { menuAccess: true },
      })
      if (user?.menuAccess) {
        if (typeof user.menuAccess === "string") {
          try { menuAccess = JSON.parse(user.menuAccess) } catch { menuAccess = null }
        } else {
          menuAccess = user.menuAccess as unknown as Record<string, boolean>
        }
      }
    } catch (err) {
      // Column doesn't exist yet (migration not applied) — fall through to no access
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        console.warn("[permissions] menuAccess column missing, user gets no menus")
      } else {
        throw err
      }
    }

    // Build permissions from menuAccess
    const permissions: Record<string, boolean> = {}
    for (const menu of ALL_MENUS) {
      const permName = MENU_TO_PERMISSION[menu]
      permissions[permName] = menuAccess?.[menu] === true
    }

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des permissions" },
      { status: 500 }
    )
  }
}
