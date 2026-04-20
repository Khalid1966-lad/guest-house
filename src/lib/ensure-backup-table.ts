/**
 * Ensures the Backup table exists in the PostgreSQL database
 * and has all required columns (even if the table was created in an older version).
 *
 * Uses CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN IF NOT EXISTS
 * for full idempotency across schema versions.
 *
 * Uses raw SQL via pg module to avoid Prisma client dependency on the table.
 */

import { Pool } from "pg"

export async function ensureBackupTable() {
  // Only run for PostgreSQL (not SQLite)
  const dbUrl = process.env.DATABASE_URL || ""
  if (!dbUrl.startsWith("postgresql://")) {
    return
  }

  const pool = new Pool({ connectionString: dbUrl })

  try {
    // 1. Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Backup" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "label" TEXT,
        "type" TEXT NOT NULL DEFAULT 'manual',
        "compressedData" TEXT NOT NULL,
        "sizeKo" INTEGER NOT NULL,
        "tableCount" INTEGER NOT NULL,
        "tableSummary" TEXT NOT NULL DEFAULT '{}',
        "guestHouseList" TEXT NOT NULL DEFAULT '[]',
        "createdBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 2. Ensure all columns exist (for tables created in older schema versions)
    const columns = [
      { name: "label", type: "TEXT" },
      { name: "type", type: "TEXT NOT NULL DEFAULT 'manual'" },
      { name: "compressedData", type: "TEXT NOT NULL" },
      { name: "sizeKo", type: "INTEGER NOT NULL" },
      { name: "tableCount", type: "INTEGER NOT NULL" },
      { name: "tableSummary", type: "TEXT NOT NULL DEFAULT '{}'" },
      { name: "guestHouseList", type: "TEXT NOT NULL DEFAULT '[]'" },
      { name: "createdBy", type: "TEXT NOT NULL" },
      { name: "createdAt", type: "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP" },
    ]

    for (const col of columns) {
      try {
        await pool.query(
          `ALTER TABLE "Backup" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`
        )
      } catch {
        // Column already exists — ignore
      }
    }

    console.log("[ensureBackupTable] Backup table verified/created with all columns.")
  } catch (error) {
    console.error("[ensureBackupTable] Error creating Backup table:", error)
  } finally {
    await pool.end()
  }
}
