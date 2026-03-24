import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Schéma de validation pour l'inscription
const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Valider les données
    const validatedData = registerSchema.parse(body)
    
    // Vérifier si l'email existe déjà
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 400 }
      )
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    // Créer un utilisateur temporaire sans maison d'hôtes
    // L'utilisateur sera lié à une maison d'hôtes lors de l'onboarding
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        name: `${validatedData.firstName} ${validatedData.lastName}`,
        phone: validatedData.phone,
        role: "owner",
        isActive: true,
        // guestHouseId est requis - on crée une maison d'hôtes temporaire
        // ou on utilise un système de pré-inscription
      }
    })
    
    // Pour l'instant, on retourne l'utilisateur créé
    // L'onboarding devra créer la maison d'hôtes et lier l'utilisateur
    
    return NextResponse.json({
      success: true,
      message: "Compte créé avec succès",
      userId: user.id,
    })
    
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error)
    
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
