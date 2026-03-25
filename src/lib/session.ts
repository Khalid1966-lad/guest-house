import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * Récupère la session utilisateur côté serveur
 * Utilisé dans les composants serveur et les API routes
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

/**
 * Vérifie si l'utilisateur est authentifié
 * Lance une erreur si non authentifié
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error("Non autorisé - Authentification requise")
  }
  
  return user
}

/**
 * Vérifie si l'utilisateur a le rôle requis
 */
export async function requireRole(roles: string[]) {
  const user = await requireAuth()
  
  if (!roles.includes(user.role)) {
    throw new Error("Non autorisé - Permissions insuffisantes")
  }
  
  return user
}

/**
 * Vérifie si l'utilisateur appartient à une maison d'hôtes
 * Utile pour le multi-tenancy
 */
export async function requireGuestHouse() {
  const user = await requireAuth()
  
  if (!user.guestHouseId) {
    throw new Error("Non autorisé - Aucune maison d'hôtes associée")
  }
  
  return user
}
