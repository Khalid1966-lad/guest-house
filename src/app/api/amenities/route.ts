import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Récupérer tous les équipements de la maison d'hôtes
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const amenities = await db.amenity.findMany({
      where: {
        guestHouseId: session.user.guestHouseId,
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({ amenities })
  } catch (error) {
    console.error("Erreur récupération équipements:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer un nouvel équipement
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
    const { name, icon, description, sortOrder } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Le nom de l'équipement est requis" },
        { status: 400 }
      )
    }

    // Vérifier si l'équipement existe déjà
    const existingAmenity = await db.amenity.findFirst({
      where: {
        guestHouseId: session.user.guestHouseId,
        name: name.trim(),
      },
    })

    if (existingAmenity) {
      return NextResponse.json(
        { error: "Un équipement avec ce nom existe déjà" },
        { status: 400 }
      )
    }

    // Obtenir le max sortOrder
    const maxSortOrder = await db.amenity.aggregate({
      where: { guestHouseId: session.user.guestHouseId },
      _max: { sortOrder: true },
    })

    const amenity = await db.amenity.create({
      data: {
        guestHouseId: session.user.guestHouseId,
        name: name.trim(),
        icon: icon || null,
        description: description || null,
        sortOrder: sortOrder ?? (maxSortOrder._max.sortOrder ?? 0) + 1,
      },
    })

    return NextResponse.json({ amenity }, { status: 201 })
  } catch (error) {
    console.error("Erreur création équipement:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour l'ordre des équipements
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amenities } = body as { amenities: { id: string; sortOrder: number }[] }

    // Mettre à jour l'ordre de chaque équipement
    for (const item of amenities) {
      await db.amenity.updateMany({
        where: {
          id: item.id,
          guestHouseId: session.user.guestHouseId,
        },
        data: { sortOrder: item.sortOrder },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur mise à jour ordre:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
