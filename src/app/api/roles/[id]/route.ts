import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Get a specific role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    const role = await db.role.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!role) {
      return NextResponse.json({ error: "Rôle non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ role })
  } catch (error) {
    console.error("Error fetching role:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du rôle" },
      { status: 500 }
    )
  }
}

// PUT - Update a role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const data = await request.json()

    // Check if role exists and belongs to this guest house
    const existingRole = await db.role.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingRole) {
      return NextResponse.json({ error: "Rôle non trouvé" }, { status: 404 })
    }

    // Prevent modifying owner role
    if (existingRole.name === "owner") {
      return NextResponse.json(
        { error: "Le rôle propriétaire ne peut pas être modifié" },
        { status: 400 }
      )
    }

    const {
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

    const role = await db.role.update({
      where: { id },
      data: {
        label: label ?? existingRole.label,
        canViewDashboard: canViewDashboard ?? existingRole.canViewDashboard,
        canViewRooms: canViewRooms ?? existingRole.canViewRooms,
        canViewBookings: canViewBookings ?? existingRole.canViewBookings,
        canViewGuests: canViewGuests ?? existingRole.canViewGuests,
        canViewInvoices: canViewInvoices ?? existingRole.canViewInvoices,
        canViewRestaurant: canViewRestaurant ?? existingRole.canViewRestaurant,
        canViewExpenses: canViewExpenses ?? existingRole.canViewExpenses,
        canViewStatistics: canViewStatistics ?? existingRole.canViewStatistics,
        canViewSettings: canViewSettings ?? existingRole.canViewSettings,
        canViewUsers: canViewUsers ?? existingRole.canViewUsers,
        canCreateBookings: canCreateBookings ?? existingRole.canCreateBookings,
        canEditBookings: canEditBookings ?? existingRole.canEditBookings,
        canDeleteBookings: canDeleteBookings ?? existingRole.canDeleteBookings,
        canCreateInvoices: canCreateInvoices ?? existingRole.canCreateInvoices,
        canEditInvoices: canEditInvoices ?? existingRole.canEditInvoices,
        canDeleteInvoices: canDeleteInvoices ?? existingRole.canDeleteInvoices,
        canManageRooms: canManageRooms ?? existingRole.canManageRooms,
        canManageGuests: canManageGuests ?? existingRole.canManageGuests,
        canManageExpenses: canManageExpenses ?? existingRole.canManageExpenses,
        canManageUsers: canManageUsers ?? existingRole.canManageUsers,
        canManageSettings: canManageSettings ?? existingRole.canManageSettings,
        canViewRevenue: canViewRevenue ?? existingRole.canViewRevenue,
        canApplyDiscounts: canApplyDiscounts ?? existingRole.canApplyDiscounts,
        canRefundPayments: canRefundPayments ?? existingRole.canRefundPayments,
      },
    })

    return NextResponse.json({ role })
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du rôle" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Check if role exists and belongs to this guest house
    const existingRole = await db.role.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingRole) {
      return NextResponse.json({ error: "Rôle non trouvé" }, { status: 404 })
    }

    // Prevent deleting owner role
    if (existingRole.name === "owner") {
      return NextResponse.json(
        { error: "Le rôle propriétaire ne peut pas être supprimé" },
        { status: 400 }
      )
    }

    await db.role.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du rôle" },
      { status: 500 }
    )
  }
}
