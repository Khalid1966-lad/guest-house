import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const FULL_ACCESS_ROLES = ["owner", "admin", "manager", "gouvernant", "gouvernante"]

async function authenticate(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.guestHouseId) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }), session: null }
  }
  if (!FULL_ACCESS_ROLES.includes(session.user.role)) {
    return { error: NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 }), session: null }
  }
  return { error: null, session }
}

// GET - List all zones for the guesthouse
export async function GET() {
  try {
    const { error, session } = await authenticate({} as Request)
    if (error) return error
    if (!session) return error

    const zones = await db.housekeepingZone.findMany({
      where: { guestHouseId: session.user.guestHouseId },
      include: {
        user: {
          select: { id: true, name: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ zones })
  } catch (error) {
    console.error("Error fetching zones:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des zones" }, { status: 500 })
  }
}

// POST - Create or update a zone for a user
export async function POST(request: NextRequest) {
  try {
    const { error, session } = await authenticate(request)
    if (error) return error
    if (!session) return error

    const body = await request.json()
    const { userId, zoneType, floorNumber, roomIds, zoneName } = body

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 })
    }

    // Validate user belongs to this GH
    const user = await db.user.findFirst({
      where: { id: userId, guestHouseId: session.user.guestHouseId },
    })
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }

    const validZoneTypes = ["floor", "room", "custom"]
    if (zoneType && !validZoneTypes.includes(zoneType)) {
      return NextResponse.json({ error: "Type de zone invalide" }, { status: 400 })
    }

    // Upsert: each user has at most one zone
    const zone = await db.housekeepingZone.upsert({
      where: { userId },
      update: {
        zoneType: zoneType || "floor",
        floorNumber: floorNumber !== undefined ? (floorNumber ? parseInt(floorNumber) : null) : undefined,
        roomIds: roomIds ? JSON.stringify(roomIds) : undefined,
        zoneName: zoneName || null,
      },
      create: {
        guestHouseId: session.user.guestHouseId,
        userId,
        zoneType: zoneType || "floor",
        floorNumber: floorNumber !== undefined ? (floorNumber ? parseInt(floorNumber) : null) : null,
        roomIds: roomIds ? JSON.stringify(roomIds) : "[]",
        zoneName: zoneName || null,
      },
      include: {
        user: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
      },
    })

    return NextResponse.json({ zone }, { status: zone.createdAt === zone.updatedAt ? 201 : 200 })
  } catch (error) {
    console.error("Error creating zone:", error)
    return NextResponse.json({ error: "Erreur lors de la création de la zone" }, { status: 500 })
  }
}

// DELETE - Remove a zone assignment
export async function DELETE(request: NextRequest) {
  try {
    const { error, session } = await authenticate(request)
    if (error) return error
    if (!session) return error

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 })
    }

    await db.housekeepingZone.deleteMany({
      where: {
        userId,
        guestHouseId: session.user.guestHouseId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting zone:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression de la zone" }, { status: 500 })
  }
}
