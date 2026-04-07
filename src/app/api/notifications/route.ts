import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/notifications — list notifications for current guesthouse
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const where: Record<string, unknown> = {
      guestHouseId: session.user.guestHouseId,
    }

    if (unreadOnly) {
      where.isRead = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: {
          guestHouseId: session.user.guestHouseId,
          isRead: false,
        },
      }),
    ])

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      hasMore: offset + limit < total,
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

// POST /api/notifications — create notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, message, entityType, entityId } = body

    if (!type || !title || !message) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
    }

    const notification = await db.notification.create({
      data: {
        guestHouseId: session.user.guestHouseId as string,
        userId: session.user.id,
        type,
        title,
        message,
        entityType: entityType || null,
        entityId: entityId || null,
      },
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
