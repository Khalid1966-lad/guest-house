import Link from "next/link"
import { Hotel, Mail, Phone, MapPin, Globe } from "lucide-react"
import { APP_VERSION, COPYRIGHT_YEAR } from "@/lib/version"

// ============================================
// FOOTER LANDING PAGE (public)
// Footer complet pour la page d'accueil
// ============================================
export function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      {/* Section principale */}
      <div className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-10">
            {/* Colonne 1 - Logo et description */}
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

            {/* Colonne 2 - Produit */}
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

            {/* Colonne 3 - Contact */}
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

            {/* Colonne 4 - Légal */}
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

      {/* Barre du bas */}
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
// Footer compact pour les pages d'authentification
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
// Footer minimal pour l'espace application
// ============================================
export function AppFooter() {
  return (
    <footer className="py-3 px-4 lg:px-6 border-t bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-gray-400">
        <span className="font-mono">{APP_VERSION}</span>
        <span className="hidden sm:inline">&bull;</span>
        <span>PMS Guest House &mdash; Développé par <a href="https://jazelwebagency.com" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-400 transition-colors">Jazel Web Agency</a></span>
        <span className="hidden sm:inline">&bull;</span>
        <span>&copy; {COPYRIGHT_YEAR}</span>
      </div>
    </footer>
  )
}
