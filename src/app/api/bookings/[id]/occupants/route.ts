import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Récupérer les occupants d'une réservation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Verify booking belongs to guesthouse
    const booking = await db.booking.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 })
    }

    const occupants = await db.occupant.findMany({
      where: { bookingId: id },
      orderBy: [{ isMainBooker: "desc" }, { createdAt: "asc" }],
    })

    return NextResponse.json({ occupants })
  } catch (error) {
    console.error("Erreur récupération occupants:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// POST - Ajouter un occupant à une réservation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId || !session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Verify booking belongs to guesthouse
    const booking = await db.booking.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 })
    }

    const body = await request.json()
    const { firstName, lastName, dateOfBirth, nationality, idType, idNumber, isAdult, isMainBooker, relationship } = body

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Le prénom et le nom sont requis" },
        { status: 400 }
      )
    }

    // If this is marked as main booker, unmark any existing main booker
    if (isMainBooker) {
      await db.occupant.updateMany({
        where: { bookingId: id, isMainBooker: true },
        data: { isMainBooker: false },
      })
    }

    const occupant = await db.occupant.create({
      data: {
        bookingId: id,
        guestHouseId: session.user.guestHouseId,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        nationality: nationality || null,
        idType: idType || null,
        idNumber: idNumber || null,
        isAdult: isAdult !== false,
        isMainBooker: isMainBooker || false,
        relationship: relationship || null,
      },
    })

    return NextResponse.json({ occupant }, { status: 201 })
  } catch (error) {
    console.error("Erreur création occupant:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// PUT - Mettre à jour un occupant (bulk replace)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId || !session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Verify booking belongs to guesthouse
    const booking = await db.booking.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 })
    }

    const body = await request.json()
    const { occupants, notes } = body

    // Update booking notes if provided
    if (notes !== undefined) {
      await db.booking.update({
        where: { id },
        data: { notes },
      })
    }

    // Replace all occupants if provided
    if (occupants && Array.isArray(occupants)) {
      // Delete existing occupants
      await db.occupant.deleteMany({
        where: { bookingId: id },
      })

      // Create new occupants
      if (occupants.length > 0) {
        await db.occupant.createMany({
          data: occupants.map((o: any) => ({
            bookingId: id,
            guestHouseId: session.user!.guestHouseId!,
            firstName: o.firstName,
            lastName: o.lastName,
            dateOfBirth: o.dateOfBirth ? new Date(o.dateOfBirth) : null,
            nationality: o.nationality || null,
            idType: o.idType || null,
            idNumber: o.idNumber || null,
            isAdult: o.isAdult !== false,
            isMainBooker: o.isMainBooker || false,
            relationship: o.relationship || null,
          })),
        })
      }
    }

    // Fetch updated occupants
    const updatedOccupants = await db.occupant.findMany({
      where: { bookingId: id },
      orderBy: [{ isMainBooker: "desc" }, { createdAt: "asc" }],
    })

    return NextResponse.json({ occupants: updatedOccupants })
  } catch (error) {
    console.error("Erreur mise à jour occupants:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
