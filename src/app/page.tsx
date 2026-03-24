"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Hotel,
  CalendarDays,
  Users,
  CreditCard,
  BarChart3,
  Smartphone,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"

const features = [
  {
    icon: CalendarDays,
    title: "Gestion des réservations",
    description: "Planning intuitif, réservations en ligne, synchronisation avec les plateformes de réservation."
  },
  {
    icon: Hotel,
    title: "Gestion des chambres",
    description: "Configuration flexible des chambres, tarifs saisonniers, statuts en temps réel."
  },
  {
    icon: Users,
    title: "Gestion des clients",
    description: "Fiches clients complètes, historique des séjours, programme de fidélité intégré."
  },
  {
    icon: CreditCard,
    title: "Facturation & Paiements",
    description: "Factures automatiques, suivi des paiements, intégration avec les solutions de paiement."
  },
  {
    icon: BarChart3,
    title: "Statistiques & Rapports",
    description: "Tableaux de bord personnalisables, rapports détaillés, export des données."
  },
  {
    icon: Smartphone,
    title: "Accessible partout",
    description: "Interface responsive, application mobile, notifications en temps réel."
  },
]

const benefits = [
  "Gagnez du temps avec l'automatisation",
  "Réduisez les erreurs de réservation",
  "Améliorez l'expérience client",
  "Augmentez votre taux d'occupation",
  "Pilotez votre activité en temps réel",
  "Données sécurisées et sauvegardées",
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">PMS Guest House</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Fonctionnalités</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Tarifs</a>
            <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900">Contact</a>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Se connecter</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm">
                Essai gratuit
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
            <CheckCircle2 className="w-4 h-4" />
            14 jours d'essai gratuit, sans engagement
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            La solution complète pour gérer
            <br />
            <span className="text-emerald-600">votre maison d'hôtes</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Simplifiez la gestion de votre établissement avec notre PMS intuitif. 
            Réservations, facturation, clients... Tout en un seul outil.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8">
                Commencer gratuitement
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-12 px-8">
                Voir la démo
              </Button>
            </Link>
          </div>
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            <div>
              <p className="text-3xl font-bold text-emerald-600">500+</p>
              <p className="text-sm text-gray-600">Maisons d'hôtes</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">10k+</p>
              <p className="text-sm text-gray-600">Réservations/mois</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">98%</p>
              <p className="text-sm text-gray-600">Satisfaction</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">24/7</p>
              <p className="text-sm text-gray-600">Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Une suite complète d'outils conçus pour simplifier la gestion quotidienne de votre établissement.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Pourquoi choisir PMS Guest House ?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Notre solution a été conçue par et pour les propriétaires de maisons d'hôtes. 
                Nous comprenons vos besoins et avons créé un outil qui s'adapte à votre façon de travailler.
              </p>
              
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8">
                <Link href="/register">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    Commencer maintenant
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-emerald-100 rounded-2xl p-8 aspect-square flex items-center justify-center">
                <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-4">
                  <div className="h-8 bg-emerald-600 rounded-lg mb-4" />
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="h-16 bg-emerald-50 rounded" />
                    <div className="h-16 bg-blue-50 rounded" />
                    <div className="h-16 bg-yellow-50 rounded" />
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium">Données sécurisées</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium">Support 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-emerald-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à transformer votre gestion ?
          </h2>
          <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
            Rejoignez plus de 500 propriétaires qui font confiance à PMS Guest House 
            pour gérer leur établissement.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="h-12 px-8">
              Démarrer l'essai gratuit
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <Hotel className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">PMS Guest House</span>
              </div>
              <p className="text-sm">
                La solution complète pour gérer votre maison d'hôtes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-white">Tarifs</a></li>
                <li><a href="#" className="hover:text-white">Intégrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white">CGU</a></li>
                <li><a href="#" className="hover:text-white">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-sm">
            <p>© 2024 PMS Guest House. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
