import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { notifyNewBooking } from "@/lib/notifications"

// GET - Récupérer toutes les réservations de la maison d'hôtes
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
    const roomId = searchParams.get("roomId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: Prisma.BookingWhereInput = {
      guestHouseId: session.user.guestHouseId,
    }

    if (status && status !== "all") {
      where.status = status
    }

    if (roomId) {
      where.roomId = roomId
    }

    if (startDate && endDate) {
      where.OR = [
        {
          checkIn: {
            gte: new Date(startDate),
            lt: new Date(endDate),
          },
        },
        {
          checkOut: {
            gt: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          AND: [
            { checkIn: { lt: new Date(startDate) } },
            { checkOut: { gt: new Date(endDate) } },
          ],
        },
      ]
    }

    const bookings = await db.booking.findMany({
      where,
      select: {
        id: true,
        guestId: true,
        roomId: true,
        checkIn: true,
        checkOut: true,
        nightlyRate: true,
        totalPrice: true,
        adults: true,
        children: true,
        status: true,
        source: true,
        guestNotes: true,
        notes: true,
        extraBeds: true,
        extraBedPrice: true,
        babyBed: true,
        babyBedPrice: true,
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        room: {
          select: {
            id: true,
            number: true,
            name: true,
            type: true,
            capacity: true,
            basePrice: true,
            pricingMode: true,
            maxExtraBeds: true,
            extraBedPrice: true,
            babyBedAvailable: true,
            babyBedPrice: true,
          },
        },
        invoice: {
          select: {
            id: true,
          },
        },
        occupants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            nationality: true,
            idType: true,
            idNumber: true,
            isAdult: true,
            isMainBooker: true,
            relationship: true,
          },
        },
      },
      orderBy: { checkIn: "asc" },
    })

    // Transform to include hasInvoice flag
    const bookingsWithInvoiceFlag = bookings.map((booking) => ({
      ...booking,
      hasInvoice: !!booking.invoice,
      invoice: undefined, // Remove invoice from response
    }))

    return NextResponse.json({ bookings: bookingsWithInvoiceFlag })
  } catch (error) {
    console.error("Erreur récupération réservations:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle réservation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId || !session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      guestId,
      firstName,
      lastName,
      email,
      phone,
      roomId,
      checkIn,
      checkOut,
      adults,
      children,
      nightlyRate,
      totalPrice,
      source,
      guestNotes,
      extraBeds,
      extraBedPrice,
      babyBed,
      babyBedPrice,
    } = body

    // Validation
    if (!roomId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: "La chambre et les dates sont requises" },
        { status: 400 }
      )
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      return NextResponse.json(
        { error: "La date de départ doit être après la date d'arrivée" },
        { status: 400 }
      )
    }

    // Vérifier que la chambre appartient à la maison d'hôtes
    const room = await db.room.findFirst({
      where: {
        id: roomId,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!room) {
      return NextResponse.json(
        { error: "Chambre non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier les disponibilités
    const conflictingBookings = await db.booking.findFirst({
      where: {
        roomId,
        guestHouseId: session.user.guestHouseId,
        status: { notIn: ["cancelled", "no_show", "checked_out"] },
        OR: [
          {
            checkIn: { lt: new Date(checkOut) },
            checkOut: { gt: new Date(checkIn) },
          },
        ],
      },
    })

    if (conflictingBookings) {
      return NextResponse.json(
        { error: "Cette chambre n'est pas disponible pour ces dates" },
        { status: 400 }
      )
    }

    // Créer ou trouver le client
    let finalGuestId = guestId

    if (!finalGuestId && firstName && lastName) {
      // Vérifier si un client avec le même email existe
      if (email) {
        const existingGuest = await db.guest.findFirst({
          where: {
            guestHouseId: session.user.guestHouseId,
            email,
          },
        })
        if (existingGuest) {
          finalGuestId = existingGuest.id
        }
      }

      // Créer un nouveau client si nécessaire
      if (!finalGuestId) {
        const newGuest = await db.guest.create({
          data: {
            guestHouseId: session.user.guestHouseId,
            firstName,
            lastName,
            email: email || null,
            phone: phone || null,
          },
        })
        finalGuestId = newGuest.id
      }
    }

    if (!finalGuestId) {
      return NextResponse.json(
        { error: "Informations client requises" },
        { status: 400 }
      )
    }

    // Calculer le prix total si non fourni
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    const finalNightlyRate = parseFloat(nightlyRate) || room.basePrice
    const finalTotalPrice = parseFloat(totalPrice) || (nights * finalNightlyRate)

    // Créer la réservation
    const booking = await db.booking.create({
      data: {
        guestHouseId: session.user.guestHouseId,
        guestId: finalGuestId,
        roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: parseInt(adults) || 1,
        children: parseInt(children) || 0,
        extraBeds: parseInt(extraBeds) || 0,
        extraBedPrice: parseFloat(extraBedPrice) || 0,
        babyBed: babyBed || false,
        babyBedPrice: parseFloat(babyBedPrice) || 0,
        nightlyRate: finalNightlyRate,
        totalPrice: finalTotalPrice,
        discount: 0,
        taxes: 0,
        grandTotal: finalTotalPrice,
        source: source || "direct",
        status: "confirmed",
        paymentStatus: "pending",
        guestNotes: guestNotes || null,
        createdBy: session.user.id,
      },
      include: {
        guest: true,
        room: true,
      },
    })

    // Trigger notification (fire-and-forget)
    notifyNewBooking({
      guestHouseId: session.user.guestHouseId,
      userId: session.user.id,
      guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
      roomNumber: booking.room.number,
      checkIn: booking.checkIn.toLocaleDateString("fr-FR"),
      checkOut: booking.checkOut.toLocaleDateString("fr-FR"),
      bookingId: booking.id,
    }).catch(console.error)

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error("Erreur création réservation:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
