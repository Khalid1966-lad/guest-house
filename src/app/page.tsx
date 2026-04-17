"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  CalendarDays,
  Users,
  CreditCard,
  BarChart3,
  Smartphone,
  Shield,
  Clock,
  CheckCircle2,
  Hotel,
  ArrowRight,
  Sparkles,
  BedDouble,
  ClipboardCheck,
  UtensilsCrossed,
  Receipt,
  TrendingUp,
  UserCog,
  Bell,
  Moon,
  Globe,
  Building2,
  Star,
  ChevronRight,
  Zap,
  Heart,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Menu,
} from "lucide-react"
import { LandingFooter } from "@/components/layout/footer"

/* ─── colour helpers ─── */
const brand = "text-sky-600"
const brandBg = "bg-sky-600"
const brandBgLight = "bg-sky-50"
const brandBgHover = "hover:bg-sky-700"

const navLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Comment ça marche", href: "#how-it-works" },
  { label: "Témoignages", href: "#testimonials" },
  { label: "Devis", href: "#quote" },
  { label: "FAQ", href: "#faq" },
]

/* ───────────────────────────────────────────
   DATA
   ─────────────────────────────────────────── */

const features = [
  {
    icon: BarChart3,
    title: "Tableau de bord intelligent",
    description:
      "Visualisez en un coup d'œil : taux d'occupation, arrivées/départ du jour, chiffre d'affaires, et performances de chaque chambre.",
  },
  {
    icon: BedDouble,
    title: "Gestion des chambres",
    description:
      "Créez vos chambres en 2 clics : type, capacité, prix, équipements, photos. Gérez les tarifs de saison automatiquement.",
  },
  {
    icon: CalendarDays,
    title: "Réservations simplifiées",
    description:
      "Calendrier visuel, calcul automatique des prix, détection des conflits, suivi du statut de A à Z.",
  },
  {
    icon: Users,
    title: "Fiches clients complètes",
    description:
      "Conservez les coordonnées, les pièces d'identité, l'historique des séjours et les dépenses totales de chaque client.",
  },
  {
    icon: ClipboardCheck,
    title: "Ménage intelligent",
    description:
      "Checklists 10 points, attribution automatique aux agents par zone ou par tour, suivi en temps réel du nettoyage.",
  },
  {
    icon: CreditCard,
    title: "Facturation professionnelle",
    description:
      "Factures numérotées automatiquement, TVA, multi-paiement (espèces, carte, virement), impression prête.",
  },
  {
    icon: UtensilsCrossed,
    title: "Restaurant & room service",
    description:
      "Gérez votre menu (photos, allergènes), prenez les commandes : en chambre, sur place ou à emporter.",
  },
  {
    icon: Receipt,
    title: "Suivi des dépenses",
    description:
      "Catégorisez (fournitures, salaires, entretien...), planifiez les dépenses récurrentes, analysez par période.",
  },
  {
    icon: TrendingUp,
    title: "Statistiques avancées",
    description:
      "Revenus vs dépenses, marges bénéficiaires, sources de réservation, top chambres — tout en graphiques clairs.",
  },
  {
    icon: UserCog,
    title: "Gestion d'équipe",
    description:
      "7 rôles prédéfinis (propriétaire, manager, réceptionniste, gouvernant(e), femme de ménage) avec permissions précises.",
  },
  {
    icon: Bell,
    title: "Notifications en temps réel",
    description:
      "Soyez alerté pour chaque nouvelle réservation, arrivée, départ ou tâche ménage — ne manquez rien.",
  },
  {
    icon: Globe,
    title: "Multi-devises",
    description:
      "EUR, USD, GBP, CHF, MAD, XOF — travaillez dans la devise de votre choix sans conversion manuelle.",
  },
]

const steps = [
  {
    number: "01",
    title: "Créez votre compte",
    description:
      "Inscription gratuite en 30 secondes. Aucune carte bancaire requise.",
    icon: Sparkles,
  },
  {
    number: "02",
    title: "Configurez votre établissement",
    description:
      "Ajoutez vos chambres, vos tarifs et vos informations en suivant notre guide pas à pas.",
    icon: Building2,
  },
  {
    number: "03",
    title: "Gérez tout en un seul endroit",
    description:
      "Réservations, clients, facturation, ménage, restaurant — tout est centralisé.",
    icon: Zap,
  },
]

