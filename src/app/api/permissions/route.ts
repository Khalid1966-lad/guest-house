import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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

// Safely fetch menuAccess using raw SQL — works even if column doesn't exist
async function getUserMenuAccess(userId: string): Promise<Record<string, boolean> | null> {
  try {
    // Try raw SQL to avoid Prisma typed query crashing on missing column
    const rows = await db.$queryRawUnsafe<{ menuAccess: unknown }[]>(
      `SELECT "menuAccess" FROM "User" WHERE "id" = '${userId.replace(/'/g, "''")}' LIMIT 1`
    )
    if (rows.length === 0 || !rows[0].menuAccess) return null

    const raw = rows[0].menuAccess
    if (typeof raw === "string") {
      try { return JSON.parse(raw) } catch { return null }
    }
    return raw as Record<string, boolean>
  } catch {
    // Column doesn't exist — return null (all menus off)
    return null
  }
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

    // Fetch user's menuAccess using raw SQL (resilient to missing column)
    const menuAccess = await getUserMenuAccess(session.user.id)

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
