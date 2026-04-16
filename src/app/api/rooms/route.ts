import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

// GET - Récupérer toutes les chambres de la maison d'hôtes
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
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const search = searchParams.get("search")

    const where: Prisma.RoomWhereInput = {
      guestHouseId: session.user.guestHouseId,
      isActive: true,
    }

    if (status && status !== "all") {
      where.status = status
    }

    if (type && type !== "all") {
      where.type = type
    }

    if (search) {
      where.OR = [
        { number: { contains: search } },
        { name: { contains: search } },
      ]
    }

    // Optimized query - only select needed fields
    const rooms = await db.room.findMany({
      where,
      select: {
        id: true,
        number: true,
        name: true,
        description: true,
        floor: true,
        type: true,
        capacity: true,
        bedCount: true,
        bedType: true,
        size: true,
        maxExtraBeds: true,
        basePrice: true,
        weekendPrice: true,
        pricingMode: true,
        extraBedPrice: true,
        babyBedAvailable: true,
        babyBedPrice: true,
        status: true,
        cleaningStatus: true,
        amenities: true,
        images: true,
        isActive: true,
        // Count bookings for this room
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { number: "asc" },
    })

    // Return with cache headers for better performance
    return NextResponse.json(
      { rooms },
      { 
        headers: { 
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=30'
        }
      }
    )
  } catch (error) {
    console.error("Erreur récupération chambres:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle chambre
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      number,
      name,
      description,
      floor,
      type,
      capacity,
      bedCount,
      bedType,
      size,
      maxExtraBeds,
      basePrice,
      weekendPrice,
      extraBedPrice,
      babyBedAvailable,
      babyBedPrice,
      amenities,
      images,
    } = body

    // Validation
    if (!number || !basePrice) {
      return NextResponse.json(
        { error: "Le numéro et le prix de base sont requis" },
        { status: 400 }
      )
    }

    // Vérifier que le numéro de chambre est unique dans la maison d'hôtes
    const existingRoom = await db.room.findFirst({
      where: {
        guestHouseId: session.user.guestHouseId,
        number,
      },
    })

    if (existingRoom) {
      return NextResponse.json(
        { error: "Une chambre avec ce numéro existe déjà" },
        { status: 400 }
      )
    }

    const room = await db.room.create({
      data: {
        guestHouseId: session.user.guestHouseId,
        number,
        name: name || null,
        description: description || null,
        floor: floor ? parseInt(floor) : null,
        type: type || "standard",
        capacity: parseInt(capacity) || 2,
        bedCount: parseInt(bedCount) || 1,
        bedType: bedType || "double",
        size: size ? parseFloat(size) : null,
        maxExtraBeds: parseInt(maxExtraBeds) || 0,
        basePrice: parseFloat(basePrice),
        weekendPrice: weekendPrice ? parseFloat(weekendPrice) : null,
        currency: "EUR",
        extraBedPrice: parseFloat(extraBedPrice) || 0,
        babyBedAvailable: babyBedAvailable === true,
        babyBedPrice: parseFloat(babyBedPrice) || 0,
        amenities: amenities || null,
        images: images || null,
        status: "available",
        isActive: true,
      },
    })

    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    console.error("Erreur création chambre:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
