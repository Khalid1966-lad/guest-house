import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

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

        // Rechercher l'utilisateur avec sa maison d'hôtes
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

        // Vérifier si l'utilisateur a une maison d'hôtes
        if (!user.guestHouseId || !user.guestHouse) {
          // Utilisateur sans maison d'hôtes - rediriger vers onboarding
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

        // Vérifier si la maison d'hôtes est active
        if (!user.guestHouse.isActive) {
          throw new Error("Cette maison d'hôtes n'est plus active")
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
      // À la connexion initiale, ajouter les infos utilisateur au token
      if (user) {
        token.id = user.id
        token.role = user.role
        token.guestHouseId = user.guestHouseId ?? null
        token.guestHouseSlug = user.guestHouseSlug ?? null
        token.guestHouseName = user.guestHouseName ?? null
      }

      // Permettre la mise à jour de la session
      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }

      return token
    },

    async session({ session, token }) {
      // Transférer les infos du token vers la session
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