const testimonials = [
  {
    name: "Fatima Zahra",
    role: "Propriétaire d'un riad à Marrakech",
    text: "PMS Guest House a transformé la gestion de mon riad. Fini les tableurs Excel — tout est automatisé et je gagne 2 heures par jour.",
    rating: 5,
  },
  {
    name: "Philippe M.",
    role: "Gérant de 3 maisons d'hôtes en Provence",
    text: "L'attribution automatique du ménage et les checklists sont un game changer. Mon équipe est plus efficace et les chambres sont toujours prêtes à temps.",
    rating: 5,
  },
  {
    name: "Amina B.",
    role: "Réceptionniste dans un boutique-hôtel à Fès",
    text: "Très simple à utiliser même sans formation technique. Les factures se génèrent toutes seules et les clients adorent le professionnalisme.",
    rating: 5,
  },
]

const faqs = [
  {
    question: "Est-ce que je peux essayer gratuitement ?",
    answer:
      "Oui ! Vous disposez de 14 jours d'essai gratuit avec accès à toutes les fonctionnalités Premium, sans avoir besoin de saisir vos informations de paiement.",
  },
  {
    question: "Combien de chambres puis-je gérer ?",
    answer:
      "Avec l'offre gratuite, vous pouvez gérer jusqu'à 5 chambres. L'offre Premium vous offre un nombre illimité de chambres et de maisons d'hôtes.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Absolument. Vos données sont chiffrées, sauvegardées automatiquement chaque jour, et hébergées sur des serveurs sécurisés en Europe. Vous pouvez aussi exporter vos données à tout moment.",
  },
  {
    question: "Puis-je gérer plusieurs établissements ?",
    answer:
      "Oui, l'offre Premium vous permet de gérer plusieurs maisons d'hôtes ou riads depuis un seul compte. Chaque établissement a ses propres données et paramètres.",
  },
  {
    question: "Comment fonctionne le ménage automatique ?",
    answer:
      "Lorsqu'un client effectue son départ (check-out), une tâche de nettoyage est créée et attribuée automatiquement à l'agent de ménage disponible selon les zones et plannings configurés.",
  },
  {
    question: "Puis-je utiliser l'application sur mon téléphone ?",
    answer:
      "Oui, PMS Guest House est entièrement responsive. Vous pouvez accéder à toutes les fonctionnalités depuis votre smartphone, tablette ou ordinateur via le navigateur.",
  },
  {
    question: "Quelles devises sont acceptées ?",
    answer:
      "L'application supporte l'Euro (EUR), le Dollar (USD), la Livre Sterling (GBP), le Franc Suisse (CHF), le Dirham Marocain (MAD) et le Franc CFA (XOF).",
  },
  {
    question: "Comment contacter le support ?",
    answer:
      "Vous pouvez nous joindre par email à contact@jazelwebagency.com ou par téléphone au +212 6 62 42 58 90. Le guide d'utilisation intégré est aussi disponible directement dans l'application.",
  },
]

