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

// GET - Get schedules for all housekeeping staff (or a specific user)
export async function GET(request: NextRequest) {
  try {
    const { error, session } = await authenticate(request)
    if (error) return error
    if (!session) return error

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const where: Record<string, unknown> = { guestHouseId: session.user.guestHouseId }
    if (userId) where.userId = userId

    const schedules = await db.staffSchedule.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, firstName: true, lastName: true, role: true, isActive: true },
        },
      },
      orderBy: [{ userId: "asc" }, { dayOfWeek: "asc" }],
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("Error fetching schedules:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des emplois du temps" }, { status: 500 })
  }
}

// PUT - Upsert schedules for a user (bulk: array of day entries)
export async function PUT(request: NextRequest) {
  try {
    const { error, session } = await authenticate(request)
    if (error) return error
    if (!session) return error

    const body = await request.json()
    const { userId, days } = body

    if (!userId || !Array.isArray(days)) {
      return NextResponse.json({ error: "userId et days requis" }, { status: 400 })
    }

    // Validate user belongs to this GH
    const user = await db.user.findFirst({
      where: { id: userId, guestHouseId: session.user.guestHouseId },
    })
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }

    // Upsert each day's schedule
    const results = []
    for (const day of days) {
      const { dayOfWeek, startTime, endTime, isAvailable } = day

      if (dayOfWeek < 0 || dayOfWeek > 6) continue

      const result = await db.staffSchedule.upsert({
        where: {
          userId_dayOfWeek: { userId, dayOfWeek },
        },
        update: {
          startTime: startTime || "07:00",
          endTime: endTime || "15:00",
          isAvailable: isAvailable !== false,
        },
        create: {
          guestHouseId: session.user.guestHouseId,
          userId,
          dayOfWeek,
          startTime: startTime || "07:00",
          endTime: endTime || "15:00",
          isAvailable: isAvailable !== false,
        },
      })
      results.push(result)
    }

    return NextResponse.json({ schedules: results })
  } catch (error) {
    console.error("Error upserting schedule:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour de l'emploi du temps" }, { status: 500 })
  }
}

// DELETE - Clear all schedules for a user
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

    await db.staffSchedule.deleteMany({
      where: {
        userId,
        guestHouseId: session.user.guestHouseId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting schedules:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression de l'emploi du temps" }, { status: 500 })
  }
}
