-- ============================================
-- Migration PMS v2.5.0 - PostgreSQL
-- Ajout colonne menuAccess pour permissions menu par utilisateur
-- ============================================

-- Ajouter la colonne menuAccess (JSON) sur la table User
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'menuAccess'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "menuAccess" JSONB;
  END IF;
END $$;

-- Mettre tous les propriétaires existants avec tous les menus activés
UPDATE "User"
SET "menuAccess" = '{
  "dashboard": true,
  "rooms": true,
  "housekeeping": true,
  "bookings": true,
  "guests": true,
  "invoices": true,
  "restaurant": true,
  "expenses": true,
  "statistics": true,
  "users": true,
  "settings": true
}'::jsonb
WHERE "role" = 'owner' AND "menuAccess" IS NULL;
