import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Get guest house settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const guestHouse = await db.guestHouse.findUnique({
      where: { id: session.user.guestHouseId },
      select: {
        id: true,
        code: true,
        name: true,
        slug: true,
        description: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        logo: true,
        coverImage: true,
        ice: true,
        taxId: true,
        cnss: true,
        currency: true,
        timezone: true,
        taxRate: true,
        plan: true,
        createdAt: true,
        settings: true,
      },
    })

    if (!guestHouse) {
      return NextResponse.json(
        { error: "Maison d'hôtes non trouvée" },
        { status: 404 }
      )
    }

    return NextResponse.json({ guestHouse })
  } catch (error) {
    console.error("Error fetching guest house:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des paramètres" },
      { status: 500 }
    )
  }
}

// PUT - Update guest house settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Only owner and admin can update settings
    if (!["owner", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      )
    }

    const data = await request.json()

    // Update guest house
    const guestHouse = await db.guestHouse.update({
      where: { id: session.user.guestHouseId },
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone,
        email: data.email,
        website: data.website,
        ice: data.ice,
        taxId: data.taxId,
        cnss: data.cnss,
        currency: data.currency,
        timezone: data.timezone,
        taxRate: parseFloat(data.taxRate) || 0,
      },
    })

    // Update settings if provided
    if (data.settings) {
      await db.guestHouseSetting.upsert({
        where: { guestHouseId: session.user.guestHouseId },
        update: {
          checkInTime: data.settings.checkInTime,
          checkOutTime: data.settings.checkOutTime,
          minBookingNotice: data.settings.minBookingNotice,
          maxBookingAdvance: data.settings.maxBookingAdvance,
          cancellationPolicy: data.settings.cancellationPolicy,
          emailNotifications: data.settings.emailNotifications,
          smsNotifications: data.settings.smsNotifications,
          restaurantEnabled: data.settings.restaurantEnabled,
          restaurantOpenTime: data.settings.restaurantOpenTime,
          restaurantCloseTime: data.settings.restaurantCloseTime,
        },
        create: {
          guestHouseId: session.user.guestHouseId,
          checkInTime: data.settings.checkInTime || "15:00",
          checkOutTime: data.settings.checkOutTime || "11:00",
          minBookingNotice: data.settings.minBookingNotice || 1,
          maxBookingAdvance: data.settings.maxBookingAdvance || 365,
          cancellationPolicy: data.settings.cancellationPolicy,
          emailNotifications: data.settings.emailNotifications ?? true,
          smsNotifications: data.settings.smsNotifications ?? false,
          restaurantEnabled: data.settings.restaurantEnabled ?? true,
          restaurantOpenTime: data.settings.restaurantOpenTime || "07:00",
          restaurantCloseTime: data.settings.restaurantCloseTime || "22:00",
        },
      })
    }

    return NextResponse.json({ guestHouse })
  } catch (error) {
    console.error("Error updating guest house:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des paramètres" },
      { status: 500 }
    )
  }
}
