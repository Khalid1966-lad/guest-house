import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - List roles for the guest house
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const roles = await db.role.findMany({
      where: {
        guestHouseId: session.user.guestHouseId,
      },
      orderBy: { name: "asc" },
    })

    // If no roles exist, return default templates
    if (roles.length === 0) {
      return NextResponse.json({
        roles: [],
        templates: [
          {
            name: "owner",
            label: "Propriétaire",
            description: "Accès complet à toutes les fonctionnalités",
            permissions: {
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
          },
          {
            name: "manager",
            label: "Gestionnaire",
            description: "Gestion des réservations, clients et factures",
            permissions: {
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
          },
          {
            name: "staff",
            label: "Personnel",
            description: "Accès de base aux réservations et clients",
            permissions: {
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
          },
        ],
      })
    }

    return NextResponse.json({ roles })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rôles" },
      { status: 500 }
    )
  }
}

// POST - Create a new role
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Only owner can manage roles
    if (session.user.role !== "owner") {
      return NextResponse.json(
        { error: "Seul le propriétaire peut gérer les rôles" },
        { status: 403 }
      )
    }

    const data = await request.json()
    const {
      name,
      label,
      canViewDashboard,
      canViewRooms,
      canViewBookings,
      canViewGuests,
      canViewInvoices,
      canViewRestaurant,
      canViewExpenses,
      canViewStatistics,
      canViewSettings,
      canViewUsers,
      canCreateBookings,
      canEditBookings,
      canDeleteBookings,
      canCreateInvoices,
      canEditInvoices,
      canDeleteInvoices,
      canManageRooms,
      canManageGuests,
      canManageExpenses,
      canManageUsers,
      canManageSettings,
      canViewRevenue,
      canApplyDiscounts,
      canRefundPayments,
    } = data

    if (!name || !label) {
      return NextResponse.json(
        { error: "Le nom et le libellé sont requis" },
        { status: 400 }
      )
    }

    // Check if role already exists
    const existingRole = await db.role.findFirst({
      where: {
        guestHouseId: session.user.guestHouseId,
        name,
      },
    })

    if (existingRole) {
      return NextResponse.json(
        { error: "Un rôle avec ce nom existe déjà" },
        { status: 400 }
      )
    }

    const role = await db.role.create({
      data: {
        guestHouseId: session.user.guestHouseId,
        name,
        label,
        canViewDashboard: canViewDashboard ?? true,
        canViewRooms: canViewRooms ?? true,
        canViewBookings: canViewBookings ?? true,
        canViewGuests: canViewGuests ?? true,
        canViewInvoices: canViewInvoices ?? true,
        canViewRestaurant: canViewRestaurant ?? true,
        canViewExpenses: canViewExpenses ?? false,
        canViewStatistics: canViewStatistics ?? false,
        canViewSettings: canViewSettings ?? false,
        canViewUsers: canViewUsers ?? false,
        canCreateBookings: canCreateBookings ?? true,
        canEditBookings: canEditBookings ?? true,
        canDeleteBookings: canDeleteBookings ?? false,
        canCreateInvoices: canCreateInvoices ?? true,
        canEditInvoices: canEditInvoices ?? true,
        canDeleteInvoices: canDeleteInvoices ?? false,
        canManageRooms: canManageRooms ?? false,
        canManageGuests: canManageGuests ?? true,
        canManageExpenses: canManageExpenses ?? false,
        canManageUsers: canManageUsers ?? false,
        canManageSettings: canManageSettings ?? false,
        canViewRevenue: canViewRevenue ?? false,
        canApplyDiscounts: canApplyDiscounts ?? false,
        canRefundPayments: canRefundPayments ?? false,
      },
    })

    return NextResponse.json({ role }, { status: 201 })
  } catch (error) {
    console.error("Error creating role:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du rôle" },
      { status: 500 }
    )
  }
}
