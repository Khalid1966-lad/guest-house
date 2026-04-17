/**
 * Ensures the HousekeepingZone and StaffSchedule tables exist in PostgreSQL.
 * Also adds new columns to GuestHouseSetting if missing.
 * This runs on cold start (same pattern as ensure-subscription-table.ts).
 */

import { Pool } from "pg"

export async function ensureHousekeepingTables() {
  const dbUrl = process.env.DATABASE_URL || ""
  if (!dbUrl.startsWith("postgresql://")) return

  const pool = new Pool({ connectionString: dbUrl })

  try {
    // 1. Create HousekeepingZone table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "HousekeepingZone" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "guestHouseId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "zoneType" TEXT NOT NULL DEFAULT 'floor',
        "floorNumber" INTEGER,
        "roomIds" TEXT NOT NULL DEFAULT '[]',
        "zoneName" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "HousekeepingZone_userId_key" UNIQUE ("userId"),
        CONSTRAINT "HousekeepingZone_guestHouseId_fkey" FOREIGN KEY ("guestHouseId") REFERENCES "GuestHouse"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "HousekeepingZone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)

    // 2. Create StaffSchedule table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "StaffSchedule" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "guestHouseId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "dayOfWeek" INTEGER NOT NULL,
        "startTime" TEXT NOT NULL DEFAULT '07:00',
        "endTime" TEXT NOT NULL DEFAULT '15:00',
        "isAvailable" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "StaffSchedule_userId_dayOfWeek_key" UNIQUE ("userId", "dayOfWeek"),
        CONSTRAINT "StaffSchedule_guestHouseId_fkey" FOREIGN KEY ("guestHouseId") REFERENCES "GuestHouse"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "StaffSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)

    // 3. Add new columns to GuestHouseSetting (if missing)
    const settingColumns = [
      { name: "autoAssignHousekeeping", type: "BOOLEAN NOT NULL DEFAULT false" },
      { name: "autoAssignMode", type: "TEXT NOT NULL DEFAULT 'zone'" },
      { name: "autoStartCleaning", type: "BOOLEAN NOT NULL DEFAULT false" },
      { name: "defaultCleaningPriority", type: "TEXT NOT NULL DEFAULT 'normal'" },
    ]

    for (const col of settingColumns) {
      try {
        await pool.query(
          `ALTER TABLE "GuestHouseSetting" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`
        )
      } catch (alterErr) {
        // Column might already exist — ignore
        console.debug(`[ensureHousekeepingTables] Column ${col.name}:`, (alterErr as Error).message)
      }
    }

    console.log("[ensureHousekeepingTables] Housekeeping tables verified/created.")
  } catch (error) {
    console.error("[ensureHousekeepingTables] Error:", error)
  } finally {
    await pool.end()
  }
}
