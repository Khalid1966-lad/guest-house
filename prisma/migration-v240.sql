-- ============================================
-- Migration PMS v2.4.0 - PostgreSQL
-- Colonnes et tables manquantes pour :
--   - Mode de tarification (pricingMode)
--   - Photos des chambres (images)
--   - Mode de paiement (paymentMethod)
--   - Gestion du ménage (cleaningStatus + CleaningTask)
-- ============================================

BEGIN;

-- 1. Room: Ajouter cleaningStatus, cleaningUpdatedAt, cleaningNotes
ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "cleaningStatus" TEXT;
ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "cleaningUpdatedAt" TIMESTAMP(3);
ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "cleaningNotes" TEXT;

-- 2. Room: Ajouter pricingMode (per_room | per_person)
ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "pricingMode" TEXT NOT NULL DEFAULT 'per_room';

-- 3. Room: Ajouter images (JSON string)
ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "images" TEXT;

-- 4. Invoice: Ajouter paymentMethod
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;

-- 5. Role: Ajouter canManageHousekeeping
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "canManageHousekeeping" BOOLEAN NOT NULL DEFAULT false;

-- 6. GuestHouse: Ajouter code
ALTER TABLE "GuestHouse" ADD COLUMN IF NOT EXISTS "code" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "GuestHouse_code_key" ON "GuestHouse"("code");

-- 7. Créer la table CleaningTask
CREATE TABLE IF NOT EXISTS "CleaningTask" (
    "id" TEXT NOT NULL,
    "guestHouseId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "damageNotes" TEXT,
    "hasDamage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningTask_pkey" PRIMARY KEY ("id")
);

-- Indexes pour CleaningTask
CREATE INDEX IF NOT EXISTS "CleaningTask_guestHouseId_idx" ON "CleaningTask"("guestHouseId");
CREATE INDEX IF NOT EXISTS "CleaningTask_roomId_idx" ON "CleaningTask"("roomId");
CREATE INDEX IF NOT EXISTS "CleaningTask_assignedToId_idx" ON "CleaningTask"("assignedToId");
CREATE INDEX IF NOT EXISTS "CleaningTask_status_idx" ON "CleaningTask"("status");

-- Foreign keys pour CleaningTask
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CleaningTask_guestHouseId_fkey') THEN
        ALTER TABLE "CleaningTask" ADD CONSTRAINT "CleaningTask_guestHouseId_fkey"
            FOREIGN KEY ("guestHouseId") REFERENCES "GuestHouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CleaningTask_roomId_fkey') THEN
        ALTER TABLE "CleaningTask" ADD CONSTRAINT "CleaningTask_roomId_fkey"
            FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CleaningTask_assignedToId_fkey') THEN
        ALTER TABLE "CleaningTask" ADD CONSTRAINT "CleaningTask_assignedToId_fkey"
            FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CleaningTask_verifiedById_fkey') THEN
        ALTER TABLE "CleaningTask" ADD CONSTRAINT "CleaningTask_verifiedById_fkey"
            FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 8. Créer la table CleaningTaskItem
CREATE TABLE IF NOT EXISTS "CleaningTaskItem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "checkedAt" TIMESTAMP(3),
    "checkedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningTaskItem_pkey" PRIMARY KEY ("id")
);

-- Index pour CleaningTaskItem
CREATE INDEX IF NOT EXISTS "CleaningTaskItem_taskId_idx" ON "CleaningTaskItem"("taskId");

-- Foreign keys pour CleaningTaskItem
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CleaningTaskItem_taskId_fkey') THEN
        ALTER TABLE "CleaningTaskItem" ADD CONSTRAINT "CleaningTaskItem_taskId_fkey"
            FOREIGN KEY ("taskId") REFERENCES "CleaningTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CleaningTaskItem_checkedById_fkey') THEN
        ALTER TABLE "CleaningTaskItem" ADD CONSTRAINT "CleaningTaskItem_checkedById_fkey"
            FOREIGN KEY ("checkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

COMMIT;
