import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// PATCH - Mettre à jour un occupant individuel
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Verify occupant belongs to guesthouse
    const existingOccupant = await db.occupant.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingOccupant) {
      return NextResponse.json({ error: "Occupant non trouvé" }, { status: 404 })
    }

    const body = await request.json()
    const { firstName, lastName, dateOfBirth, nationality, idType, idNumber, isAdult, isMainBooker, relationship } = body

    // If this is marked as main booker, unmark any existing main booker in the same booking
    if (isMainBooker) {
      await db.occupant.updateMany({
        where: { bookingId: existingOccupant.bookingId, isMainBooker: true, id: { not: id } },
        data: { isMainBooker: false },
      })
    }

    const occupant = await db.occupant.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        ...(nationality !== undefined && { nationality: nationality || null }),
        ...(idType !== undefined && { idType: idType || null }),
        ...(idNumber !== undefined && { idNumber: idNumber || null }),
        ...(isAdult !== undefined && { isAdult }),
        ...(isMainBooker !== undefined && { isMainBooker }),
        ...(relationship !== undefined && { relationship: relationship || null }),
      },
    })

    return NextResponse.json({ occupant })
  } catch (error) {
    console.error("Erreur mise à jour occupant:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer un occupant
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

    // Verify occupant belongs to guesthouse
    const existingOccupant = await db.occupant.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingOccupant) {
      return NextResponse.json({ error: "Occupant non trouvé" }, { status: 404 })
    }

    // Prevent deleting the main booker
    if (existingOccupant.isMainBooker) {
      return NextResponse.json(
        { error: "Le réservataire ne peut pas être supprimé" },
        { status: 400 }
      )
    }

    await db.occupant.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression occupant:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
