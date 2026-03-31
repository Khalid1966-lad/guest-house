import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "super_admin") {
    return null
  }
  return session.user
}

// ============================================
// Ordre d'import/export des modèles
// Respecte les dépendances de clés étrangères
// ============================================
const MODEL_EXPORT_ORDER = [
  // Tables indépendantes (sans FK vers d'autres tables métier)
  "guestHouse",
  "guestHouseSetting",
  "user",
  "role",
  "amenity",
  "room",
  "roomPrice",
  "guest",
  "menuItem",
  // Tables avec FK vers les tables ci-dessus
  "booking",
  "invoice",
  "invoiceItem",
  "payment",
  "restaurantOrder",
  "orderItem",
  "expense",
  "auditLog",
  // Tables NextAuth (optionnel, pour backup complet)
  "account",
  "verificationToken",
] as const

type ModelName = (typeof MODEL_EXPORT_ORDER)[number]

// Mapping des noms de modèles Prisma vers les clés de requête
const PRISMA_MODEL_KEYS: Record<ModelName, string> = {
  guestHouse: "guestHouse",
  guestHouseSetting: "guestHouseSetting",
  user: "user",
  role: "role",
  amenity: "amenity",
  room: "room",
  roomPrice: "roomPrice",
  guest: "guest",
  menuItem: "menuItem",
  booking: "booking",
  invoice: "invoice",
  invoiceItem: "invoiceItem",
  payment: "payment",
  restaurantOrder: "restaurantOrder",
  orderItem: "orderItem",
  expense: "expense",
  auditLog: "auditLog",
  account: "account",
  verificationToken: "verificationToken",
}

// Ordre de suppression (inverse de l'ordre de création)
const DELETE_ORDER = [
  "orderItem",
  "restaurantOrder",
  "payment",
  "invoiceItem",
  "invoice",
  "booking",
  "menuItem",
  "guest",
  "roomPrice",
  "room",
  "amenity",
  "auditLog",
  "expense",
  "role",
  "user",
  "guestHouseSetting",
  "guestHouse",
  "verificationToken",
  "account",
] as const

// GET - Exporter toute la base de données en JSON
export async function GET() {
  const user = await requireSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    const backupData: Record<string, unknown[]> = {}
    const stats: Record<string, number> = {}
    let totalRecords = 0

    // Exporter chaque modèle dans l'ordre
    for (const modelName of MODEL_EXPORT_ORDER) {
      const modelKey = PRISMA_MODEL_KEYS[modelName]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = (db as any)[modelKey]

      if (model) {
        try {
          const records = await model.findMany({
            // Ne pas exporter les sessions NextAuth (trop volumineux et expirables)
            orderBy: { createdAt: "asc" },
          })
          backupData[modelName] = records
          stats[modelName] = records.length
          totalRecords += records.length
        } catch (err) {
          console.warn(`Skipping model ${modelName}:`, err)
          backupData[modelName] = []
          stats[modelName] = 0
        }
      }
    }

    const exportData = {
      meta: {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        exportedBy: "super_admin",
        totalRecords,
        modelStats: stats,
        databaseType: "sqlite",
      },
      data: backupData,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="pms-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (error) {
    console.error("Erreur export backup:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'export de la sauvegarde" },
      { status: 500 }
    )
  }
}

