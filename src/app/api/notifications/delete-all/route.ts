import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// DELETE /api/notifications/delete-all — delete all notifications for this guesthouse
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (session.user.role !== "owner") {
      return NextResponse.json({ error: "Seul le propriétaire peut supprimer les notifications" }, { status: 403 })
    }

    const result = await db.notification.deleteMany({
      where: {
        guestHouseId: session.user.guestHouseId,
      },
    })

    return NextResponse.json({ success: true, deletedCount: result.count })
  } catch (error) {
    console.error("Error deleting all notifications:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
