"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface UseAppSessionOptions {
  requireGuestHouse?: boolean
  redirectTo?: string
}

export function useAppSession(options: UseAppSessionOptions = {}) {
  const { requireGuestHouse = true, redirectTo = "/onboarding" } = options
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Si la session est en cours de chargement, attendre
    if (status === "loading") {
      return
    }

    // Si l'utilisateur n'est pas authentifié, rediriger vers login
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    // Si l'utilisateur est authentifié mais sans maison d'hôtes
    if (status === "authenticated" && requireGuestHouse && !session?.user?.guestHouseId) {
      router.push(redirectTo)
      return
    }

    // Tout est OK
    setIsReady(true)
  }, [status, session, requireGuestHouse, redirectTo, router])

  return {
    session,
    status,
    isReady,
    guestHouseId: session?.user?.guestHouseId,
    user: session?.user,
  }
}
