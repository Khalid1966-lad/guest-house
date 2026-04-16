import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Routes publiques (accessibles sans authentification)
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/onboarding",
  "/politique-de-confidentialite",
  "/conditions-generales",
  "/mentions-legales",
]

// Routes API
const apiRoutes = ["/api/"]

// Routes admin — accessibles uniquement par super_admin
const adminRoutes = ["/app/admin"]

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Routes admin — uniquement pour super_admin
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (!token) {
        const loginUrl = new URL("/login", req.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
      }
      if (token.role !== "super_admin") {
        return NextResponse.redirect(new URL("/app/dashboard", req.url))
      }
      return NextResponse.next()
    }

    // Determine default landing page from JWT
    const defaultMenu = (token?.defaultMenu as string) || "/app/dashboard"

    // Si l'utilisateur est connecté et essaie d'accéder aux pages publiques
    if (token && publicRoutes.includes(pathname)) {
      if (pathname === "/login" || pathname === "/register") {
        if (token.role === "super_admin") {
          return NextResponse.redirect(new URL("/app/admin/guesthouses", req.url))
        }
        if (token.guestHouseId) {
          return NextResponse.redirect(new URL(defaultMenu, req.url))
        }
        return NextResponse.redirect(new URL("/onboarding", req.url))
      }
    }

    // Si l'utilisateur connecté n'a pas de maison d'hôtes et essaie d'accéder à /app
    if (token && pathname.startsWith("/app") && !token.guestHouseId && token.role !== "super_admin") {
      return NextResponse.redirect(new URL("/onboarding", req.url))
    }

    // Redirect /app/dashboard to first allowed menu if dashboard is not authorized
    if (token?.guestHouseId && pathname === "/app/dashboard" && defaultMenu !== "/app/dashboard") {
      return NextResponse.redirect(new URL(defaultMenu, req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/|images/|icons/).*)",
  ],
}
