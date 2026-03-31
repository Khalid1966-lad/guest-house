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

// GET - Détails d'une maison d'hôtes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  try {
    const guestHouse = await db.guestHouse.findUnique({
      where: { id },
      include: {
        settings: true,
        users: {
          select: { id: true, name: true, firstName: true, lastName: true, email: true, role: true, isActive: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            rooms: true,
            guests: true,
            bookings: true,
            invoices: true,
            payments: true,
            restaurantOrders: true,
            menuItems: true,
            expenses: true,
            amenities: true,
            roles: true,
            auditLogs: true,
          },
        },
      },
    })

    if (!guestHouse) {
      return NextResponse.json({ error: "Maison d'hôtes non trouvée" }, { status: 404 })
    }

    const counts = guestHouse._count
    const totalRecords =
      counts.rooms + counts.guests + counts.bookings + counts.invoices +
      counts.payments + counts.restaurantOrders + counts.menuItems +
      counts.expenses + counts.amenities + counts.roles + counts.auditLogs +
      guestHouse.users.length
    const estimatedSizeKo = Math.round((totalRecords * 350) / 1024)

    return NextResponse.json({
      guestHouse: {
        ...guestHouse,
        counts: { ...counts, totalRecords, estimatedSizeKo },
      },
    })
  } catch (error) {
    console.error("Erreur détail maison d'hôtes:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// PATCH - Mettre à jour une maison d'hôtes (données + statut + mot de passe owner)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const {
      // Champs de la guest house
      name, slug, description, address, city, postalCode, country,
      phone, email, website, logo, coverImage, currency, timezone,
      taxRate, plan, status, isActive,
      subscriptionStartDate, subscriptionEndDate,
      trialEndsAt,
      // Réinitialisation mot de passe
      resetOwnerId, resetOwnerPassword,
    } = body

    const existing = await db.guestHouse.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Maison d'hôtes non trouvée" }, { status: 404 })
    }

    // ============================================
    // Réinitialisation du mot de passe du propriétaire
    // ============================================
    if (resetOwnerId && resetOwnerPassword) {
      const ownerUser = await db.user.findFirst({
        where: { id: resetOwnerId, guestHouseId: id },
      })
      if (!ownerUser) {
        return NextResponse.json({ error: "Utilisateur non trouvé dans cette maison d'hôtes" }, { status: 404 })
      }
      const hashedPassword = await bcrypt.hash(resetOwnerPassword, 10)
      await db.user.update({
        where: { id: resetOwnerId },
        data: { password: hashedPassword },
      })
      return NextResponse.json({
        success: true,
        message: `Mot de passe de ${ownerUser.firstName || ownerUser.name} réinitialisé avec succès`,
      })
    }

    // ============================================
    // Mise à jour des données de la guest house
    // ============================================
    const updateData: Prisma.GuestHouseUpdateInput = {}

    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (postalCode !== undefined) updateData.postalCode = postalCode
    if (country !== undefined) updateData.country = country
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (website !== undefined) updateData.website = website
    if (logo !== undefined) updateData.logo = logo
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (currency !== undefined) updateData.currency = currency
    if (timezone !== undefined) updateData.timezone = timezone
    if (taxRate !== undefined) updateData.taxRate = taxRate
    if (plan !== undefined) updateData.plan = plan
    if (typeof isActive === "boolean") updateData.isActive = isActive

    if (status !== undefined) {
      updateData.status = status
      if (status === "active") updateData.isActive = true
      if (status === "blocked") updateData.isActive = false
    }
    if (subscriptionStartDate !== undefined) updateData.subscriptionStartDate = new Date(subscriptionStartDate)
    if (subscriptionEndDate !== undefined) updateData.subscriptionEndDate = new Date(subscriptionEndDate)
    if (trialEndsAt !== undefined) updateData.trialEndsAt = new Date(trialEndsAt)

    const updated = await db.guestHouse.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      guestHouse: updated,
    })
  } catch (error) {
    console.error("Erreur mise à jour maison d'hôtes:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer une maison d'hôtes et toutes ses données
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  try {
    const existing = await db.guestHouse.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Maison d'hôtes non trouvée" }, { status: 404 })
    }

    await db.guestHouse.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: `Maison d'hôtes "${existing.name}" supprimée avec toutes ses données`,
    })
  } catch (error) {
    console.error("Erreur suppression maison d'hôtes:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
