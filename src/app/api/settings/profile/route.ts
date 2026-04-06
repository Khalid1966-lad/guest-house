import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

// GET - Get current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        language: true,
        theme: true,
        createdAt: true,
        guestHouse: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            country: true,
            currency: true,
            timezone: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du profil" },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    // Build update data dynamically - only include provided fields
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.language !== undefined) updateData.language = data.language
    if (data.theme !== undefined) updateData.theme = data.theme
    // Allow avatar deletion (null) or keep existing
    if (data.avatar !== undefined) updateData.avatar = data.avatar

    // Update user
    const user = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        language: true,
        theme: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    )
  }
}

// PATCH - Change password
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.currentPassword || !data.newPassword) {
      return NextResponse.json(
        { error: "Mot de passe actuel et nouveau mot de passe requis" },
        { status: 400 }
      )
    }

    if (data.newPassword.length < 6) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      )
    }

    // Get current user with password
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })

    if (!user?.password) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(data.currentPassword, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10)

    // Update password
    await db.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ message: "Mot de passe mis à jour avec succès" })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json(
      { error: "Erreur lors du changement de mot de passe" },
      { status: 500 }
    )
  }
}
