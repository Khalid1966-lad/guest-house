import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

// Base select without menuAccess
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

// Check if menuAccess column exists
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

async function getUsersWithMenuAccess(guestHouseId: string) {
  const hasColumn = await menuAccessColumnExists()
  if (!hasColumn) {
    return await db.user.findMany({
      where: { guestHouseId },
      select: baseSelect,
      orderBy: { createdAt: "asc" },
    })
  }
  return await db.user.findMany({
    where: { guestHouseId },
    select: { ...baseSelect, menuAccess: true },
    orderBy: { createdAt: "asc" },
  })
}

// GET - List users in the guest house (owner only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

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

    if (session.user.role !== "owner") {
      return NextResponse.json(
        { error: "Seul le propriétaire peut créer des utilisateurs" },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { email, firstName, lastName, role, password } = data

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "Un utilisateur avec cet email existe déjà" }, { status: 400 })
    }

    const validRoles = ["owner", "manager", "receptionist", "accountant", "housekeeping", "femmeDeMenage", "gouvernant", "gouvernante"]
    const userRole = role || "receptionist"
    if (!validRoles.includes(userRole)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const hasColumn = await menuAccessColumnExists()

    // Build create data conditionally
    const createData: Record<string, unknown> = {
      email,
      firstName: firstName || null,
      lastName: lastName || null,
      name: firstName && lastName ? `${firstName} ${lastName}` : null,
      password: hashedPassword,
      role: userRole,
      guestHouseId: session.user.guestHouseId,
      isActive: true,
      emailVerified: new Date(),
    }
    if (hasColumn && data.menuAccess) {
      createData.menuAccess = data.menuAccess
    }

    const selectFields = hasColumn
      ? { ...baseSelect, menuAccess: true }
      : baseSelect

    const user = await db.user.create({
      data: createData,
      select: selectFields,
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    )
  }
}
