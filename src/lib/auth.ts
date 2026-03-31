import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

// ============================================
// SUPER ADMIN — Identifiants hardcodés
// ============================================
const SUPER_ADMIN_EMAIL = "contact@jazelwebagency.com"
const SUPER_ADMIN_PASSWORD = "wysiwyg@guesthouse2026"
const SUPER_ADMIN_ID = "super-admin-hardcoded"
const SUPER_ADMIN_NAME = "Administrateur Système"

// Extension des types NextAuth pour inclure nos champs personnalisés
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      role: string
      guestHouseId: string | null
      guestHouseSlug: string | null
      guestHouseName: string | null
    }
  }
  interface User {
    id: string
    role: string
    guestHouseId: string | null
    guestHouseSlug?: string | null
    guestHouseName?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    guestHouseId: string | null
    guestHouseSlug?: string | null
    guestHouseName?: string | null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis")
        }

        // ============================================
        // Vérification Super Admin (hardcodé)
        // ============================================
        if (
          credentials.email === SUPER_ADMIN_EMAIL &&
          credentials.password === SUPER_ADMIN_PASSWORD
        ) {
          return {
            id: SUPER_ADMIN_ID,
            email: SUPER_ADMIN_EMAIL,
            name: SUPER_ADMIN_NAME,
            role: "super_admin",
            guestHouseId: null,
            guestHouseSlug: null,
            guestHouseName: null,
          }
        }

        // ============================================
        // Authentification normale via base de données
        // ============================================
        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { guestHouse: true }
        })

        if (!user || !user.password) {
          throw new Error("Identifiants invalides")
        }

        // Vérifier si l'utilisateur est actif
        if (!user.isActive) {
          throw new Error("Votre compte a été désactivé")
        }

        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValidPassword) {
          throw new Error("Identifiants invalides")
        }

        // Si l'utilisateur est un owner d'une maison d'hôtes bloquée
        if (user.guestHouseId && user.guestHouse) {
          if (user.guestHouse.status === "blocked") {
            throw new Error("Votre maison d'hôtes a été bloquée. Contactez le support.")
          }
        }

        // Vérifier si l'utilisateur a une maison d'hôtes
        if (!user.guestHouseId || !user.guestHouse) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            guestHouseId: null,
            guestHouseSlug: null,
            guestHouseName: null,
          }
        }

        // Mettre à jour la date de dernière connexion
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          guestHouseId: user.guestHouseId,
          guestHouseSlug: user.guestHouse.slug,
          guestHouseName: user.guestHouse.name,
        }
      }
    })
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
    newUser: "/onboarding",
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.guestHouseId = user.guestHouseId ?? null
        token.guestHouseSlug = user.guestHouseSlug ?? null
        token.guestHouseName = user.guestHouseName ?? null
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.guestHouseId = token.guestHouseId ?? null
        session.user.guestHouseSlug = token.guestHouseSlug ?? null
        session.user.guestHouseName = token.guestHouseName ?? null
      }
      return session
    }
  },

  debug: process.env.NODE_ENV === "development",
}
