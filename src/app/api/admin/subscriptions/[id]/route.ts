import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireSuperAdmin } from "@/lib/session"

export const dynamic = "force-dynamic"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/subscriptions/[id] — get single subscription
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireSuperAdmin()
    const { id } = await params

    const result = await db.$queryRawUnsafe(
      `SELECT s.*, gh."name" as "guestHouseName", gh."code" as "guestHouseCode"
       FROM "Subscription" s
       JOIN "GuestHouse" gh ON s."guestHouseId" = gh."id"
       WHERE s."id" = $1`,
      id
    )

    if (!(result as any[]).length) {
      return NextResponse.json({ error: "Abonnement non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ subscription: (result as any[])[0] })
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error && (error as any).status === 401) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("[subscriptions] GET/[id] error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// PATCH /api/admin/subscriptions/[id] — update subscription
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const admin = await requireSuperAdmin()
    const { id } = await params

    const body = await request.json()
    const { plan, status, expiresAt, lastPaymentAt, lastPaymentRef, trialEndsAt, gracePeriodDays, notes, startedAt } = body

    // Build dynamic update
    const fields: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    const addField = (field: string, value: unknown) => {
      if (value !== undefined && value !== null) {
        fields.push(`"${field}" = $${paramIndex++}`)
        if (["expiresAt", "lastPaymentAt", "trialEndsAt", "changedAt", "startedAt"].includes(field)) {
          values.push(new Date(value as string))
        } else {
          values.push(value)
        }
      }
    }

    addField("plan", plan)
    addField("status", status)
    addField("expiresAt", expiresAt)
    addField("lastPaymentAt", lastPaymentAt)
    addField("lastPaymentRef", lastPaymentRef)
    addField("trialEndsAt", trialEndsAt)
    addField("gracePeriodDays", gracePeriodDays)
    addField("notes", notes)
    addField("startedAt", startedAt)

    // Always update changedBy and changedAt
    fields.push(`"changedBy" = $${paramIndex++}`)
    values.push(admin.user?.id || "super_admin")
    fields.push(`"changedAt" = $${paramIndex++}`)
    values.push(new Date())

    if (fields.length < 3) {
      return NextResponse.json({ error: "Aucune modification fournie" }, { status: 400 })
    }

    values.push(id)

    await db.$queryRawUnsafe(
      `UPDATE "Subscription" SET ${fields.join(", ")} WHERE "id" = $${paramIndex}`,
      ...values
    )

    // Sync plan to GuestHouse if plan changed
    if (plan) {
      const sub = await db.$queryRawUnsafe<{ guestHouseId: string }[]>(
        `SELECT "guestHouseId" FROM "Subscription" WHERE "id" = $1`, id
      )
      if (sub.length > 0) {
        await db.$executeRawUnsafe(
          `UPDATE "GuestHouse" SET "plan" = $1 WHERE "id" = $2`,
          plan, sub[0].guestHouseId
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error && (error as any).status === 401) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("[subscriptions] PATCH/[id] error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
