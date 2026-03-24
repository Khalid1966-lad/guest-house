import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Routes publiques (accessibles sans authentification)
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/api/auth/register",
  "/api/auth/signin",
  "/api/auth/callback",
]

// Routes accessibles uniquement aux utilisateurs sans maison d'hôtes
const onboardingRoutes = ["/onboarding"]

// Routes protégées nécessitant une maison d'hôtes
const protectedRoutes = ["/app"]

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Permettre les routes publiques
    if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))) {
      return NextResponse.next()
    }

    // Si l'utilisateur n'est pas authentifié, rediriger vers login
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Vérifier si l'utilisateur a une maison d'hôtes
    const hasGuestHouse = !!token.guestHouseId

    // Si l'utilisateur n'a pas de maison d'hôtes et essaie d'accéder à une route protégée
    if (!hasGuestHouse && protectedRoutes.some(route => pathname.startsWith(route))) {
      const onboardingUrl = new URL("/onboarding", req.url)
      return NextResponse.redirect(onboardingUrl)
    }

    // Si l'utilisateur a une maison d'hôtes et essaie d'accéder à l'onboarding
    if (hasGuestHouse && onboardingRoutes.some(route => pathname.startsWith(route))) {
      const dashboardUrl = new URL("/app/dashboard", req.url)
      return NextResponse.redirect(dashboardUrl)
    }

    // Si l'utilisateur est authentifié et essaie d'accéder à login/register
    if (token && (pathname === "/login" || pathname === "/register")) {
      if (hasGuestHouse) {
        const dashboardUrl = new URL("/app/dashboard", req.url)
        return NextResponse.redirect(dashboardUrl)
      } else {
        const onboardingUrl = new URL("/onboarding", req.url)
        return NextResponse.redirect(onboardingUrl)
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Autoriser le middleware à s'exécuter pour toutes les routes
      authorized: () => true
    },
  }
)

// Configuration des routes sur lesquelles le middleware s'applique
export const config = {
  matcher: [
    /*
     * Appliquer le middleware sur toutes les routes SAUF:
     * - Les fichiers statiques (_next/static, favicon, images, etc.)
     * - Les fichiers publics
     */
    "/((?!_next/static|_next/image|favicon.ico|public/|images/|icons/).*)",
  ],
}
