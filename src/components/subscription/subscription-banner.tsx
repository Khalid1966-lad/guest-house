"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { AlertTriangle, Clock, Shield, X, Info } from "lucide-react"
import type { SubscriptionInfo } from "@/lib/subscription"

export function SubscriptionBanner() {
  const { data: session, status: sessionStatus } = useSession()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const fetchedRef = useRef(false)

  const isSuperAdmin = session?.user?.role === "super_admin"
  const isAuthenticated = sessionStatus === "authenticated"
  const canShow = isAuthenticated && !isSuperAdmin && !dismissed && subscription

  useEffect(() => {
    if (!isAuthenticated || isSuperAdmin || fetchedRef.current || dismissed) return

    fetchedRef.current = true
    let cancelled = false

    fetch("/api/subscription")
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.subscription) {
          setSubscription(data.subscription)
        }
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [isAuthenticated, isSuperAdmin, dismissed])

  if (!canShow) return null

  // Don't show banner for fully active subscriptions with >30 days
  if (subscription.color === "green" && subscription.effectiveStatus === "active") return null
  // Don't show for free plans (they see the footer info)
  if (subscription.plan === "free") return null

  const colorConfig = {
    green: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-800 dark:text-emerald-200",
      icon: <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    },
    yellow: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-800 dark:text-amber-200",
      icon: <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
    },
    orange: {
      bg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-200 dark:border-orange-800",
      text: "text-orange-800 dark:text-orange-200",
      icon: <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />,
    },
    red: {
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-800 dark:text-red-200",
      icon: <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />,
    },
    gray: {
      bg: "bg-gray-50 dark:bg-gray-900/50",
      border: "border-gray-200 dark:border-gray-800",
      text: "text-gray-600 dark:text-gray-400",
      icon: <Clock className="w-4 h-4 text-gray-500" />,
    },
  }

  const config = colorConfig[subscription.color] || colorConfig.gray

  return (
    <div className={`${config.bg} ${config.border} border-b`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          {config.icon}
          <span className={config.text}>{subscription.label}</span>
          {subscription.expiresAt && subscription.color !== "gray" && (
            <span className={`text-xs ${config.text} opacity-70`}>
              (exp. le {new Date(subscription.expiresAt).toLocaleDateString("fr-FR")})
            </span>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
    </div>
  )
}
