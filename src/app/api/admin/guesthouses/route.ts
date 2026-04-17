import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Prisma } from "@prisma/client"

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
