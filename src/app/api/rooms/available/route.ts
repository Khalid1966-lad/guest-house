import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Récupérer les chambres disponibles pour une période donnée
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const checkIn = searchParams.get("checkIn")
    const checkOut = searchParams.get("checkOut")
    const excludeBookingId = searchParams.get("excludeBookingId")

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: "Les dates d'arrivée et de départ sont requises" },
        { status: 400 }
      )
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { error: "Format de dates invalide" },
        { status: 400 }
      )
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: "La date de départ doit être après la date d'arrivée" },
        { status: 400 }
      )
    }

    // Trouver toutes les chambres occupées pour la période demandée
    const conflictingBookings = await db.booking.findMany({
      where: {
        guestHouseId: session.user.guestHouseId,
        status: { notIn: ["cancelled", "no_show", "checked_out"] },
        roomId: { not: null },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
        OR: [
          {
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
        ],
      },
      select: { roomId: true },
    })

    const occupiedRoomIds = new Set(
      conflictingBookings.map((b) => b.roomId).filter(Boolean)
    )

    // Récupérer toutes les chambres actives et exclure celles occupées
    const availableRooms = await db.room.findMany({
      where: {
        guestHouseId: session.user.guestHouseId,
        isActive: true,
        id: { notIn: [...occupiedRoomIds] },
      },
      select: {
        id: true,
        number: true,
        name: true,
        type: true,
        capacity: true,
        basePrice: true,
        pricingMode: true,
        status: true,
        maxExtraBeds: true,
        extraBedPrice: true,
        babyBedAvailable: true,
        babyBedPrice: true,
        cleaningStatus: true,
      },
      orderBy: { number: "asc" },
    })

    return NextResponse.json({ rooms: availableRooms })
  } catch (error) {
    console.error("Erreur récupération chambres disponibles:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
