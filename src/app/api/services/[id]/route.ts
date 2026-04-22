import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET - Get a single service by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    const { id } = await params

    const service = await db.service.findFirst({
      where: { id, guestHouseId: session.user.guestHouseId },
    })

    if (!service) {
      return NextResponse.json({ error: "Service non trouvé" }, { status: 404 })
    }

    // Get serviceBookings count
    const serviceBookingsCount = await db.serviceBooking.count({
      where: { serviceId: id },
    })

    return NextResponse.json({ ...service, serviceBookingsCount })
  } catch (error) {
    console.error("Erreur récupération service:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du service" },
      { status: 500 }
    )
  }
}

// PUT - Update a service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    const { id } = await params

    // Ownership check
    const existing = await db.service.findFirst({
      where: { id, guestHouseId: session.user.guestHouseId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Service non trouvé" }, { status: 404 })
    }

    const data = await request.json()

    const service = await db.service.update({
      where: { id },
      data: {
        name: data.name !== undefined ? String(data.name).trim() : undefined,
        description: data.description !== undefined ? (data.description || null) : undefined,
        category: data.category !== undefined ? data.category : undefined,
        basePrice: data.basePrice !== undefined ? Number(data.basePrice) : undefined,
        priceType: data.priceType !== undefined ? data.priceType : undefined,
        image: data.image !== undefined ? (data.image || null) : undefined,
        duration: data.duration !== undefined ? (data.duration ? Number(data.duration) : null) : undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
        sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined,
      },
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error("Erreur mise à jour service:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du service" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    const { id } = await params

    // Ownership check
    const existing = await db.service.findFirst({
      where: { id, guestHouseId: session.user.guestHouseId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Service non trouvé" }, { status: 404 })
    }

    // Check for active service bookings
    const activeBookings = await db.serviceBooking.count({
      where: {
        serviceId: id,
        status: { in: ["pending", "confirmed", "completed"] },
      },
    })

    if (activeBookings > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer ce service car il a ${activeBookings} réservation(s) active(s). Annulez ou supprimez les réservations associées d'abord.`,
        },
        { status: 409 }
      )
    }

    await db.service.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Service supprimé" })
  } catch (error) {
    console.error("Erreur suppression service:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du service" },
      { status: 500 }
    )
  }
}
