import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Get current user's permissions
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

    // Get the role permissions for this user
    const role = await db.role.findFirst({
      where: {
        guestHouseId: session.user.guestHouseId,
        name: session.user.role,
      },
    })

    // If no role record exists, return default permissions based on role name
    if (!role) {
      const defaultPermissions: Record<string, Record<string, boolean>> = {
        owner: {
          canViewDashboard: true,
          canViewRooms: true,
          canViewBookings: true,
          canViewGuests: true,
          canViewInvoices: true,
          canViewRestaurant: true,
          canViewExpenses: true,
          canViewStatistics: true,
          canViewSettings: true,
          canViewUsers: true,
          canCreateBookings: true,
          canEditBookings: true,
          canDeleteBookings: true,
          canCreateInvoices: true,
          canEditInvoices: true,
          canDeleteInvoices: true,
          canManageRooms: true,
          canManageGuests: true,
          canManageExpenses: true,
          canManageUsers: true,
          canManageSettings: true,
          canViewRevenue: true,
          canApplyDiscounts: true,
          canRefundPayments: true,
        },
        manager: {
          canViewDashboard: true,
          canViewRooms: true,
          canViewBookings: true,
          canViewGuests: true,
          canViewInvoices: true,
          canViewRestaurant: true,
          canViewExpenses: true,
          canViewStatistics: true,
          canViewSettings: false,
          canViewUsers: false,
          canCreateBookings: true,
          canEditBookings: true,
          canDeleteBookings: true,
          canCreateInvoices: true,
          canEditInvoices: true,
          canDeleteInvoices: true,
          canManageRooms: true,
          canManageGuests: true,
          canManageExpenses: true,
          canManageUsers: false,
          canManageSettings: false,
          canViewRevenue: true,
          canApplyDiscounts: true,
          canRefundPayments: false,
        },
        receptionist: {
          canViewDashboard: true,
          canViewRooms: true,
          canViewBookings: true,
          canViewGuests: true,
          canViewInvoices: true,
          canViewRestaurant: false,
          canViewExpenses: false,
          canViewStatistics: false,
          canViewSettings: false,
          canViewUsers: false,
          canCreateBookings: true,
          canEditBookings: true,
          canDeleteBookings: false,
          canCreateInvoices: true,
          canEditInvoices: false,
          canDeleteInvoices: false,
          canManageRooms: false,
          canManageGuests: true,
          canManageExpenses: false,
          canManageUsers: false,
          canManageSettings: false,
          canViewRevenue: false,
          canApplyDiscounts: false,
          canRefundPayments: false,
        },
        accountant: {
          canViewDashboard: true,
          canViewRooms: false,
          canViewBookings: true,
          canViewGuests: true,
          canViewInvoices: true,
          canViewRestaurant: true,
          canViewExpenses: true,
          canViewStatistics: true,
          canViewSettings: false,
          canViewUsers: false,
          canCreateBookings: false,
          canEditBookings: false,
          canDeleteBookings: false,
          canCreateInvoices: true,
          canEditInvoices: true,
          canDeleteInvoices: true,
          canManageRooms: false,
          canManageGuests: false,
          canManageExpenses: true,
          canManageUsers: false,
          canManageSettings: false,
          canViewRevenue: true,
          canApplyDiscounts: true,
          canRefundPayments: false,
        },
        housekeeping: {
          canViewDashboard: false,
          canViewRooms: true,
          canViewBookings: true,
          canViewGuests: false,
          canViewInvoices: false,
          canViewRestaurant: true,
          canViewExpenses: false,
          canViewStatistics: false,
          canViewSettings: false,
          canViewUsers: false,
          canCreateBookings: false,
          canEditBookings: false,
          canDeleteBookings: false,
          canCreateInvoices: false,
          canEditInvoices: false,
          canDeleteInvoices: false,
          canManageRooms: true,
          canManageGuests: false,
          canManageExpenses: false,
          canManageUsers: false,
          canManageSettings: false,
          canViewRevenue: false,
          canApplyDiscounts: false,
          canRefundPayments: false,
        },
        // Legacy fallback for old "staff" role
        staff: {
          canViewDashboard: true,
          canViewRooms: true,
          canViewBookings: true,
          canViewGuests: true,
          canViewInvoices: true,
          canViewRestaurant: true,
          canViewExpenses: false,
          canViewStatistics: false,
          canViewSettings: false,
          canViewUsers: false,
          canCreateBookings: true,
          canEditBookings: true,
          canDeleteBookings: false,
          canCreateInvoices: true,
          canEditInvoices: false,
          canDeleteInvoices: false,
          canManageRooms: false,
          canManageGuests: true,
          canManageExpenses: false,
          canManageUsers: false,
          canManageSettings: false,
          canViewRevenue: false,
          canApplyDiscounts: false,
          canRefundPayments: false,
        },
      }

      const permissions = defaultPermissions[session.user.role] || defaultPermissions.staff

      return NextResponse.json({ permissions })
    }

    return NextResponse.json({ permissions: role })
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des permissions" },
      { status: 500 }
    )
  }
}
