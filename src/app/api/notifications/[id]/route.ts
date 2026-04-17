import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// PATCH /api/notifications/[id] — mark as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { isRead } = body

    const notification = await db.notification.findUnique({
      where: { id },
    })

    if (!notification || notification.guestHouseId !== session.user.guestHouseId) {
      return NextResponse.json({ error: "Notification non trouvée" }, { status: 404 })
    }

    const updated = await db.notification.update({
      where: { id },
      data: { isRead: isRead !== undefined ? isRead : true },
    })

    return NextResponse.json({ notification: updated })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

// DELETE /api/notifications/[id] — delete notification
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (session.user.role !== "owner") {
      return NextResponse.json({ error: "Seul le propriétaire peut supprimer les notifications" }, { status: 403 })
    }

    const { id } = await params

    const notification = await db.notification.findUnique({
      where: { id },
    })

    if (!notification || notification.guestHouseId !== session.user.guestHouseId) {
      return NextResponse.json({ error: "Notification non trouvée" }, { status: 404 })
    }

    await db.notification.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
