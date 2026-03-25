import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

// GET - Récupérer tous les articles du menu de la maison d'hôtes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const isAvailable = searchParams.get("isAvailable")

    const where: Prisma.MenuItemWhereInput = {
      guestHouseId: session.user.guestHouseId,
    }

    if (category && category !== "all") {
      where.category = category
    }

    if (isAvailable !== null && isAvailable !== "all") {
      where.isAvailable = isAvailable === "true"
    }

    const menuItems = await db.menuItem.findMany({
      where,
      orderBy: [
        { category: "asc" },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    })

    return NextResponse.json({ menuItems })
  } catch (error) {
    console.error("Erreur récupération menu:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer un nouvel article du menu
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      subcategory,
      price,
      currency,
      image,
      isAvailable,
      isVegetarian,
      isVegan,
      allergens,
      preparationTime,
      sortOrder,
    } = body

    // Validation
    if (!name || !category || price === undefined) {
      return NextResponse.json(
        { error: "Le nom, la catégorie et le prix sont requis" },
        { status: 400 }
      )
    }

    // Vérifier les catégories valides
    const validCategories = ["breakfast", "lunch", "dinner", "drinks", "snacks"]
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Catégorie invalide" },
        { status: 400 }
      )
    }

    const menuItem = await db.menuItem.create({
      data: {
        guestHouseId: session.user.guestHouseId,
        name,
        description: description || null,
        category,
        subcategory: subcategory || null,
        price: parseFloat(price) || 0,
        currency: currency || "EUR",
        image: image || null,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        isVegetarian: isVegetarian || false,
        isVegan: isVegan || false,
        allergens: allergens || null,
        preparationTime: preparationTime ? parseInt(preparationTime) : null,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      },
    })

    return NextResponse.json({ menuItem }, { status: 201 })
  } catch (error) {
    console.error("Erreur création article menu:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
