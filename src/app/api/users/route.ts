import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"

// Helper: try to select menuAccess, return null if column doesn't exist
async function getUsersWithMenuAccess(guestHouseId: string) {
  try {
    return await db.user.findMany({
      where: { guestHouseId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        menuAccess: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    })
  } catch {
    // menuAccess column doesn't exist yet — fetch without it
    return await db.user.findMany({
      where: { guestHouseId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    })
  }
}

// Helper: try to create user with menuAccess
async function createUserWithMenuAccess(data: Record<string, unknown>, selectFields: Record<string, boolean>) {
  try {
    return await db.user.create({
      data: {
        email: data.email as string,
        firstName: (data.firstName as string) || null,
        lastName: (data.lastName as string) || null,
        name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null,
        password: data.hashedPassword as string,
        role: data.userRole as string,
        guestHouseId: data.guestHouseId as string,
        isActive: true,
        emailVerified: new Date(),
        menuAccess: (data.menuAccess as Record<string, boolean>) || null,
      },
      select: selectFields,
    })
  } catch {
    // menuAccess column doesn't exist — create without it
    return await db.user.create({
      data: {
        email: data.email as string,
        firstName: (data.firstName as string) || null,
        lastName: (data.lastName as string) || null,
        name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null,
        password: data.hashedPassword as string,
        role: data.userRole as string,
        guestHouseId: data.guestHouseId as string,
        isActive: true,
        emailVerified: new Date(),
      },
      select: selectFields,
    })
  }
}

// GET - List users in the guest house (owner only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Only owner can view users list
    if (session.user.role !== "owner") {
      return NextResponse.json(
        { error: "Permissions insuffisantes. Seul le propriétaire peut gérer les utilisateurs." },
        { status: 403 }
      )
    }

    const users = await getUsersWithMenuAccess(session.user.guestHouseId)
    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    )
  }
}

// POST - Create a new user (owner only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Only owner can create users
    if (session.user.role !== "owner") {
      return NextResponse.json(
        { error: "Seul le propriétaire peut créer des utilisateurs" },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { email, firstName, lastName, role, password } = data

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ["owner", "manager", "receptionist", "accountant", "housekeeping"]
    const userRole = role || "receptionist"
    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { error: "Rôle invalide" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await createUserWithMenuAccess(
      { email, firstName, lastName, userRole, hashedPassword, guestHouseId: session.user.guestHouseId, menuAccess: data.menuAccess },
      { id: true, email: true, name: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true }
    )

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    )
  }
}
