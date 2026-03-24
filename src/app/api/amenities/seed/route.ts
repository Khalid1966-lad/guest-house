import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// POST - Seed default amenities if none exist
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    // Check if amenities already exist
    const existingCount = await db.amenity.count({
      where: { guestHouseId: session.user.guestHouseId },
    })

    if (existingCount > 0) {
      return NextResponse.json({
        message: `${existingCount} équipements existent déjà`,
        seeded: false,
      })
    }

    // Create default amenities
    const defaultAmenities = [
      { name: "WiFi", icon: "Wifi", sortOrder: 1 },
      { name: "TV", icon: "Tv", sortOrder: 2 },
      { name: "Climatisation", icon: "Wind", sortOrder: 3 },
      { name: "Minibar", icon: "Coffee", sortOrder: 4 },
      { name: "Coffre-fort", icon: "Shield", sortOrder: 5 },
      { name: "Baignoire", icon: "Bath", sortOrder: 6 },
      { name: "Balcon", icon: "DoorOpen", sortOrder: 7 },
      { name: "Vue mer", icon: "Waves", sortOrder: 8 },
      { name: "Téléphone", icon: "Phone", sortOrder: 9 },
      { name: "Bureau", icon: "LampDesk", sortOrder: 10 },
      { name: "Sèche-cheveux", icon: "Wind", sortOrder: 11 },
      { name: "Chauffage", icon: "Flame", sortOrder: 12 },
    ]

    await db.amenity.createMany({
      data: defaultAmenities.map((amenity) => ({
        guestHouseId: session.user.guestHouseId,
        ...amenity,
      })),
    })

    return NextResponse.json({
      message: `${defaultAmenities.length} équipements créés`,
      seeded: true,
    })
  } catch (error) {
    console.error("Erreur seed équipements:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
