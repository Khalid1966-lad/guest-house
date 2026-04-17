import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/session"

export const dynamic = "force-dynamic"

// GET /api/admin/subscriptions — list all subscriptions with guesthouse info
export async function GET(request: Request) {
  try {
    const session = await requireRole(["super_admin"])

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all"

    const subscriptions = await db.$queryRawUnsafe(`
      SELECT 
        s.*,
        gh."name" as "guestHouseName",
        gh."code" as "guestHouseCode",
        gh."email" as "guestHouseEmail",
        gh."city" as "guestHouseCity",
        gh."isActive" as "guestHouseActive",
        gh."createdAt" as "guestHouseCreatedAt",
        u."email" as "ownerEmail",
        u."name" as "ownerName"
      FROM "Subscription" s
      JOIN "GuestHouse" gh ON s."guestHouseId" = gh."id"
      LEFT JOIN "User" u ON u."guestHouseId" = gh."id" AND u."role" = 'owner'
      ORDER BY s."updatedAt" DESC
    `)

    const all = subscriptions as Record<string, unknown>[]

    // Filter by raw status
    const filtered = filter === "all" ? all : all.filter((sub: Record<string, unknown>) => {
      return (sub.status as string) === filter
    })

    // Add computed effective status for each
    const { buildSubscriptionInfo } = await import("@/lib/subscription")
    const enriched = filtered.map((sub: Record<string, unknown>) => ({
      ...sub,
      computed: buildSubscriptionInfo(sub),
    }))

    // Stats
    const stats = {
      total: all.length,
      active: all.filter(s => s.status === "active").length,
      trial: all.filter(s => s.status === "trial").length,
      expired: all.filter(s => s.status === "expired").length,
      grace_period: all.filter(s => s.status === "grace_period").length,
      cancelled: all.filter(s => s.status === "cancelled").length,
    }

    return NextResponse.json({ subscriptions: enriched, stats })
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error && (error as any).status === 401) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("[subscriptions] GET error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST /api/admin/subscriptions — create a subscription for a guesthouse
export async function POST(request: Request) {
  try {
    await requireRole(["super_admin"])

    const body = await request.json()
    const { guestHouseId, plan, status, expiresAt, lastPaymentAt, lastPaymentRef, trialEndsAt, notes } = body

    if (!guestHouseId) {
      return NextResponse.json({ error: "guestHouseId requis" }, { status: 400 })
    }

    // Check if subscription already exists
    const existing = await db.$queryRawUnsafe<{ id: string }[]>(
      `SELECT "id" FROM "Subscription" WHERE "guestHouseId" = $1`,
      guestHouseId
    )

    if (existing.length > 0) {
      return NextResponse.json({ error: "Un abonnement existe déjà" }, { status: 409 })
    }

    const { createId } = await import("@paralleldrive/cuid2")
    const id = createId()

    await db.$executeRawUnsafe(`
      INSERT INTO "Subscription" ("id", "guestHouseId", "plan", "status", "expiresAt", "lastPaymentAt", "lastPaymentRef", "trialEndsAt", "notes", "startedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `, id, guestHouseId, plan || "free", status || "trial",
      expiresAt ? new Date(expiresAt) : null,
      lastPaymentAt ? new Date(lastPaymentAt) : null,
      lastPaymentRef || null,
      trialEndsAt ? new Date(trialEndsAt) : null,
      notes || null
    )

    // Sync plan to GuestHouse
    await db.$executeRawUnsafe(
      `UPDATE "GuestHouse" SET "plan" = $1 WHERE "id" = $2`,
      plan || "free", guestHouseId
    )

    return NextResponse.json({ success: true, id })
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error && (error as any).status === 401) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("[subscriptions] POST error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
