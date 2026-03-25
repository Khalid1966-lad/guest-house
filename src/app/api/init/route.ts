import { NextResponse } from "next/server"
import { getServerSession } from "next/auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// Combined API to fetch initial data in one request
// Reduces latency from multiple API calls
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const guestHouseId = session.user.guestHouseId

    // Fetch all initial data in parallel
    const [rooms, amenities, guestHouse] = await Promise.all([
      // Rooms with minimal data
      db.room.findMany({
        where: { guestHouseId, isActive: true },
        select: {
          id: true,
          number: true,
          name: true,
          type: true,
          capacity: true,
          bedCount: true,
          bedType: true,
          basePrice: true,
          status: true,
          amenities: true,
        },
        orderBy: { number: "asc" },
      }),
      
      // Amenities
      db.amenity.findMany({
        where: { guestHouseId, isActive: true },
        select: { id: true, name: true, icon: true },
        orderBy: { sortOrder: "asc" },
      }),

      // Guest house info
      db.guestHouse.findUnique({
        where: { id: guestHouseId },
        select: { 
          id: true, 
          name: true, 
          slug: true,
          currency: true,
          settings: {
            select: {
              checkInTime: true,
              checkOutTime: true,
            }
          }
        },
      }),
    ])

    return NextResponse.json(
      { rooms, amenities, guestHouse },
      { 
        headers: { 
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
        }
      }
    )
  } catch (error) {
    console.error("Erreur init data:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
