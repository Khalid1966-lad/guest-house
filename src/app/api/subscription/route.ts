import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

export const dynamic = "force-dynamic"

// GET /api/subscription — current user's guesthouse subscription info
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user?.guestHouseId) {
      return NextResponse.json({ subscription: null, message: "Aucune maison d'hôtes associée" })
    }

    const result = await db.$queryRawUnsafe(
      `SELECT s.* FROM "Subscription" s WHERE s."guestHouseId" = $1`,
      user.guestHouseId
    )

    if (!(result as any[]).length) {
      return NextResponse.json({ subscription: null, message: "Aucun abonnement trouvé" })
    }

    const { buildSubscriptionInfo } = await import("@/lib/subscription")
    const raw = (result as any[])[0] as Record<string, unknown>
    const info = buildSubscriptionInfo(raw)

    // Get inscription date from guesthouse
    const gh = await db.$queryRawUnsafe<{ createdAt: string }[]>(
      `SELECT "createdAt" FROM "GuestHouse" WHERE "id" = $1`,
      user.guestHouseId
    )

    return NextResponse.json({
      subscription: {
        ...raw,
        ...info,
        inscriptionDate: gh[0]?.createdAt || null,
      },
    })
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error && (error as any).status === 401) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("[subscription] GET error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
