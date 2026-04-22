import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET - List all services for the authenticated user's guesthouse
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const services = await db.service.findMany({
      where: { guestHouseId: session.user.guestHouseId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })

    return NextResponse.json({ services })
  } catch (error) {
    console.error("Erreur récupération services:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des services" },
      { status: 500 }
    )
  }
}

// POST - Create a new service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
      return NextResponse.json(
        { error: "Le nom du service est requis" },
        { status: 400 }
      )
    }

    if (data.basePrice === undefined || data.basePrice === null || isNaN(Number(data.basePrice))) {
      return NextResponse.json(
        { error: "Le prix de base est requis" },
        { status: 400 }
      )
    }

    const service = await db.service.create({
      data: {
        guestHouseId: session.user.guestHouseId,
        name: data.name.trim(),
        description: data.description || null,
        category: data.category || "divers",
        basePrice: Number(data.basePrice),
        priceType: data.priceType || "fixed",
        image: data.image || null,
        duration: data.duration ? Number(data.duration) : null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error("Erreur création service:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du service" },
      { status: 500 }
    )
  }
}
