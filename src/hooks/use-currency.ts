"use client"

import { useSession } from "next-auth/react"

// Mapping devise → symbole personnalisé
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  MAD: "DH",
  XOF: "FCFA",
}

/**
 * Hook pour accéder à la devise configurée dans les paramètres de la maison d'hôtes.
 * Retourne la devise (code ISO), le symbole, et une fonction de formatage.
 */
export function useCurrency() {
  const { data: session, update: updateSession } = useSession()
  const currency = session?.user?.guestHouseCurrency || "EUR"

  const symbol = CURRENCY_SYMBOLS[currency] || currency

  const formatAmount = (amount: number): string => {
    // Pour MAD et XOF, on utilise le symbole personnalisé au lieu de Intl
    if (currency === "MAD") {
      return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`
    }
    if (currency === "XOF") {
      return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`
    }
    // Pour EUR, USD, GBP, CHF : Intl.NumberFormat gère bien le symbole
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const formatAmountCompact = (amount: number): string => {
    // Version compacte sans décimales (pour les cartes KPI)
    if (currency === "MAD") {
      return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} DH`
    }
    if (currency === "XOF") {
      return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA`
    }
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return {
    currency,
    symbol,
    formatAmount,
    formatAmountCompact,
    updateSession,
  }
}
