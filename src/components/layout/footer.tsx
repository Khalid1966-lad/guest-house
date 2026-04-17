"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Hotel, Mail, Phone, MapPin, Globe, Crown } from "lucide-react"
import { APP_VERSION, COPYRIGHT_YEAR } from "@/lib/version"
import { PLAN_LABELS, STATUS_LABELS } from "@/lib/subscription"

// ============================================
// FOOTER LANDING PAGE (public)
// ============================================
export function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
                  <Hotel className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">PMS Guest House</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                La solution de gestion complète conçue pour simplifier le quotidien des propriétaires de maisons d&apos;hôtes et d&apos;hébergements touristiques.
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>Propulsé par</span>
                <span className="font-medium text-sky-400">Jazel Web Agency</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Produit</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
                </li>
                <li>
                  <Link href="/register" className="hover:text-white transition-colors">
                    Essai gratuit
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Accès client
                  </Link>
                </li>
              </ul>
            </div>

            <div id="contact">
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <span className="text-sky-400 font-medium">Jazel Web Agency</span>
                  <p className="text-xs text-gray-500 mt-1">Développeur de l&apos;application</p>
                </li>
                <li>
                  <a href="mailto:contact@jazelwebagency.com" className="flex items-center gap-2 hover:text-white transition-colors">
                    <Mail className="w-4 h-4" />
                    contact@jazelwebagency.com
                  </a>
                </li>
                <li>
                  <a href="tel:+212662425890" className="flex items-center gap-2 hover:text-white transition-colors">
                    <Phone className="w-4 h-4" />
                    +212 6 62 42 58 90
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Marrakech, Maroc</span>
                </li>
                <li>
                  <a href="https://jazelwebagency.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                    <Globe className="w-4 h-4" />
                    jazelwebagency.com
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Légal</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/politique-de-confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link>
                </li>
                <li>
                  <Link href="/conditions-generales" className="hover:text-white transition-colors">Conditions générales</Link>
                </li>
                <li>
                  <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
            <p>
              &copy; {COPYRIGHT_YEAR} PMS Guest House. Tous droits réservés.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{APP_VERSION}</span>
              <span className="inline-block w-1 h-1 rounded-full bg-gray-600" />
              <span>Développé par</span>
              <a href="https://jazelwebagency.com" target="_blank" rel="noopener noreferrer" className="font-medium text-sky-400 hover:text-sky-300 transition-colors">
                Jazel Web Agency
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ============================================
// FOOTER AUTH (login, register)
// ============================================
export function AuthFooter() {
  return (
    <div className="text-center mt-8 space-y-2">
      <p className="text-xs text-gray-400">
        &copy; {COPYRIGHT_YEAR} PMS Guest House &mdash; Tous droits réservés
      </p>
      <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
        <a href="mailto:contact@jazelwebagency.com" className="hover:text-gray-600 transition-colors">Contact</a>
        <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
        <Link href="/conditions-generales" className="hover:text-gray-600 transition-colors">CGU</Link>
        <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
        <Link href="/politique-de-confidentialite" className="hover:text-gray-600 transition-colors">Confidentialité</Link>
      </div>
      <p className="text-[10px] text-gray-300 mt-1">
        {APP_VERSION} &bull; Développé par <a href="https://jazelwebagency.com" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-sky-400 transition-colors">Jazel Web Agency</a>
      </p>
    </div>
  )
}

// ============================================
// FOOTER APP DASHBOARD (authenticated)
// Shows subscription expiration for owners
// ============================================
export function AppFooter() {
  const { data: session } = useSession()
  const [subInfo, setSubInfo] = useState<{
    plan: string
    effectiveStatus: string
    expiresAt: string | null
    label: string
    color: string
    inscriptionDate: string | null
    lastPaymentAt: string | null
  } | null>(null)

  useEffect(() => {
    if (session?.user?.role === "super_admin" || !session?.user?.guestHouseId) return

    fetch("/api/subscription")
      .then(res => res.json())
      .then(data => {
        if (data.subscription) {
          setSubInfo(data.subscription)
        }
      })
      .catch(() => {})
  }, [session])

  const isSuperAdmin = session?.user?.role === "super_admin"

  // Subscription status colors
  const statusColors: Record<string, string> = {
    green: "text-emerald-600 dark:text-emerald-400",
    yellow: "text-amber-600 dark:text-amber-400",
    orange: "text-orange-600 dark:text-orange-400",
    red: "text-red-600 dark:text-red-400",
    gray: "text-gray-500 dark:text-gray-400",
  }

  return (
    <footer className="py-3 px-4 lg:px-6 border-t bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="flex flex-col gap-1">
        {/* Subscription info bar — only for regular users with subscription */}
        {!isSuperAdmin && subInfo && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1 pb-1 border-b dark:border-gray-800">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3" />
                {PLAN_LABELS[subInfo.plan] || subInfo.plan}
              </span>
              {subInfo.inscriptionDate && (
                <span>
                  Inscrit le {new Date(subInfo.inscriptionDate).toLocaleDateString("fr-FR")}
                </span>
              )}
              {subInfo.lastPaymentAt && (
                <span>
                  Dernier paiement: {new Date(subInfo.lastPaymentAt).toLocaleDateString("fr-FR")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {subInfo.expiresAt && (
                <span className={statusColors[subInfo.color] || statusColors.gray}>
                  Expire le {new Date(subInfo.expiresAt).toLocaleDateString("fr-FR")}
                </span>
              )}
              <span className={statusColors[subInfo.color] || statusColors.gray}>
                {subInfo.label}
              </span>
            </div>
          </div>
        )}

        {/* Main footer bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-gray-400">
          <span className="font-mono">{APP_VERSION}</span>
          <span className="hidden sm:inline">&bull;</span>
          <span>PMS Guest House &mdash; Développé par <a href="https://jazelwebagency.com" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-400 transition-colors">Jazel Web Agency</a></span>
          <span className="hidden sm:inline">&bull;</span>
          <span>&copy; {COPYRIGHT_YEAR}</span>
        </div>
      </div>
    </footer>
  )
}
