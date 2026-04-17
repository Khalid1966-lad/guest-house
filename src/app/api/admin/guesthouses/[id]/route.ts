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

// PATCH - Mettre à jour le statut d'une maison d'hôtes
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
    const { status, plan, isActive, action, userId, newPassword } = body

    const existing = await db.guestHouse.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, role: true },
        },
      },
    })
    if (!existing) {
      return NextResponse.json({ error: "Maison d'hôtes non trouvée" }, { status: 404 })
    }

    // Handle password reset for a user belonging to this guesthouse
    if (action === "resetPassword") {
      if (!userId) {
        return NextResponse.json({ error: "L'ID utilisateur est requis" }, { status: 400 })
      }
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 })
      }

      // Verify the user belongs to this guesthouse
      const targetUser = existing.users.find(u => u.id === userId)
      if (!targetUser) {
        return NextResponse.json({ error: "Utilisateur non trouvé dans cette maison d'hôtes" }, { status: 404 })
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      })

      return NextResponse.json({
        success: true,
        message: "Mot de passe réinitialisé avec succès",
      })
    }

    const updateData: Prisma.GuestHouseUpdateInput = {}

    if (status) {
      updateData.status = status
      // Si on active, mettre isActive à true aussi
      if (status === "active") updateData.isActive = true
      if (status === "blocked") updateData.isActive = false
    }
    if (plan) updateData.plan = plan
    if (typeof isActive === "boolean") updateData.isActive = isActive

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

    // Supprimer la maison d'hôtes (cascade supprimera toutes les données liées)
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
