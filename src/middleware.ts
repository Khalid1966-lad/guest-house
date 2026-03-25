import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Routes publiques (accessibles sans authentification)
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/onboarding",
]

// Routes API
const apiRoutes = ["/api/"]

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Si l'utilisateur est connecté et essaie d'accéder aux pages publiques
    if (token && publicRoutes.includes(pathname)) {
      // Rediriger vers /app sauf si c'est la landing page (/)
      if (pathname === "/login" || pathname === "/register") {
        // Si l'utilisateur a une maison d'hôtes, le rediriger vers /app
        if (token.guestHouseId) {
          return NextResponse.redirect(new URL("/app/dashboard", req.url))
        }
        // Sinon, le rediriger vers /onboarding
        return NextResponse.redirect(new URL("/onboarding", req.url))
      }
    }

    // Si l'utilisateur connecté n'a pas de maison d'hôtes et essaie d'accéder à /app
    if (token && pathname.startsWith("/app") && !token.guestHouseId) {
      return NextResponse.redirect(new URL("/onboarding", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Le middleware s'exécute seulement si l'utilisateur est authentifié
      // ou si la route n'est pas protégée
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Toujours autoriser les routes publiques et API
        if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))) {
          return true
        }

        if (apiRoutes.some(route => pathname.startsWith(route))) {
          return true
        }

        // Pour les routes protégées, nécessiter un token
        return !!token
      }
    },
  }
)

// Configuration des routes sur lesquelles le middleware s'applique
export const config = {
  matcher: [
    /*
     * Appliquer le middleware sur toutes les routes SAUF:
     * - Les fichiers statiques (_next/static, favicon, images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|public/|images/|icons/).*)",
  ],
}
