import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

// POST - Run auto-migration for menuAccess column
// This endpoint is called automatically by the frontend when it detects the column is missing
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Only owner or super_admin can run migrations
    if (session.user.role !== "owner" && session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Check if menuAccess column already exists by trying to query it
    try {
      await db.user.findFirst({
        select: { menuAccess: true },
        take: 1,
      })
      return NextResponse.json({ message: "Colonne menuAccess déjà existante", alreadyExists: true })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        console.log("[migrate] menuAccess column missing, running ALTER TABLE...")
      } else {
        throw err
      }
    }

    // Run raw SQL to add the column
    // Try PostgreSQL syntax first, then fallback
    try {
      await db.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'User' AND column_name = 'menuAccess'
          ) THEN
            ALTER TABLE "User" ADD COLUMN "menuAccess" JSONB;
          END IF;
        END $$;
      `)
    } catch {
      // Fallback for SQLite
      try {
        await db.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "menuAccess" TEXT;`)
      } catch (sqliteErr) {
        console.error("[migrate] Failed to add column:", sqliteErr)
        return NextResponse.json(
          { error: "Impossible d'ajouter la colonne menuAccess automatiquement. Exécutez la migration SQL manuellement." },
          { status: 500 }
        )
      }
    }

    // Set all existing owners to have all menus
    const allMenus = JSON.stringify({
      dashboard: true,
      rooms: true,
      housekeeping: true,
      bookings: true,
      guests: true,
      invoices: true,
      restaurant: true,
      expenses: true,
      statistics: true,
      users: true,
      settings: true,
    })

    try {
      await db.$executeRawUnsafe(`
        UPDATE "User" SET "menuAccess" = '${allMenus}'::jsonb
        WHERE "role" = 'owner' AND "menuAccess" IS NULL;
      `)
    } catch {
      // SQLite fallback — skip owner update, they always get all menus from code
      console.log("[migrate] Skipped owner menuAccess update (SQLite or JSONB not supported)")
    }

    return NextResponse.json({ 
      message: "Migration réussie ! Colonne menuAccess ajoutée." 
    })
  } catch (error) {
    console.error("[migrate] Migration error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la migration" },
      { status: 500 }
    )
  }
}
