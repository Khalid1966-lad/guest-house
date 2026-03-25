import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

// GET - Récupérer toutes les commandes restaurant de la maison d'hôtes
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
    const status = searchParams.get("status")
    const paymentStatus = searchParams.get("paymentStatus")
    const orderType = searchParams.get("orderType")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: Prisma.RestaurantOrderWhereInput = {
      guestHouseId: session.user.guestHouseId,
    }

    if (status && status !== "all") {
      where.status = status
    }

    if (paymentStatus && paymentStatus !== "all") {
      where.paymentStatus = paymentStatus
    }

    if (orderType && orderType !== "all") {
      where.orderType = orderType
    }

    if (startDate && endDate) {
      where.orderDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const orders = await db.restaurantOrder.findMany({
      where,
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { orderDate: "desc" },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Erreur récupération commandes:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle commande restaurant
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
      roomId,
      bookingId,
      tableNumber,
      guestName,
      orderType,
      notes,
      items,
    } = body

    // Validation
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "La commande doit contenir au moins un article" },
        { status: 400 }
      )
    }

    // Vérifier que tous les articles existent et appartiennent à la maison d'hôtes
    const menuItemIds = items.map((item: { menuItemId: string; quantity: number }) => item.menuItemId)
    const menuItems = await db.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        guestHouseId: session.user.guestHouseId,
        isAvailable: true,
      },
    })

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json(
        { error: "Un ou plusieurs articles ne sont pas disponibles" },
        { status: 400 }
      )
    }

    // Créer un map des prix
    const priceMap = new Map(menuItems.map((item) => [item.id, item.price]))

    // Calculer les totaux
    const orderItems = items.map((item: { menuItemId: string; quantity: number; notes?: string }) => {
      const unitPrice = priceMap.get(item.menuItemId) || 0
      const quantity = item.quantity || 1
      return {
        menuItemId: item.menuItemId,
        quantity,
        unitPrice,
        total: unitPrice * quantity,
        notes: item.notes || null,
      }
    })

    const subtotal = orderItems.reduce((sum: number, item: { total: number }) => sum + item.total, 0)
    const taxes = 0 // Taxe à calculer selon les règles locales
    const total = subtotal + taxes

    // Créer la commande avec ses articles
    const order = await db.restaurantOrder.create({
      data: {
        guestHouseId: session.user.guestHouseId,
        roomId: roomId || null,
        bookingId: bookingId || null,
        tableNumber: tableNumber || null,
        guestName: guestName || null,
        orderType: orderType || "room",
        notes: notes || null,
        subtotal,
        taxes,
        total,
        status: "pending",
        paymentStatus: "pending",
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                category: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error("Erreur création commande:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
