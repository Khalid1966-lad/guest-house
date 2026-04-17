/**
 * Ensures the Subscription table exists in the PostgreSQL database.
 * This is needed because Prisma schema changes require a schema push
 * which can't run automatically on Vercel deploy.
 *
 * This script creates the table if it doesn't exist (idempotent).
 * It uses raw SQL via pg module to avoid Prisma client dependency on the table.
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
    console.log("[ensureSubscriptionTable] Subscription table verified/created.")
  } catch (error) {
    console.error("[ensureSubscriptionTable] Error creating Subscription table:", error)
  } finally {
    await pool.end()
  }
}
