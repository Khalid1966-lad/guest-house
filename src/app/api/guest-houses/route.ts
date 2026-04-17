import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

// POST - Créer une nouvelle maison d'hôtes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      slug,
      description,
      address,
      city,
      postalCode,
      country,
      phone,
      email,
      website,
      currency,
      timezone,
    } = body

    // Validation des champs requis
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Le nom et l'identifiant sont requis" },
        { status: 400 }
      )
    }

    // Vérifier que le slug est unique
    const existingGuestHouse = await db.guestHouse.findUnique({
      where: { slug },
    })

    if (existingGuestHouse) {
      return NextResponse.json(
        { error: "Cet identifiant est déjà utilisé" },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur n'a pas déjà une maison d'hôtes
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { guestHouseId: true },
    })

    if (user?.guestHouseId) {
      return NextResponse.json(
        { error: "Vous avez déjà une maison d'hôtes" },
        { status: 400 }
      )
    }

    // Créer la maison d'hôtes et associer l'utilisateur dans une transaction
    const guestHouse = await db.$transaction(async (tx) => {
      // 0. Generate unique guesthouse code (GH001, GH002, ...)
      const allGuestHouses = await tx.guestHouse.findMany({
        select: { code: true },
        orderBy: { createdAt: 'asc' },
      })
      const usedCodes = new Set(allGuestHouses.map(gh => gh.code))
      let nextNum = 1
      while (usedCodes.has("GH" + String(nextNum).padStart(3, "0"))) nextNum++
      const ghCode = "GH" + String(nextNum).padStart(3, "0")

      // 1. Créer la maison d'hôtes
      const newGuestHouse = await tx.guestHouse.create({
        data: {
          code: ghCode,
          name,
          slug,
          description: description || null,
          address: address || null,
          city: city || null,
          postalCode: postalCode || null,
          country: country || "France",
          phone: phone || null,
          email: email || null,
          website: website || null,
          currency: currency || "EUR",
          timezone: timezone || "Europe/Paris",
        },
      })

      // 2. Mettre à jour l'utilisateur avec le guestHouseId et le rôle owner
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          guestHouseId: newGuestHouse.id,
          role: "owner",
        },
      })

      // 3. Créer les paramètres par défaut de la maison d'hôtes
      await tx.guestHouseSetting.create({
        data: {
          guestHouseId: newGuestHouse.id,
        },
      })

      // 4. Créer les équipements par défaut
      const defaultAmenities = [
        { name: "WiFi", icon: "Wifi", sortOrder: 1 },
        { name: "TV", icon: "Tv", sortOrder: 2 },
        { name: "Climatisation", icon: "Wind", sortOrder: 3 },
        { name: "Minibar", icon: "Coffee", sortOrder: 4 },
        { name: "Coffre-fort", icon: "Shield", sortOrder: 5 },
        { name: "Baignoire", icon: "Bath", sortOrder: 6 },
        { name: "Balcon", icon: "DoorOpen", sortOrder: 7 },
        { name: "Vue mer", icon: "Waves", sortOrder: 8 },
        { name: "Téléphone", icon: "Phone", sortOrder: 9 },
        { name: "Bureau", icon: "LampDesk", sortOrder: 10 },
        { name: "Sèche-cheveux", icon: "Wind", sortOrder: 11 },
        { name: "Chauffage", icon: "Flame", sortOrder: 12 },
      ]

      await tx.amenity.createMany({
        data: defaultAmenities.map((amenity) => ({
          guestHouseId: newGuestHouse.id,
          ...amenity,
        })),
      })

      // 5. Créer l'abonnement d'essai (14 jours premium)
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 14)
      await tx.subscription.create({
        data: {
          guestHouseId: newGuestHouse.id,
          plan: "premium",
          status: "trial",
          trialEndsAt: trialEnd,
          startedAt: new Date(),
        },
      })

      return newGuestHouse
    })

    return NextResponse.json({
      success: true,
      guestHouse: {
        id: guestHouse.id,
        code: guestHouse.code,
        name: guestHouse.name,
        slug: guestHouse.slug,
      },
    })
  } catch (error) {
    console.error("Erreur création maison d'hôtes:", error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Cet identifiant est déjà utilisé" },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// GET - Récupérer les informations de la maison d'hôtes de l'utilisateur
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        guestHouse: true,
      },
    })

    if (!user?.guestHouse) {
      return NextResponse.json(
        { error: "Aucune maison d'hôtes trouvée" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      guestHouse: user.guestHouse,
    })
  } catch (error) {
    console.error("Erreur récupération maison d'hôtes:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
