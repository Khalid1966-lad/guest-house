import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/session"

export const dynamic = "force-dynamic"

// GET /api/admin/subscriptions — list ALL guesthouses with their subscription info
export async function GET(request: Request) {
  try {
    await requireRole(["super_admin"])

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all"

    // LEFT JOIN: all guesthouses, even those without a subscription
    const rows = await db.$queryRawUnsafe(`
      SELECT 
        gh."id" as "guestHouseId",
        gh."name" as "guestHouseName",
        gh."code" as "guestHouseCode",
        gh."email" as "guestHouseEmail",
        gh."city" as "guestHouseCity",
        gh."isActive" as "guestHouseActive",
        gh."createdAt" as "guestHouseCreatedAt",
        gh."status" as "guestHouseStatus",
        u."email" as "ownerEmail",
        u."name" as "ownerName",
        u."id" as "ownerId",
        s."id" as "subscriptionId",
        s."plan" as "plan",
        s."status" as "subscriptionStatus",
        s."startedAt" as "startedAt",
        s."expiresAt" as "expiresAt",
        s."lastPaymentAt" as "lastPaymentAt",
        s."lastPaymentRef" as "lastPaymentRef",
        s."trialEndsAt" as "trialEndsAt",
        s."gracePeriodDays" as "gracePeriodDays",
        s."notes" as "subscriptionNotes",
        s."changedAt" as "changedAt"
      FROM "GuestHouse" gh
      LEFT JOIN "User" u ON u."guestHouseId" = gh."id" AND u."role" = 'owner'
      LEFT JOIN "Subscription" s ON s."guestHouseId" = gh."id"
      ORDER BY gh."createdAt" DESC
    `)

    const all = rows as Record<string, unknown>[]

    // Filter: use subscriptionStatus (null = no subscription)
    let filtered = all
    if (filter === "none") {
      filtered = all.filter(r => !r.subscriptionId)
    } else if (filter !== "all") {
      filtered = all.filter(r => (r.subscriptionStatus as string) === filter)
    }

    // Add computed info for those with subscriptions
    const { buildSubscriptionInfo } = await import("@/lib/subscription")
    const enriched = filtered.map((row) => {
      const hasSubscription = !!row.subscriptionId
      const subForCompute = hasSubscription ? row : {
        plan: "free",
        status: "none",
        expiresAt: null,
        trialEndsAt: null,
        gracePeriodDays: 7,
      }
      return {
        ...row,
        hasSubscription,
        computed: buildSubscriptionInfo(subForCompute),
      }
    })

    // Stats
    const stats = {
      total: all.length,
      active: all.filter(r => r.subscriptionStatus === "active").length,
      trial: all.filter(r => r.subscriptionStatus === "trial").length,
      expired: all.filter(r => r.subscriptionStatus === "expired").length,
      grace_period: all.filter(r => r.subscriptionStatus === "grace_period").length,
      cancelled: all.filter(r => r.subscriptionStatus === "cancelled").length,
      none: all.filter(r => !r.subscriptionId).length,
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