/* ───────────────────────────────────────────
   COMPONENT
   ─────────────────────────────────────────── */

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="min-h-screen bg-white">
      {/* ─── HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center shadow-sm">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              PMS Guest House
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Se connecter
              </Button>
            </Link>
            <Link href="/register" className="hidden sm:block">
              <Button className={`${brandBg} ${brandBgHover}`} size="sm">
                Essai gratuit
              </Button>
            </Link>

            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden w-10 h-10"
                  aria-label="Menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex items-center gap-2.5 px-5 h-16 border-b">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
                    <Hotel className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold">PMS Guest House</span>
                </div>
                <nav className="flex flex-col px-3 py-4 gap-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={closeMobile}
                      className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                  <div className="border-t my-3" />
                  <Link href="/login" onClick={closeMobile}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-3 font-medium"
                    >
                      Se connecter
                    </Button>
                  </Link>
                  <Link href="/register" onClick={closeMobile}>
                    <Button
                      className={`w-full ${brandBg} ${brandBgHover} font-semibold mt-1`}
                    >
                      Essai gratuit
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="pt-28 pb-20 md:pt-36 md:pb-28 px-4 relative overflow-hidden">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-sky-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-amber-100/50 blur-3xl" />

        <div className="container mx-auto text-center relative">
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-1.5 text-sm font-medium bg-sky-50 text-sky-700 hover:bg-sky-50 border-sky-200"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            14 jours d&apos;essai gratuit — sans carte bancaire
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
            Gérez votre maison d&apos;hôtes
            <br />
            <span className={brand}>en toute simplicité</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Réservations, clients, facturation, ménage, restaurant, statistiques
            — tout ce dont vous avez besoin dans{" "}
            <strong className="text-gray-700">un seul outil</strong>, conçu
            pour les propriétaires comme vous.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className={`${brandBg} ${brandBgHover} h-12 px-8 text-base font-semibold shadow-lg shadow-sky-200`}
              >
                Commencer gratuitement
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                Découvrir les fonctionnalités
              </Button>
            </Link>
          </div>

          {/* trust bar */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Données sécurisées
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Sans engagement
            </span>
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> 100 % responsive
            </span>
            <span className="flex items-center gap-1.5">
              <Moon className="w-4 h-4" /> Mode sombre
            </span>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 md:py-28 px-4 bg-gray-50/70">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <Badge
              variant="secondary"
              className="mb-4 bg-sky-50 text-sky-700 border-sky-200"
            >
              Fonctionnalités
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Tout ce dont vous avez besoin, et plus encore
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Une suite complète d&apos;outils pensés pour simplifier votre
              quotidien — du check-in au check-out, et même au-delà.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card
                key={i}
                className="group border-gray-200 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-50 transition-all duration-300 bg-white"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-11 h-11 rounded-xl ${brandBgLight} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <f.icon className={`w-5 h-5 ${brand}`} />
                  </div>
                  <h3 className="font-semibold text-base mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 md:py-28 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge
              variant="secondary"
              className="mb-4 bg-sky-50 text-sky-700 border-sky-200"
            >
              Comment ça marche
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Opérationnel en 3 étapes
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">
              Pas besoin de compétences techniques. Suivez le guide et
              commencez à gérer votre établissement dès aujourd&apos;hui.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="text-center group">
                <div className="relative mx-auto mb-5 w-16 h-16 rounded-2xl bg-sky-600 flex items-center justify-center shadow-lg shadow-sky-200 group-hover:scale-110 transition-transform">
                  <s.icon className="w-7 h-7 text-white" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border-2 border-sky-600 flex items-center justify-center text-xs font-bold text-sky-600">
                    {s.number}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  {s.description}
                </p>
                {i < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-sky-300 mx-auto mt-4 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BENEFITS ─── */}
      <section className="py-20 md:py-28 px-4 bg-gray-50/70">
        <div className="container mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <Badge
                variant="secondary"
                className="mb-4 bg-sky-50 text-sky-700 border-sky-200"
              >
                Pourquoi nous
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                Conçu par et pour
                <br />
                les propriétaires
              </h2>
              <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                Nous comprenons vos défis quotidiens. PMS Guest House vous fait
                gagner du temps, réduit les erreurs et vous aide à offrir une
                meilleure expérience à vos clients.
              </p>

              <ul className="space-y-4">
                {[
                  "Automatisez les tâches répétitives",
                  "Éliminez les doubles réservations",
                  "Suivez vos revenus et dépenses en temps réel",
                  "Attribuez le ménage automatiquement",
                  "Générez des factures professionnelles",
                  "Accédez à vos données partout, anytime",
                ].map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full ${brandBgLight} flex items-center justify-center flex-shrink-0 mt-0.5`}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${brand}`} />
                    </div>
                    <span className="text-gray-700">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* visual mockup */}
            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-amber-50 p-8 md:p-10">
                <div className="bg-white rounded-xl shadow-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 bg-gray-900 rounded" />
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Occupation", value: "87%" },
                      { label: "Revenus", value: "12 400 €" },
                      { label: "Arrivées", value: "4" },
                    ].map((kpi) => (
                      <div
                        key={kpi.label}
                        className="rounded-lg bg-gray-50 p-3 text-center"
                      >
                        <p className="text-xs text-gray-400 mb-1">
                          {kpi.label}
                        </p>
                        <p className="font-bold text-sm">{kpi.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[75, 55, 90, 40, 65].map((w, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-14 shrink-0">
                          Ch. {i + 1}
                        </span>
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              i % 2 === 0 ? "bg-sky-500" : "bg-sky-300"
                            }`}
                            style={{ width: `${w}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* floating badges */}
              <div className="absolute -top-3 -right-3 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-medium text-gray-700">
                  Données sécurisées
                </span>
              </div>
              <div className="absolute -bottom-3 -left-3 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-medium text-gray-700">
                  Support 24/7
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="py-20 md:py-28 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <Badge
              variant="secondary"
              className="mb-4 bg-sky-50 text-sky-700 border-sky-200"
            >
              Témoignages
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Ils nous font confiance
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">
              Découvrez ce que nos utilisateurs pensent de PMS Guest House.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card
                key={i}
                className="border-gray-200 hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star
                        key={j}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEMANDER UN DEVIS ─── */}
      <section id="quote" className="py-20 md:py-28 px-4 bg-gray-50/70">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <Badge
              variant="secondary"
              className="mb-4 bg-sky-50 text-sky-700 border-sky-200"
            >
              Devis
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Vous avez besoin d&apos;une solution sur mesure ?
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">
              Contactez-nous pour discuter de vos besoins. Nous vous
              proposerons une offre adaptée à votre établissement.
            </p>
          </div>

          <Card className="border-gray-200 shadow-xl">
            <CardContent className="p-8 md:p-10">
              <div className="grid md:grid-cols-2 gap-10">
                {/* Left — contact details */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-sky-600 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Jazel Web Agency</h3>
                      <p className="text-sm text-gray-500">
                        Développeur de PMS Guest House
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <a
                      href="mailto:contact@jazelwebagency.com"
                      className="flex items-start gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100 transition-colors">
                        <Mail className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-0.5">Email</p>
                        <p className="text-sm font-medium text-gray-700 group-hover:text-sky-600 transition-colors">
                          contact@jazelwebagency.com
                        </p>
                      </div>
                    </a>

                    <a
                      href="tel:+212662425890"
                      className="flex items-start gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100 transition-colors">
                        <Phone className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-0.5">Téléphone</p>
                        <p className="text-sm font-medium text-gray-700 group-hover:text-sky-600 transition-colors">
                          +212 6 62 42 58 90
                        </p>
                      </div>
                    </a>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-0.5">Adresse</p>
                        <p className="text-sm font-medium text-gray-700">
                          Marrakech, Maroc
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://jazelwebagency.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100 transition-colors">
                        <ExternalLink className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-0.5">Site web</p>
                        <p className="text-sm font-medium text-gray-700 group-hover:text-sky-600 transition-colors">
                          jazelwebagency.com
                        </p>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Right — quick form CTA */}
                <div className="flex flex-col justify-center">
                  <div className="rounded-2xl bg-gradient-to-br from-sky-600 to-sky-800 p-8 text-white">
                    <h3 className="text-xl font-bold mb-3">
                      Demandez votre devis
                    </h3>
                    <p className="text-sky-100 text-sm mb-6 leading-relaxed">
                      Envoyez-nous un email ou appelez-nous directement. Nous
                      répondons sous 24h avec une proposition personnalisée.
                    </p>
                    <div className="space-y-3">
                      <a href="mailto:contact@jazelwebagency.com">
                        <Button className="w-full bg-white text-sky-700 hover:bg-sky-50 font-semibold h-11">
                          <Mail className="w-4 h-4 mr-2" />
                          Envoyer un email
                        </Button>
                      </a>
                      <a href="tel:+212662425890">
                        <Button
                          variant="outline"
                          className="w-full border-white/30 text-white hover:bg-white/10 hover:text-white font-semibold h-11"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Appeler maintenant
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 md:py-28 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-14">
            <Badge
              variant="secondary"
              className="mb-4 bg-sky-50 text-sky-700 border-sky-200"
            >
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Questions fréquentes
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">
              Vous avez une question ? Nous avons probablement la réponse.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="px-1">
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-500 leading-relaxed">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 md:py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-600 to-sky-800" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>

        <div className="container mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 rounded-full text-sm font-medium text-sky-100 mb-6">
            <Heart className="w-4 h-4" />
            Rejoignez notre communauté
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight">
            Prêt à simplifier votre gestion ?
          </h2>
          <p className="text-lg text-sky-100 mb-10 max-w-2xl mx-auto">
            Créez votre compte gratuitement en 30 secondes et découvrez
            pourquoi des centaines de propriétaires nous font confiance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-sky-700 hover:bg-sky-50 h-12 px-8 text-base font-semibold shadow-xl"
              >
                Démarrer l&apos;essai gratuit
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <LandingFooter />
    </div>
  )
}
