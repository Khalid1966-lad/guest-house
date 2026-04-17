/**
 * Ensures the Backup table exists in the PostgreSQL database.
 * This is needed because Prisma schema changes require a schema push
 * which can't run automatically on Vercel deploy.
 *
 * This script creates the table if it doesn't exist (idempotent).
 * It uses raw SQL via pg module to avoid Prisma client dependency on the table.
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
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("[ensureBackupTable] Backup table verified/created.")
  } catch (error) {
    console.error("[ensureBackupTable] Error creating Backup table:", error)
  } finally {
    await pool.end()
  }
}
