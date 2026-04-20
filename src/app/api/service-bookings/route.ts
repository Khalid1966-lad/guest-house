import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET - List service bookings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const guestId = searchParams.get("guestId")
    const serviceId = searchParams.get("serviceId")
    const paymentStatus = searchParams.get("paymentStatus")

    const where: Record<string, unknown> = {
      guestHouseId: session.user.guestHouseId,
    }

    if (status && status !== "all") {
      where.status = status
    }

    if (guestId) {
      where.guestId = guestId
    }

    if (serviceId) {
      where.serviceId = serviceId
    }

    if (paymentStatus && paymentStatus !== "all") {
      where.paymentStatus = paymentStatus
    }

    const bookings = await db.serviceBooking.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            image: true,
            category: true,
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Erreur récupération réservations services:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des réservations de services" },
      { status: 500 }
    )
  }
}

// POST - Create a new service booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.serviceId) {
      return NextResponse.json(
        { error: "Le service est requis" },
        { status: 400 }
      )
    }

    if (!data.guestId) {
      return NextResponse.json(
        { error: "Le client est requis" },
        { status: 400 }
      )
    }

    const quantity = data.quantity ? Number(data.quantity) : 1
    if (isNaN(quantity) || quantity < 1) {
      return NextResponse.json(
        { error: "La quantité doit être un nombre entier positif" },
        { status: 400 }
      )
    }

    // Look up service to get basePrice and verify it exists and is active
    const service = await db.service.findFirst({
      where: {
        id: data.serviceId,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!service) {
      return NextResponse.json(
        { error: "Service non trouvé" },
        { status: 404 }
      )
    }

    if (!service.isActive) {
      return NextResponse.json(
        { error: "Ce service n'est pas disponible actuellement" },
        { status: 400 }
      )
    }

    const unitPrice = service.basePrice
    const totalPrice = unitPrice * quantity

    const booking = await db.serviceBooking.create({
      data: {
        guestHouseId: session.user.guestHouseId,
        serviceId: data.serviceId,
        guestId: data.guestId,
        bookingId: data.bookingId || null,
        quantity,
        unitPrice,
        totalPrice,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        scheduledTime: data.scheduledTime || null,
        notes: data.notes || null,
        createdBy: session.user.id,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            image: true,
            category: true,
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error("Erreur création réservation service:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la réservation de service" },
      { status: 500 }
    )
  }
}
