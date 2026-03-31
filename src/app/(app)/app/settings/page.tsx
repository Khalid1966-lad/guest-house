"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  Globe,
  CreditCard,
  Users,
  Database,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"

const settingsSections = [
  {
    title: "Compte",
    description: "Gérez votre profil et vos préférences personnelles",
    icon: User,
    href: "/app/settings/profile",
    color: "bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-400",
  },
  {
    title: "Établissement",
    description: "Configurez les informations de votre maison d'hôtes",
    icon: Building2,
    href: "/app/settings/establishment",
    color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
  },
  {
    title: "Notifications",
    description: "Gérez vos préférences de notifications",
    icon: Bell,
    href: "/app/settings/notifications",
    color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400",
  },
  {
    title: "Équipements",
    description: "Configurez les équipements disponibles pour vos chambres",
    icon: Palette,
    href: "/app/settings/amenities",
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
  },
  {
    title: "Utilisateurs",
    description: "Gérez les utilisateurs et leurs permissions",
    icon: Users,
    href: "/app/settings/users",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
  },
  {
    title: "Rôles & Permissions",
    description: "Configurez les accès et permissions par rôle",
    icon: ShieldCheck,
    href: "/app/settings/roles",
    color: "bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400",
  },
  {
    title: "Sécurité",
    description: "Options de sécurité et mots de passe",
    icon: Shield,
    href: "/app/settings/security",
    color: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
  },
  {
    title: "Facturation",
    description: "Gérez votre abonnement et vos factures",
    icon: CreditCard,
    href: "/app/settings/billing",
    color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400",
  },
  {
    title: "Intégrations",
    description: "Connectez vos applications externes",
    icon: Globe,
    href: "/app/settings/integrations",
    color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400",
  },
  {
    title: "Données",
    description: "Exportez ou sauvegardez vos données",
    icon: Database,
    href: "/app/settings/data",
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
  },
  {
    title: "Aide & Support",
    description: "Documentation et assistance",
    icon: HelpCircle,
    href: "/app/settings/help",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
]

export default function SettingsPage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Paramètres
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gérez les paramètres de votre compte et de votre établissement
        </p>
      </div>

      {/* Quick Info */}
      <Card className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950 dark:to-blue-950 border-sky-200 dark:border-sky-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-lg">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div>
              <p className="font-semibold">{session?.user?.name || "Utilisateur"}</p>
              <p className="text-sm text-gray-500">{session?.user?.email}</p>
              <p className="text-xs text-sky-600 capitalize">{session?.user?.role} • {session?.user?.guestHouseName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg ${section.color} flex items-center justify-center`}>
                    <section.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {section.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
