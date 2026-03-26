import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Récupérer les tarifs saisonniers d'une chambre
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    // Vérifier que la chambre appartient à la maison d'hôtes
    const room = await db.room.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!room) {
      return NextResponse.json(
        { error: "Chambre non trouvée" },
        { status: 404 }
      )
    }

    const prices = await db.roomPrice.findMany({
      where: { roomId: id, isActive: true },
      orderBy: { startDate: "asc" },
    })

    return NextResponse.json({ prices })
  } catch (error) {
    console.error("Erreur récupération tarifs:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Ajouter un tarif saisonnier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    // Vérifier que la chambre appartient à la maison d'hôtes
    const room = await db.room.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!room) {
      return NextResponse.json(
        { error: "Chambre non trouvée" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, price, startDate, endDate } = body

    if (!name || !price || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      )
    }

    const roomPrice = await db.roomPrice.create({
      data: {
        roomId: id,
        name,
        price: parseFloat(price),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
      },
    })

    return NextResponse.json({ price: roomPrice }, { status: 201 })
  } catch (error) {
    console.error("Erreur création tarif:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
