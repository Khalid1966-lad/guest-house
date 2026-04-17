import { PrismaClient } from '@prisma/client'
import { ensureBackupTable } from './ensure-backup-table'
import { ensureSubscriptionTable } from './ensure-subscription-table'
import { ensureHousekeepingTables } from './ensure-housekeeping-tables'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Ensure the Backup, Subscription, and Housekeeping tables exist on PostgreSQL (Vercel/Neon)
// This runs once per cold start and is idempotent
if (typeof window === 'undefined') {
  ensureBackupTable().catch((err) => {
    console.error('[db] Failed to ensure Backup table:', err)
  })
  ensureSubscriptionTable().catch((err) => {
    console.error('[db] Failed to ensure Subscription table:', err)
  })
  ensureHousekeepingTables().catch((err) => {
    console.error('[db] Failed to ensure Housekeeping tables:', err)
  })
}

// Force re-export to ensure all models are available
export type { PrismaClient }