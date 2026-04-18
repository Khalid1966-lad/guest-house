/**
 * Ensures the Subscription table exists in the PostgreSQL database
 * and has all required columns (even if the table was created in an older version).
 *
 * Uses CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN IF NOT EXISTS
 * for full idempotency across schema versions.
 *
 * Uses raw SQL via pg module to avoid Prisma client dependency on the table.
 */

import { Pool } from "pg"

export async function ensureSubscriptionTable() {
  // Only run for PostgreSQL (not SQLite)
  const dbUrl = process.env.DATABASE_URL || ""
  if (!dbUrl.startsWith("postgresql://")) {
    return
  }

  const pool = new Pool({ connectionString: dbUrl })

  try {
    // 1. Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Subscription" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "guestHouseId" TEXT NOT NULL,
        "plan" TEXT NOT NULL DEFAULT 'free',
        "status" TEXT NOT NULL DEFAULT 'trial',
        "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3),
        "lastPaymentAt" TIMESTAMP(3),
        "lastPaymentRef" TEXT,
        "trialEndsAt" TIMESTAMP(3),
        "gracePeriodDays" INTEGER NOT NULL DEFAULT 7,
        "notes" TEXT,
        "changedBy" TEXT,
        "changedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Subscription_guestHouseId_key" UNIQUE ("guestHouseId"),
        CONSTRAINT "Subscription_guestHouseId_fkey" FOREIGN KEY ("guestHouseId") REFERENCES "GuestHouse"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)

    // 2. Ensure all columns exist (for tables created in older schema versions)
    const columns = [
      { name: "guestHouseId", type: "TEXT NOT NULL" },
      { name: "plan", type: "TEXT NOT NULL DEFAULT 'free'" },
      { name: "status", type: "TEXT NOT NULL DEFAULT 'trial'" },
      { name: "startedAt", type: "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "expiresAt", type: "TIMESTAMP(3)" },
      { name: "lastPaymentAt", type: "TIMESTAMP(3)" },
      { name: "lastPaymentRef", type: "TEXT" },
      { name: "trialEndsAt", type: "TIMESTAMP(3)" },
      { name: "gracePeriodDays", type: "INTEGER NOT NULL DEFAULT 7" },
      { name: "notes", type: "TEXT" },
      { name: "changedBy", type: "TEXT" },
      { name: "changedAt", type: "TIMESTAMP(3)" },
      { name: "createdAt", type: "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updatedAt", type: "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP" },
    ]

    for (const col of columns) {
      try {
        await pool.query(
          `ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`
        )
      } catch {
        // Column already exists — ignore
      }
    }

    console.log("[ensureSubscriptionTable] Subscription table verified/created with all columns.")
  } catch (error) {
    console.error("[ensureSubscriptionTable] Error creating Subscription table:", error)
  } finally {
    await pool.end()
  }
}
