import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { getCurrentUser } from "@/lib/session"

// Schéma de validation pour créer une maison d'hôtes
const createGuestHouseSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  slug: z.string()
    .min(2, "L'identifiant doit contenir au moins 2 caractères")
    .regex(/^[a-z0-9-]+$/, "L'identifiant ne peut contenir que des lettres minuscules, chiffres et tirets"),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default("France"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  currency: z.string().default("EUR"),
  timezone: z.string().default("Europe/Paris"),
  // Informations du propriétaire
  ownerId: z.string(),
})

// GET - Lister les maisons d'hôtes (admin uniquement)
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    
    // Un utilisateur normal ne voit que sa propre maison d'hôtes
    if (user.role !== "super_admin") {
      const guestHouse = await db.guestHouse.findUnique({
        where: { id: user.guestHouseId },
        include: {
          settings: true,
          _count: {
            select: {
              users: true,
              rooms: true,
              bookings: true,
              guests: true,
            }
          }
        }
      })
      
      return NextResponse.json({ guestHouses: guestHouse ? [guestHouse] : [] })
    }
    
    // Les super admins voient toutes les maisons d'hôtes
    const guestHouses = await db.guestHouse.findMany({
      include: {
        settings: true,
        _count: {
          select: {
            users: true,
            rooms: true,
            bookings: true,
            guests: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    return NextResponse.json({ guestHouses })
    
  } catch (error) {
    console.error("Erreur lors de la récupération des maisons d'hôtes:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle maison d'hôtes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createGuestHouseSchema.parse(body)
    
    // Vérifier si le slug existe déjà
    const existingSlug = await db.guestHouse.findUnique({
      where: { slug: validatedData.slug }
    })
    
    if (existingSlug) {
      return NextResponse.json(
        { error: "Cet identifiant est déjà utilisé" },
        { status: 400 }
      )
    }
    
    // Vérifier si l'utilisateur existe
    const owner = await db.user.findUnique({
      where: { id: validatedData.ownerId }
    })
    
    if (!owner) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 400 }
      )
    }
    
    // Vérifier si l'utilisateur a déjà une maison d'hôtes
    if (owner.guestHouseId) {
      return NextResponse.json(
        { error: "Cet utilisateur a déjà une maison d'hôtes" },
        { status: 400 }
      )
    }
    
    // Créer la maison d'hôtes avec ses paramètres par défaut
    const guestHouse = await db.guestHouse.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        address: validatedData.address,
        city: validatedData.city,
        postalCode: validatedData.postalCode,
        country: validatedData.country,
        phone: validatedData.phone,
        email: validatedData.email || null,
        website: validatedData.website || null,
        currency: validatedData.currency,
        timezone: validatedData.timezone,
        plan: "trial",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours d'essai
        settings: {
          create: {
            // Les valeurs par défaut sont définies dans le schéma Prisma
          }
        }
      },
      include: {
        settings: true
      }
    })
    
    // Lier l'utilisateur à la maison d'hôtes
    await db.user.update({
      where: { id: validatedData.ownerId },
      data: { 
        guestHouseId: guestHouse.id,
        role: "owner"
      }
    })
    
    // Logger la création
    await db.auditLog.create({
      data: {
        guestHouseId: guestHouse.id,
        action: "create",
        entityType: "guest_house",
        entityId: guestHouse.id,
        userId: validatedData.ownerId,
        description: `Création de la maison d'hôtes "${guestHouse.name}"`,
      }
    })
    
    return NextResponse.json({
      success: true,
      message: "Maison d'hôtes créée avec succès",
      guestHouse
    })
    
  } catch (error) {
    console.error("Erreur lors de la création de la maison d'hôtes:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
