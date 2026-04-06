"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  Globe,
  Calendar,
  MessageSquare,
  CreditCard,
  Mail,
  BarChart3,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const integrations = [
  {
    name: "Booking.com",
    description: "Synchronisez vos réservations Booking.com",
    icon: Calendar,
    status: "available",
    category: "OTA",
  },
  {
    name: "Airbnb",
    description: "Connectez votre compte Airbnb",
    icon: Globe,
    status: "available",
    category: "OTA",
  },
  {
    name: "Expedia",
    description: "Synchronisation avec Expedia",
    icon: Globe,
    status: "coming_soon",
    category: "OTA",
  },
  {
    name: "Stripe",
    description: "Acceptez les paiements par carte bancaire",
    icon: CreditCard,
    status: "available",
    category: "Paiement",
  },
  {
    name: "PayPal",
    description: "Paiements via PayPal",
    icon: CreditCard,
    status: "coming_soon",
    category: "Paiement",
  },
  {
    name: "Sendinblue",
    description: "Envoi d'emails professionnels",
    icon: Mail,
    status: "available",
    category: "Communication",
  },
  {
    name: "Twilio",
    description: "Envoi de SMS automatiques",
    icon: MessageSquare,
    status: "available",
    category: "Communication",
  },
  {
    name: "Google Analytics",
    description: "Suivi des visites de votre site",
    icon: BarChart3,
    status: "available",
    category: "Analytics",
  },
]

export default function IntegrationsSettingsPage() {
  const [enabledIntegrations, setEnabledIntegrations] = useState<string[]>([])

  const toggleIntegration = (name: string) => {
    setEnabledIntegrations((prev) =>
      prev.includes(name)
        ? prev.filter((i) => i !== name)
        : [...prev, name]
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-700 border-0">Disponible</Badge>
      case "coming_soon":
        return <Badge className="bg-yellow-100 text-yellow-700 border-0">Bientôt</Badge>
      case "beta":
        return <Badge className="bg-purple-100 text-purple-700 border-0">Beta</Badge>
      default:
        return null
    }
  }

  const categories = [...new Set(integrations.map((i) => i.category))]

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
            Intégrations
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Connectez vos applications externes
          </p>
        </div>
      </div>

      {/* Categories */}
      {categories.map((category) => (
        <div key={category} className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations
              .filter((i) => i.category === category)
              .map((integration) => (
                <Card key={integration.name}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-sky-100 dark:bg-sky-900 flex items-center justify-center flex-shrink-0">
                        <integration.icon className="w-6 h-6 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{integration.name}</h3>
                          {getStatusBadge(integration.status)}
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                          {integration.description}
                        </p>
                        <div className="flex items-center gap-2">
                          {integration.status === "available" ? (
                            <>
                              <Switch
                                checked={enabledIntegrations.includes(integration.name)}
                                onCheckedChange={() => toggleIntegration(integration.name)}
                              />
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Configurer
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" disabled>
                              Bientôt disponible
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}

      {/* Info Card */}
      <Card className="bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800">
        <CardContent className="p-6">
          <h3 className="font-medium mb-2">Besoin d&apos;une intégration personnalisée ?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Nous pouvons développer des intégrations sur mesure pour vos besoins spécifiques.
          </p>
          <Button variant="outline">
            Contacter l&apos;équipe
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