// POST - Restaurer la base de données depuis un fichier JSON
export async function POST(request: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    const body = await request.json()

    // Valider la structure du fichier de backup
    if (!body.meta || !body.data) {
      return NextResponse.json(
        { error: "Format de fichier de sauvegarde invalide. Le fichier doit contenir 'meta' et 'data'." },
        { status: 400 }
      )
    }

    if (!body.meta.version) {
      return NextResponse.json(
        { error: "Version de sauvegarde manquante" },
        { status: 400 }
      )
    }

    const restoreOptions = body.options || {}
    const skipAuthTables = restoreOptions.skipAuthTables !== false // Par défaut, sauter les tables auth
    const skipAuditLogs = restoreOptions.skipAuditLogs === true // Par défaut, garder les audit logs
    const confirmRestore = restoreOptions.confirm === true

    if (!confirmRestore) {
      return NextResponse.json(
        { error: "Veuillez confirmer la restauration en passant options.confirm = true" },
        { status: 400 }
      )
    }

    const data = body.data as Record<string, unknown[]>
    let restoredCount = 0
    const restoreStats: Record<string, number> = {}

    // ============================================
    // Phase 1 : Supprimer toutes les données existantes
    // ============================================
    for (const modelName of DELETE_ORDER) {
      if (modelName === "session") continue // Ne jamais supprimer les sessions via backup

      const modelKey = modelName.charAt(0).toUpperCase() + modelName.slice(1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = (db as any)[modelKey]

      if (model) {
        try {
          const whereClause: Record<string, unknown> = {}

          // Ne pas supprimer les comptes super admin
          if (modelName === "user") {
            whereClause.id = { not: "super-admin-hardcoded" }
          }

          const count = await model.count({ where: Object.keys(whereClause).length > 0 ? whereClause : undefined })
          if (count > 0) {
            await model.deleteMany({ where: Object.keys(whereClause).length > 0 ? whereClause : undefined })
          }
        } catch (err) {
          console.warn(`Erreur suppression ${modelName}:`, err)
        }
      }
    }

    // ============================================
    // Phase 2 : Réinsérer les données dans l'ordre
    // ============================================

    // Fonction pour nettoyer les données avant insertion
    function cleanRecord(record: Record<string, unknown>): Record<string, unknown> {
      const cleaned = { ...record }
      // Supprimer les champs auto-générés par Prisma qui peuvent causer des conflits
      // Mais on garde l'id pour préserver les références
      return cleaned
    }

    // Fonction générique pour créer un enregistrement
    async function createRecords(modelName: ModelName, records: unknown[]): Promise<number> {
      if (!records || records.length === 0) return 0

      const modelKey = modelName.charAt(0).toUpperCase() + modelName.slice(1) as string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = (db as any)[modelKey]
      if (!model) return 0

      let created = 0
      const batchSize = 50

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)
        for (const record of batch) {
          try {
            const cleaned = cleanRecord(record as Record<string, unknown>)

            // Ne pas recréer le super admin
            if (modelName === "user" && cleaned.id === "super-admin-hardcoded") {
              continue
            }

            // Convertir les dates string en objets Date
            for (const [key, value] of Object.entries(cleaned)) {
              if (typeof value === "string" && isDateString(value)) {
                cleaned[key] = new Date(value)
              }
            }

            await model.create({
              data: cleaned,
            })
            created++
          } catch (err: unknown) {
            const prismaErr = err as { code?: string; meta?: Record<string, unknown>; message?: string }
            // Ignorer les doublons (conflits d'unicité)
            if (prismaErr.code === "P2002") {
              console.warn(`Doublon ignoré pour ${modelName}:`, prismaErr.meta?.target)
              continue
            }
            // Ignorer les erreurs de clé étrangère
            if (prismaErr.code === "P2003") {
              console.warn(`FK ignorée pour ${modelName}:`, prismaErr.meta)
              continue
            }
            console.error(`Erreur insertion ${modelName}:`, prismaErr.message || prismaErr)
          }
        }
      }

      return created
    }

    // Détecter si une date string est une date ISO
    function isDateString(value: string): boolean {
      return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value)
    }

    // Guest Houses
    restoredCount += await createRecords("guestHouse", data["guestHouse"] || [])
    restoreStats["guestHouse"] = restoredCount

    // Guest House Settings
    restoredCount += await createRecords("guestHouseSetting", data["guestHouseSetting"] || [])

    // Users (sauf super admin)
    const userCount = await createRecords("user", data["user"] || [])
    restoreStats["user"] = userCount
    restoredCount += userCount

    // Roles
    const roleCount = await createRecords("role", data["role"] || [])
    restoreStats["role"] = roleCount
    restoredCount += roleCount

    // Amenities
    const amenityCount = await createRecords("amenity", data["amenity"] || [])
    restoreStats["amenity"] = amenityCount
    restoredCount += amenityCount

    // Rooms
    const roomCount = await createRecords("room", data["room"] || [])
    restoreStats["room"] = roomCount
    restoredCount += roomCount

    // Room Prices
    const roomPriceCount = await createRecords("roomPrice", data["roomPrice"] || [])
    restoreStats["roomPrice"] = roomPriceCount
    restoredCount += roomPriceCount

    // Guests
    const guestCount = await createRecords("guest", data["guest"] || [])
    restoreStats["guest"] = guestCount
    restoredCount += guestCount

    // Menu Items
    const menuItemCount = await createRecords("menuItem", data["menuItem"] || [])
    restoreStats["menuItem"] = menuItemCount
    restoredCount += menuItemCount

    // Bookings
    const bookingCount = await createRecords("booking", data["booking"] || [])
    restoreStats["booking"] = bookingCount
    restoredCount += bookingCount

    // Invoices
    const invoiceCount = await createRecords("invoice", data["invoice"] || [])
    restoreStats["invoice"] = invoiceCount
    restoredCount += invoiceCount

    // Invoice Items
    const invoiceItemCount = await createRecords("invoiceItem", data["invoiceItem"] || [])
    restoreStats["invoiceItem"] = invoiceItemCount
    restoredCount += invoiceItemCount

    // Payments
    const paymentCount = await createRecords("payment", data["payment"] || [])
    restoreStats["payment"] = paymentCount
    restoredCount += paymentCount

    // Restaurant Orders
    const orderCount = await createRecords("restaurantOrder", data["restaurantOrder"] || [])
    restoreStats["restaurantOrder"] = orderCount
    restoredCount += orderCount

    // Order Items
    const orderItemCount = await createRecords("orderItem", data["orderItem"] || [])
    restoreStats["orderItem"] = orderItemCount
    restoredCount += orderItemCount

    // Expenses
    const expenseCount = await createRecords("expense", data["expense"] || [])
    restoreStats["expense"] = expenseCount
    restoredCount += expenseCount

    // Audit Logs
    if (!skipAuditLogs) {
      const auditCount = await createRecords("auditLog", data["auditLog"] || [])
      restoreStats["auditLog"] = auditCount
      restoredCount += auditCount
    }

    // Tables auth (optionnel)
    if (!skipAuthTables) {
      // Accounts
      const accountCount = await createRecords("account", data["account"] || [])
      restoreStats["account"] = accountCount
      restoredCount += accountCount

      // Verification Tokens
      const vtCount = await createRecords("verificationToken", data["verificationToken"] || [])
      restoreStats["verificationToken"] = vtCount
      restoredCount += vtCount
    }

    return NextResponse.json({
      success: true,
      message: "Base de données restaurée avec succès",
      stats: {
        totalRecordsRestored: restoredCount,
        byModel: restoreStats,
        backupInfo: {
          originalExportDate: body.meta.exportedAt,
          originalRecordCount: body.meta.totalRecords,
        },
      },
    })
  } catch (error) {
    console.error("Erreur restauration backup:", error)
    return NextResponse.json(
      { error: "Erreur lors de la restauration. La base de données peut être dans un état incohérent." },
      { status: 500 }
    )
  }
}

// DELETE - Vider toute la base de données (reset complet)
export async function DELETE(request: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const confirm = searchParams.get("confirm") === "true"

    if (!confirm) {
      return NextResponse.json(
        { error: "Veuillez confirmer le reset en ajoutant ?confirm=true" },
        { status: 400 }
      )
    }

    let totalDeleted = 0

    for (const modelName of DELETE_ORDER) {
      const modelKey = modelName.charAt(0).toUpperCase() + modelName.slice(1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = (db as any)[modelKey]

      if (model) {
        try {
          const count = await model.count()
          if (count > 0) {
            await model.deleteMany()
            totalDeleted += count
          }
        } catch (err) {
          console.warn(`Erreur suppression ${modelName}:`, err)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Base de données réinitialisée. ${totalDeleted} enregistrements supprimés.`,
      totalDeleted,
    })
  } catch (error) {
    console.error("Erreur reset base de données:", error)
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation" },
      { status: 500 }
    )
  }
}
