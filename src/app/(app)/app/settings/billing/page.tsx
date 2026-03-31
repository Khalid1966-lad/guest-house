"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  CreditCard,
  Check,
  Zap,
  Building2,
  Users,
  Calendar,
  Download,
} from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Gratuit",
    price: "0 €",
    period: "/mois",
    description: "Pour débuter votre activité",
    features: [
      "1 maison d'hôtes",
      "5 chambres",
      "Réservations de base",
      "Support par email",
    ],
    current: false,
  },
  {
    name: "Pro",
    price: "29 €",
    period: "/mois",
    description: "Pour les établissements en croissance",
    features: [
      "Maisons d'hôtes illimitées",
      "Chambres illimitées",
      "Facturation avancée",
      "Restaurant intégré",
      "Statistiques détaillées",
      "Support prioritaire",
    ],
    current: true,
  },
  {
    name: "Enterprise",
    price: "99 €",
    period: "/mois",
    description: "Pour les groupes et chaînes",
    features: [
      "Tout dans Pro",
      "API accès",
      "Intégrations personnalisées",
      "Account manager dédié",
      "SLA garanti",
    ],
    current: false,
  },
]

export default function BillingSettingsPage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Facturation
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez votre abonnement et vos factures
          </p>
        </div>
      </div>

      {/* Current Plan */}
      <Card className="border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950 dark:to-blue-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-sky-600" />
              <CardTitle>Abonnement actuel</CardTitle>
            </div>
            <Badge className="bg-sky-600">Pro</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Plan</p>
              <p className="font-semibold">Pro</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Prix</p>
              <p className="font-semibold">29 € / mois</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Prochaine facturation</p>
              <p className="font-semibold">15 janvier 2025</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.current ? "border-sky-500 border-2" : ""}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.current && (
                  <Badge className="bg-sky-600">
                    <Check className="w-3 h-3 mr-1" />
                    Actuel
                  </Badge>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.current ? "outline" : "default"}
                disabled={plan.current}
              >
                {plan.current ? "Plan actuel" : "Changer de plan"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisation ce mois</CardTitle>
          <CardDescription>
            Votre consommation de ressources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-gray-500">Maison d'hôtes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-gray-500">Chambres</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-gray-500">Réservations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">∞</p>
                <p className="text-sm text-gray-500">Illimité</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historique des factures</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Tout télécharger
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: "15 Déc 2024", amount: "29,00 €", status: "Payée" },
              { date: "15 Nov 2024", amount: "29,00 €", status: "Payée" },
              { date: "15 Oct 2024", amount: "29,00 €", status: "Payée" },
            ].map((invoice, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div>
                  <p className="font-medium">{invoice.date}</p>
                  <p className="text-sm text-gray-500">{invoice.amount}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700 border-0">
                    {invoice.status}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
