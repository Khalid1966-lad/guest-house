import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

interface RouteParams {
  params: Promise<{ id: string }>
}

const baseSelect = {
  id: true,
  email: true,
  name: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
}

let columnExistsCache: boolean | null = null

async function menuAccessColumnExists(): Promise<boolean> {
  if (columnExistsCache !== null) return columnExistsCache
  try {
    await db.$queryRawUnsafe(`SELECT "menuAccess" FROM "User" LIMIT 0`)
    columnExistsCache = true
    return true
  } catch {
    columnExistsCache = false
    return false
  }
}

// GET - Get a single user (owner only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    if (session.user.role !== "owner") {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
    }

    const hasColumn = await menuAccessColumnExists()
    const selectFields = hasColumn
      ? { ...baseSelect, language: true, theme: true, menuAccess: true }
      : { ...baseSelect, language: true, theme: true }

    const user = await db.user.findFirst({
      where: { id, guestHouseId: session.user.guestHouseId },
      select: selectFields,
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'utilisateur" },
      { status: 500 }
    )
  }
}

// PUT - Update a user (owner only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    if (session.user.role !== "owner") {
      return NextResponse.json(
        { error: "Seul le propriétaire peut modifier des utilisateurs" },
        { status: 403 }
      )
    }

    const data = await request.json()

    const existingUser = await db.user.findFirst({
      where: { id, guestHouseId: session.user.guestHouseId },
    })
    if (!existingUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    if (data.role) {
      const validRoles = ["owner", "manager", "receptionist", "accountant", "housekeeping", "femmeDeMenage", "gouvernant", "gouvernante"]
      if (!validRoles.includes(data.role)) {
        return NextResponse.json({ error: "Rôle invalide" }, { status: 400 })
      }
    }

    if (existingUser.role === "owner" && data.role && data.role !== "owner") {
      const ownerCount = await db.user.count({
        where: { guestHouseId: session.user.guestHouseId, role: "owner" },
      })
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "Impossible de modifier le rôle du dernier propriétaire" },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {
      firstName: data.firstName,
      lastName: data.lastName,
      name: data.firstName && data.lastName
        ? `${data.firstName} ${data.lastName}`
        : data.firstName || data.lastName || null,
      phone: data.phone,
      role: data.role,
    }

    if (data.menuAccess !== undefined) {
      const hasColumn = await menuAccessColumnExists()
      if (hasColumn) {
        updateData.menuAccess = data.menuAccess
      }
    }

    const hasColumn = await menuAccessColumnExists()
    const selectFields = hasColumn
      ? { ...baseSelect, menuAccess: true }
      : baseSelect

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: selectFields,
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    )
  }
}

// PATCH - Block/unblock user or reset password (owner only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    if (session.user.role !== "owner") {
      return NextResponse.json(
        { error: "Seul le propriétaire peut effectuer cette action" },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { action } = data

    const existingUser = await db.user.findFirst({
      where: { id, guestHouseId: session.user.guestHouseId },
    })
    if (!existingUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas effectuer cette action sur votre propre compte" },
        { status: 400 }
      )
    }

    if (action === "toggleBlock") {
      const hasColumn = await menuAccessColumnExists()
      const selectFields = hasColumn
        ? { ...baseSelect, menuAccess: true }
        : baseSelect

      const user = await db.user.update({
        where: { id },
        data: { isActive: !existingUser.isActive },
        select: selectFields,
      })

      return NextResponse.json({
        user,
        message: user.isActive ? "Utilisateur débloqué" : "Utilisateur bloqué",
      })
    }

    if (action === "resetPassword") {
      const { newPassword } = data
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: "Le mot de passe doit contenir au moins 6 caractères" },
          { status: 400 }
        )
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await db.user.update({
        where: { id },
        data: { password: hashedPassword },
      })
      return NextResponse.json({ message: "Mot de passe réinitialisé avec succès" })
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 })
  } catch (error) {
    console.error("Error in PATCH /api/users/[id]:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'action sur l'utilisateur" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a user (owner only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    if (session.user.role !== "owner") {
      return NextResponse.json(
        { error: "Seul le propriétaire peut supprimer des utilisateurs" },
        { status: 403 }
      )
    }

    const existingUser = await db.user.findFirst({
      where: { id, guestHouseId: session.user.guestHouseId },
    })
    if (!existingUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      )
    }
    if (existingUser.role === "owner") {
      const ownerCount = await db.user.count({
        where: { guestHouseId: session.user.guestHouseId, role: "owner" },
      })
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "Impossible de supprimer le dernier propriétaire" },
          { status: 400 }
        )
      }
    }

    await db.user.delete({ where: { id } })
    return NextResponse.json({ message: "Utilisateur supprimé" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    )
  }
}
