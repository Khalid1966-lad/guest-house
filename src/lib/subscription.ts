/**
 * Subscription system helpers
 * Manages subscription status, grace period, notifications, and plan limits.
 */

export type PlanType = "free" | "premium"
export type SubscriptionStatus = "trial" | "active" | "expired" | "grace_period" | "cancelled"

export interface SubscriptionInfo {
  id: string
  guestHouseId: string
  plan: PlanType
  status: SubscriptionStatus
  startedAt: string
  expiresAt: string | null
  lastPaymentAt: string | null
  lastPaymentRef: string | null
  trialEndsAt: string | null
  gracePeriodDays: number
  /** Computed effective status considering dates */
  effectiveStatus: SubscriptionStatus
  /** Days until expiration (negative if expired) */
  daysUntilExpiry: number | null
  /** Human-readable label for effective status */
  label: string
  /** Color for badge/banner */
  color: "green" | "yellow" | "orange" | "red" | "gray"
  /** Whether the app is fully functional */
  isFullyAccessible: boolean
}

/**
 * Compute the effective subscription status based on current date.
 */
export function computeEffectiveStatus(sub: {
  plan: string
  status: string
  expiresAt: string | null
  trialEndsAt: string | null
  gracePeriodDays: number
}): {
  effectiveStatus: SubscriptionStatus
  daysUntilExpiry: number | null
  label: string
  color: "green" | "yellow" | "orange" | "red" | "gray"
  isFullyAccessible: boolean
} {
  const now = new Date()

  // Free plan is always accessible but limited
  if (sub.plan === "free") {
    return {
      effectiveStatus: "active",
      daysUntilExpiry: null,
      label: "Plan Gratuit",
      color: "gray",
      isFullyAccessible: false,
    }
  }

  // Trial period
  if (sub.status === "trial" && sub.trialEndsAt) {
    const trialEnd = new Date(sub.trialEndsAt)
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft > 7) {
      return {
        effectiveStatus: "trial",
        daysUntilExpiry: daysLeft,
        label: `Essai gratuit — ${daysLeft} jours restants`,
        color: "green",
        isFullyAccessible: true,
      }
    }
    if (daysLeft > 0) {
      return {
        effectiveStatus: "trial",
        daysUntilExpiry: daysLeft,
        label: `Essai expire bientôt — ${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}`,
        color: "yellow",
        isFullyAccessible: true,
      }
    }
    // Trial expired
    return {
      effectiveStatus: "expired",
      daysUntilExpiry: 0,
      label: "Essai expiré",
      color: "red",
      isFullyAccessible: false,
    }
  }

  // Active subscription with expiration date
  if (sub.expiresAt) {
    const expiry = new Date(sub.expiresAt)
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft > 30) {
      return {
        effectiveStatus: "active",
        daysUntilExpiry: daysLeft,
        label: `Premium — expire dans ${daysLeft} jours`,
        color: "green",
        isFullyAccessible: true,
      }
    }
    if (daysLeft > 7) {
      return {
        effectiveStatus: "active",
        daysUntilExpiry: daysLeft,
        label: `Premium — expire dans ${daysLeft} jours`,
        color: "yellow",
        isFullyAccessible: true,
      }
    }
    if (daysLeft > 0) {
      return {
        effectiveStatus: "active",
        daysUntilExpiry: daysLeft,
        label: `Premium — expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""} !`,
        color: "orange",
        isFullyAccessible: true,
      }
    }

    // Expired — check grace period
    const graceEnd = new Date(expiry)
    graceEnd.setDate(graceEnd.getDate() + sub.gracePeriodDays)
    const graceDaysLeft = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (graceDaysLeft > 0) {
      return {
        effectiveStatus: "grace_period",
        daysUntilExpiry: daysLeft,
        label: `Période de grâce — ${graceDaysLeft} jour${graceDaysLeft > 1 ? "s" : ""} restant${graceDaysLeft > 1 ? "s" : ""}`,
        color: "orange",
        isFullyAccessible: true,
      }
    }

    // Fully expired
    return {
      effectiveStatus: "expired",
      daysUntilExpiry: daysLeft,
      label: "Abonnement expiré",
      color: "red",
      isFullyAccessible: false,
    }
  }

  // Active without expiration (lifetime)
  if (sub.status === "active") {
    return {
      effectiveStatus: "active",
      daysUntilExpiry: null,
      label: "Premium — Illimité",
      color: "green",
      isFullyAccessible: true,
    }
  }

  // Cancelled
  return {
    effectiveStatus: "cancelled",
    daysUntilExpiry: null,
    label: "Abonnement annulé",
    color: "red",
    isFullyAccessible: false,
  }
}

/**
 * Build full SubscriptionInfo from raw database record.
 */
export function buildSubscriptionInfo(raw: Record<string, unknown>): SubscriptionInfo {
  const computed = computeEffectiveStatus({
    plan: raw.plan as string,
    status: raw.status as string,
    expiresAt: raw.expiresAt as string | null,
    trialEndsAt: raw.trialEndsAt as string | null,
    gracePeriodDays: (raw.gracePeriodDays as number) || 7,
  })

  return {
    id: raw.id as string,
    guestHouseId: raw.guestHouseId as string,
    plan: (raw.plan as PlanType) || "free",
    status: (raw.status as SubscriptionStatus) || "trial",
    startedAt: raw.startedAt as string,
    expiresAt: raw.expiresAt as string | null,
    lastPaymentAt: raw.lastPaymentAt as string | null,
    lastPaymentRef: raw.lastPaymentRef as string | null,
    trialEndsAt: raw.trialEndsAt as string | null,
    gracePeriodDays: (raw.gracePeriodDays as number) || 7,
    ...computed,
  }
}

/**
 * Plan labels for display.
 */
export const PLAN_LABELS: Record<string, string> = {
  free: "Gratuit",
  premium: "Premium",
}

/**
 * Status labels for display.
 */
export const STATUS_LABELS: Record<string, string> = {
  trial: "Essai",
  active: "Actif",
  expired: "Expiré",
  grace_period: "Période de grâce",
  cancelled: "Annulé",
}

/**
 * Status badge colors for display.
 */
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  trial: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  active: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  expired: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  grace_period: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  cancelled: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-400" },
}
