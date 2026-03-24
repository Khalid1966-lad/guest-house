import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

// GET - Récupérer tous les clients de la maison d'hôtes
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
    const search = searchParams.get("search")

    const where: Prisma.GuestWhereInput = {
      guestHouseId: session.user.guestHouseId,
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const guests = await db.guest.findMany({
      where,
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { lastName: "asc" },
      take: 100,
    })

    return NextResponse.json({ guests })
  } catch (error) {
    console.error("Erreur récupération clients:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau client
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
    const { firstName, lastName, email, phone, address, city, postalCode, country, nationality, notes } = body

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Le prénom et le nom sont requis" },
        { status: 400 }
      )
    }

    // Vérifier si un client avec le même email existe déjà
    if (email) {
      const existingGuest = await db.guest.findFirst({
        where: {
          guestHouseId: session.user.guestHouseId,
          email,
        },
      })

      if (existingGuest) {
        return NextResponse.json(
          { error: "Un client avec cet email existe déjà" },
          { status: 400 }
        )
      }
    }

    const guest = await db.guest.create({
      data: {
        guestHouseId: session.user.guestHouseId,
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
      },
    })

    return NextResponse.json({ guest }, { status: 201 })
  } catch (error) {
    console.error("Erreur création client:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
