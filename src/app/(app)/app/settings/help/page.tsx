"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  FileText,
  Video,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"

const helpCategories = [
  {
    title: "Guide de démarrage",
    description: "Apprenez les bases du système",
    icon: Book,
    href: "#",
    color: "bg-sky-100 text-sky-600",
  },
  {
    title: "Tutoriels vidéo",
    description: "Regardez nos guides pas à pas",
    icon: Video,
    href: "#",
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "FAQ",
    description: "Questions fréquemment posées",
    icon: HelpCircle,
    href: "#",
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Documentation",
    description: "Documentation technique complète",
    icon: FileText,
    href: "#",
    color: "bg-orange-100 text-orange-600",
  },
]

const faqs = [
  {
    question: "Comment ajouter une nouvelle chambre ?",
    answer:
      "Allez dans le menu Chambres, puis cliquez sur 'Ajouter une chambre'. Remplissez les informations demandées et validez.",
  },
  {
    question: "Comment créer une réservation ?",
    answer:
      "Accédez au menu Réservations, cliquez sur 'Nouvelle réservation', sélectionnez le client, la chambre et les dates.",
  },
  {
    question: "Comment générer une facture ?",
    answer:
      "Vous pouvez créer une facture depuis le menu Facturation, ou depuis une réservation existante.",
  },
  {
    question: "Comment inviter d'autres utilisateurs ?",
    answer:
      "Allez dans Paramètres > Utilisateurs, puis cliquez sur 'Ajouter un utilisateur' pour inviter un collaborateur.",
  },
]

export default function HelpSettingsPage() {
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
            Aide & Support
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Trouvez de l&apos;aide et contactez notre équipe
          </p>
        </div>
      </div>

      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {helpCategories.map((category) => (
          <Card key={category.title} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center`}>
                  <category.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{category.title}</h3>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-sky-600" />
            <CardTitle>Questions fréquentes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 dark:bg-gray-900 rounded-lg list-none">
                  <span className="font-medium">{faq.question}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-2 px-4 text-gray-600 dark:text-gray-400">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <CardTitle>Chat en direct</CardTitle>
            </div>
            <CardDescription>
              Discutez avec notre équipe de support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <MessageCircle className="w-4 h-4 mr-2" />
              Démarrer un chat
            </Button>
            <p className="text-xs text-center text-gray-500 mt-2">
              Disponible Lun-Ven, 9h-18h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-sky-600" />
              <CardTitle>Email</CardTitle>
            </div>
            <CardDescription>
              Envoyez-nous un email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Mail className="w-4 h-4 mr-2" />
              support@pms-guesthouse.com
            </Button>
            <p className="text-xs text-center text-gray-500 mt-2">
              Réponse sous 24h ouvrées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle>Envoyer une demande</CardTitle>
          <CardDescription>
            Décrivez votre problème ou question
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet</Label>
            <Input id="subject" placeholder="Résumé de votre demande" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Décrivez votre problème ou question en détail..."
              rows={4}
            />
          </div>
          <Button className="bg-sky-600 hover:bg-sky-700">
            <Mail className="w-4 h-4 mr-2" />
            Envoyer la demande
          </Button>
        </CardContent>
      </Card>

      {/* Version Info */}
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Version de l&apos;application</span>
            <span className="font-mono">v1.8.1</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
