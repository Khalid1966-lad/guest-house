import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// POST /api/notifications/mark-all-read
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    await db.notification.updateMany({
      where: {
        guestHouseId: session.user.guestHouseId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking all as read:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
