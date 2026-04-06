import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// POST - Reset all data (except users and guest house)
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Only owner can reset data
    if (session.user.role !== "owner") {
      return NextResponse.json(
        { error: "Seul le propriétaire peut réinitialiser les données" },
        { status: 403 }
      )
    }

    const guestHouseId = session.user.guestHouseId

    // Delete all data in the correct order (respecting foreign keys)
    // Using transactions for data integrity
    await db.$transaction(async (tx) => {
      // Delete invoices first
      await tx.invoice.deleteMany({
        where: { guestHouseId },
      })

      // Delete bookings
      await tx.booking.deleteMany({
        where: { guestHouseId },
      })

      // Delete guests
      await tx.guest.deleteMany({
        where: { guestHouseId },
      })

      // Delete rooms
      await tx.room.deleteMany({
        where: { guestHouseId },
      })

      // Delete expenses
      await tx.expense.deleteMany({
        where: { guestHouseId },
      })

      // Delete restaurant orders
      await tx.restaurantOrder.deleteMany({
        where: { guestHouseId },
      })

      // Delete menu items
      await tx.menuItem.deleteMany({
        where: { guestHouseId },
      })

      // Delete amenities
      await tx.amenity.deleteMany({
        where: { guestHouseId },
      })

      // Delete room prices
      await tx.roomPrice.deleteMany({
        where: { room: { guestHouseId } },
      })
    })

    return NextResponse.json({
      message: "Toutes les données ont été supprimées avec succès",
    })
  } catch (error) {
    console.error("Error resetting data:", error)
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation des données" },
      { status: 500 }
    )
  }
}
