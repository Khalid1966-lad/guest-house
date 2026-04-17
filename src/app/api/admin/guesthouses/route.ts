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

// Compter les enregistrements pour une maison d'hôtes
async function getGuestHouseCounts(guestHouseId: string) {
  const [rooms, guests, bookings, invoices, payments, restaurantOrders, menuItems, expenses, amenities, users, auditLogs] =
    await Promise.all([
      db.room.count({ where: { guestHouseId } }),
      db.guest.count({ where: { guestHouseId } }),
      db.booking.count({ where: { guestHouseId } }),
      db.invoice.count({ where: { guestHouseId } }),
      db.payment.count({ where: { guestHouseId } }),
      db.restaurantOrder.count({ where: { guestHouseId } }),
      db.menuItem.count({ where: { guestHouseId } }),
      db.expense.count({ where: { guestHouseId } }),
      db.amenity.count({ where: { guestHouseId } }),
      db.user.count({ where: { guestHouseId } }),
      db.auditLog.count({ where: { guestHouseId } }),
    ])
  return { rooms, guests, bookings, invoices, payments, restaurantOrders, menuItems, expenses, amenities, users, auditLogs }
}

export async function GET(request: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const plan = searchParams.get("plan")
    const search = searchParams.get("search")

    const where: Prisma.GuestHouseWhereInput = {}
    if (status && status !== "all") {
      where.status = status
    }
    if (plan && plan !== "all") {
      where.plan = plan
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { email: { contains: search } },
        { city: { contains: search } },
      ]
    }

    // Récupérer les maisons d'hôtes avec propriétaires
    const guestHouses = await db.guestHouse.findMany({
      where,
      include: {
        users: {
          where: { role: "owner" },
          select: { id: true, name: true, firstName: true, lastName: true, email: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Récupérer les stats pour chaque maison d'hôtes
    const guestHousesWithStats = []
    for (const gh of guestHouses) {
      const counts = await getGuestHouseCounts(gh.id)
      const totalRecords = Object.values(counts).reduce((sum, c) => sum + c, 0)
      const estimatedSizeKo = Math.round((totalRecords * 350) / 1024)

      guestHousesWithStats.push({
        id: gh.id,
        name: gh.name,
        slug: gh.slug,
        description: gh.description,
        city: gh.city,
        country: gh.country,
        email: gh.email,
        phone: gh.phone,
        plan: gh.plan,
        status: gh.status,
        isActive: gh.isActive,
        trialEndsAt: gh.trialEndsAt,
        createdAt: gh.createdAt,
        updatedAt: gh.updatedAt,
        owner: gh.users[0] || null,
        counts: { ...counts, totalRecords, estimatedSizeKo },
      })
    }

    // Stats globales
    const total = guestHouses.length
    const active = guestHouses.filter((gh) => gh.status === "active").length
    const pending = guestHouses.filter((gh) => gh.status === "pending").length
    const blocked = guestHouses.filter((gh) => gh.status === "blocked").length
    const suspended = guestHouses.filter((gh) => gh.status === "suspended").length

    // Récupérer les utilisateurs inscrits mais sans maison d'hôtes (inscriptions en attente)
    const pendingUsers = await db.user.findMany({
      where: {
        role: "owner",
        guestHouseId: null,
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      guestHouses: guestHousesWithStats,
      stats: { total, active, pending, blocked, suspended },
      pendingUsers,
    })
  } catch (error) {
    console.error("Erreur récupération maisons d'hôtes admin:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// Supprimer un utilisateur inscrit en attente (sans maison d'hôtes)
export async function DELETE(request: NextRequest) {
  const admin = await requireSuperAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 })
    }

    // Vérifier que l'utilisateur existe et n'a PAS de maison d'hôtes
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, guestHouseId: true, name: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    if (user.guestHouseId) {
      return NextResponse.json(
        { error: "Impossible de supprimer un utilisateur lié à une maison d'hôtes. Supprimez d'abord la maison d'hôtes." },
        { status: 400 }
      )
    }

    if (user.role !== "owner") {
      return NextResponse.json(
        { error: "Seuls les comptes propriétaires en attente peuvent être supprimés" },
        { status: 400 }
      )
    }

    // Supprimer l'utilisateur
    await db.user.delete({ where: { id: userId } })

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${user.email} supprimé avec succès`,
    })
  } catch (error) {
    console.error("Erreur suppression utilisateur en attente:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// Réinitialiser le mot de passe d'un utilisateur en attente
export async function PATCH(request: NextRequest) {
  const admin = await requireSuperAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { userId, newPassword } = body

    if (!userId || !newPassword) {
      return NextResponse.json({ error: "userId et newPassword requis" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 })
    }

    // Vérifier que l'utilisateur existe et n'a PAS de maison d'hôtes
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, guestHouseId: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    if (user.guestHouseId) {
      return NextResponse.json(
        { error: "Utilisez la gestion de la maison d'hôtes pour réinitialiser ce mot de passe" },
        { status: 400 }
      )
    }

    // Hasher et mettre à jour le mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true, message: "Mot de passe réinitialisé avec succès" })
  } catch (error) {
    console.error("Erreur reset mot de passe utilisateur en attente:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
