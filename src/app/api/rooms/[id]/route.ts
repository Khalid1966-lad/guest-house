import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Récupérer une chambre par ID
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

    const room = await db.room.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
      include: {
        roomPrices: {
          where: { isActive: true },
          orderBy: { startDate: "asc" },
        },
        bookings: {
          where: {
            status: { in: ["confirmed", "checked_in"] },
          },
          include: {
            guest: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { checkIn: "asc" },
          take: 10,
        },
      },
    })

    if (!room) {
      return NextResponse.json(
        { error: "Chambre non trouvée" },
        { status: 404 }
      )
    }

    return NextResponse.json({ room })
  } catch (error) {
    console.error("Erreur récupération chambre:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT - Modifier une chambre
export async function PUT(
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

    const body = await request.json()

    // Vérifier que la chambre appartient à la maison d'hôtes
    const existingRoom = await db.room.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingRoom) {
      return NextResponse.json(
        { error: "Chambre non trouvée" },
        { status: 404 }
      )
    }

    // Si le numéro change, vérifier qu'il n'existe pas déjà
    if (body.number && body.number !== existingRoom.number) {
      const duplicateNumber = await db.room.findFirst({
        where: {
          guestHouseId: session.user.guestHouseId,
          number: body.number,
          id: { not: id },
        },
      })

      if (duplicateNumber) {
        return NextResponse.json(
          { error: "Une chambre avec ce numéro existe déjà" },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    
    if (body.number !== undefined) updateData.number = body.number
    if (body.name !== undefined) updateData.name = body.name || null
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.floor !== undefined) updateData.floor = body.floor ? parseInt(body.floor) : null
    if (body.type !== undefined) updateData.type = body.type
    if (body.capacity !== undefined) updateData.capacity = parseInt(body.capacity)
    if (body.bedCount !== undefined) updateData.bedCount = parseInt(body.bedCount)
    if (body.bedType !== undefined) updateData.bedType = body.bedType
    if (body.size !== undefined) updateData.size = body.size ? parseFloat(body.size) : null
    if (body.maxExtraBeds !== undefined) updateData.maxExtraBeds = parseInt(body.maxExtraBeds) || 0
    if (body.basePrice !== undefined) updateData.basePrice = parseFloat(body.basePrice)
    if (body.weekendPrice !== undefined) updateData.weekendPrice = body.weekendPrice ? parseFloat(body.weekendPrice) : null
    if (body.pricingMode !== undefined) updateData.pricingMode = body.pricingMode
    if (body.extraBedPrice !== undefined) updateData.extraBedPrice = parseFloat(body.extraBedPrice) || 0
    if (body.babyBedAvailable !== undefined) updateData.babyBedAvailable = body.babyBedAvailable === true
    if (body.babyBedPrice !== undefined) updateData.babyBedPrice = parseFloat(body.babyBedPrice) || 0
    if (body.amenities !== undefined) updateData.amenities = body.amenities || null
    if (body.images !== undefined) updateData.images = body.images || null
    if (body.status !== undefined) updateData.status = body.status

    const room = await db.room.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ room })
  } catch (error) {
    console.error("Erreur modification chambre:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une chambre (soft delete)
export async function DELETE(
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

    // Soft delete
    await db.room.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression chambre:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
