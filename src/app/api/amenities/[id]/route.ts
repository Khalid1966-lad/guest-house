import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Récupérer un équipement spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const { id } = await params

    const amenity = await db.amenity.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!amenity) {
      return NextResponse.json(
        { error: "Équipement non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json({ amenity })
  } catch (error) {
    console.error("Erreur récupération équipement:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un équipement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, icon, description, sortOrder, isActive } = body

    // Vérifier que l'équipement appartient à la maison d'hôtes
    const existingAmenity = await db.amenity.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingAmenity) {
      return NextResponse.json(
        { error: "Équipement non trouvé" },
        { status: 404 }
      )
    }

    // Si le nom change, vérifier qu'il n'existe pas déjà
    if (name && name !== existingAmenity.name) {
      const duplicate = await db.amenity.findFirst({
        where: {
          guestHouseId: session.user.guestHouseId,
          name: name.trim(),
          NOT: { id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: "Un équipement avec ce nom existe déjà" },
          { status: 400 }
        )
      }
    }

    const amenity = await db.amenity.update({
      where: { id },
      data: {
        name: name?.trim() ?? existingAmenity.name,
        icon: icon !== undefined ? icon : existingAmenity.icon,
        description: description !== undefined ? description : existingAmenity.description,
        sortOrder: sortOrder ?? existingAmenity.sortOrder,
        isActive: isActive !== undefined ? isActive : existingAmenity.isActive,
      },
    })

    return NextResponse.json({ amenity })
  } catch (error) {
    console.error("Erreur mise à jour équipement:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un équipement (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Vérifier que l'équipement appartient à la maison d'hôtes
    const existingAmenity = await db.amenity.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingAmenity) {
      return NextResponse.json(
        { error: "Équipement non trouvé" },
        { status: 404 }
      )
    }

    // Soft delete
    await db.amenity.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression équipement:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
