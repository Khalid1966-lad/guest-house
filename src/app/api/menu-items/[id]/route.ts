import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Récupérer un article du menu
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const menuItem = await db.menuItem.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!menuItem) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ menuItem })
  } catch (error) {
    console.error("Erreur récupération article:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// PUT - Mettre à jour un article du menu
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const existingItem = await db.menuItem.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      subcategory,
      price,
      image,
      isAvailable,
      isVegetarian,
      isVegan,
      allergens,
      preparationTime,
      sortOrder,
    } = body

    const menuItem = await db.menuItem.update({
      where: { id },
      data: {
        name: name || existingItem.name,
        description: description !== undefined ? description : existingItem.description,
        category: category || existingItem.category,
        subcategory: subcategory !== undefined ? subcategory : existingItem.subcategory,
        price: price !== undefined ? parseFloat(price) : existingItem.price,
        image: image !== undefined ? image : existingItem.image,
        isAvailable: isAvailable !== undefined ? isAvailable : existingItem.isAvailable,
        isVegetarian: isVegetarian !== undefined ? isVegetarian : existingItem.isVegetarian,
        isVegan: isVegan !== undefined ? isVegan : existingItem.isVegan,
        allergens: allergens !== undefined ? allergens : existingItem.allergens,
        preparationTime: preparationTime !== undefined ? parseInt(preparationTime) : existingItem.preparationTime,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : existingItem.sortOrder,
      },
    })

    return NextResponse.json({ menuItem })
  } catch (error) {
    console.error("Erreur mise à jour article:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer un article du menu
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const existingItem = await db.menuItem.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 })
    }

    await db.menuItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression article:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
