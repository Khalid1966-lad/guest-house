import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Get a single guest
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

    const guest = await db.guest.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
      include: {
        bookings: {
          include: {
            room: {
              select: {
                id: true,
                number: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: { checkIn: "desc" },
          take: 20,
        },
      },
    })

    if (!guest) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ guest })
  } catch (error) {
    console.error("Erreur récupération client:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// PUT - Update a guest
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      nationality,
      notes,
      isVip,
      vipLevel,
    } = body

    // Validation
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Le prénom et le nom sont requis" },
        { status: 400 }
      )
    }

    // Verify guest exists and belongs to user's guest house
    const existingGuest = await db.guest.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingGuest) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 })
    }

    // Check for duplicate email (if changed)
    if (email && email !== existingGuest.email) {
      const duplicateGuest = await db.guest.findFirst({
        where: {
          guestHouseId: session.user.guestHouseId,
          email,
          id: { not: id },
        },
      })

      if (duplicateGuest) {
        return NextResponse.json(
          { error: "Un autre client avec cet email existe déjà" },
          { status: 400 }
        )
      }
    }

    // Update guest
    const guest = await db.guest.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        country: country || null,
        nationality: nationality || null,
        notes: notes || null,
        isVip: isVip || false,
        vipLevel: isVip && vipLevel ? vipLevel : null,
      },
      include: {
        bookings: {
          include: {
            room: {
              select: {
                id: true,
                number: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: { checkIn: "desc" },
          take: 20,
        },
      },
    })

    return NextResponse.json({ guest })
  } catch (error) {
    console.error("Erreur mise à jour client:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// DELETE - Delete a guest
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Verify guest exists and belongs to user's guest house
    const existingGuest = await db.guest.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    })

    if (!existingGuest) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 })
    }

    // Check if guest has bookings
    if (existingGuest._count.bookings > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer un client avec des réservations" },
        { status: 400 }
      )
    }

    // Delete guest
    await db.guest.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression client:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
