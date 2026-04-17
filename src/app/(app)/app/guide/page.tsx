"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  FileText,
  HelpCircle,
  Sparkles,
  Bell,
  Clock,
  CalendarDays,
  BedDouble,
  Users,
  CreditCard,
  UtensilsCrossed,
  Receipt,
  BarChart3,
  Settings,
  Shield,
  Eye,
  Info,
  LayoutDashboard,
  Printer,
  Download,
  Globe,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"

// ─── Guide Data ──────────────────────────────────────────────────────────────

interface GuideSection {
  id: string
  icon: LucideIcon
  title: string
  description: string
  color: string
  bgColor: string
  content: GuideContent[]
}

interface GuideContent {
  type: "paragraph" | "steps" | "tip" | "warning" | "feature" | "list" | "info"
  title?: string
  items?: string[]
  text?: string
  icon?: LucideIcon
}

const guideSections: GuideSection[] = [
  // ────────────────────────────────────────────────────────────────────────────
  // 1. BIENVENUE
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "introduction",
    icon: BookOpen,
    title: "Bienvenue",
    description: "Découvrez PMS Guest House v2.7.1",
    color: "text-sky-600",
    bgColor: "bg-sky-50 dark:bg-sky-950",
    content: [
      {
        type: "paragraph",
        title: "Qu'est-ce que PMS Guest House ?",
        text: "PMS Guest House (Property Management System) est votre outil de gestion tout-en-un conçu spécialement pour les maisons d'hôtes, riads, guest houses et petits hôtels. Simple, moderne et complet, il vous permet de gérer toutes les facettes de votre activité depuis un seul endroit — que ce soit sur ordinateur, tablette ou téléphone.",
      },
      {
        type: "feature",
        title: "Ce que vous pouvez faire avec PMS Guest House",
        items: [
          "Gérer vos chambres : types, prix, photos, équipements et disponibilité en temps réel",
          "Créer et suivre les réservations : calendrier, check-in, check-out, annulations",
          "Gérer votre carnet clients : fiches détaillées, historique de séjours, pièces d'identité",
          "Facturer professionnellement : factures liées aux réservations, paiements, impressions",
          "Gérer un restaurant intégré : menu, commandes (room service, sur place, à emporter)",
          "Organiser le ménage : check-lists, attribution automatique, suivi des tâches",
          "Suivre les dépenses : catégories, filtres, tendances",
          "Consulter des statistiques détaillées : taux d'occupation, revenus, bénéfices",
          "Recevoir des notifications en temps réel : arrivées, départs, commandes, factures",
          "Gérer votre équipe : 7 rôles, permissions précises, utilisateurs illimités",
          "Personnaliser les paramètres : établissement, facturation, équipements, thème",
        ],
      },
      {
        type: "info",
        text: "Version 2.7.1 — Cette version apporte le statut réservé pour les chambres, le transfert de chambre entre réservations, le filtrage intelligent des chambres disponibles par dates, et la correction du défilement des notifications.",
      },
      {
        type: "tip",
        text: "Utilisez le menu latéral sur la gauche pour naviguer entre les sections. Cliquez sur la petite flèche en bas du menu pour le réduire et ne garder que les icônes. Sur mobile, appuyez sur le bouton hamburger (☰) en haut à gauche.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 2. TABLEAU DE BORD
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Tableau de bord",
    description: "La vue d'ensemble de votre activité",
    color: "text-violet-600",
    bgColor: "bg-violet-50 dark:bg-violet-950",
    content: [
      {
        type: "paragraph",
        title: "Pourquoi c'est important",
        text: "Le tableau de bord est la première page que vous voyez en vous connectant. Il vous donne un aperçu instantané de l'état de votre établissement à l'instant T. C'est votre centre de commandement quotidien.",
      },
      {
        type: "feature",
        title: "Les indicateurs principaux",
        items: [
          "Chambres occupées / libres / en maintenance : les compteurs vous montrent la disponibilité en un coup d'œil",
          "Arrivées du jour : liste des clients qui doivent arriver aujourd'hui, prêts pour le check-in",
          "Départs du jour : liste des clients qui quittent aujourd'hui, prêts pour le check-out",
          "Réservations récentes : les dernières réservations créées avec leur statut (en attente, confirmée, annulée)",
          "Résumé financier : revenus totaux et dépenses de la période en cours",
          "Tâches en attente : check-ins à effectuer, check-outs à traiter, factures impayées",
        ],
      },
      {
        type: "steps",
        title: "Votre routine quotidienne recommandée",
        items: [
          "Consultez le tableau de bord chaque matin pour planifier votre journée",
          "Vérifiez les arrivées prévues et préparez les chambres concernées",
          "Traitez les départs du jour : check-out, facturation, libération des chambres",
          "Consultez les tâches en attente et attribuez-les à votre équipe",
          "Vérifiez les nouvelles réservations et confirmez celles en attente",
        ],
      },
      {
        type: "tip",
        text: "Les indicateurs colorés (vert, orange, rouge) vous alertent immédiatement sur ce qui nécessite votre attention. Un chiffre en rouge indique généralement une action urgente à effectuer.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 3. CHAMBRES
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "rooms",
    icon: BedDouble,
    title: "Chambres",
    description: "Créez et organisez vos chambres",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950",
    content: [
      {
        type: "paragraph",
        title: "Comment ça fonctionne",
        text: "La section Chambres est le cœur physique de votre établissement. Chaque chambre dispose d'une fiche complète : numéro, type, capacité, prix, photos et équipements. Vous pouvez gérer la tarification de manière simple ou avancée selon vos besoins.",
      },
      {
        type: "steps",
        title: "Créer une nouvelle chambre",
        items: [
          "Allez dans la section « Chambres » via le menu latéral",
          "Cliquez sur le bouton « + Nouvelle chambre » en haut de la page",
          "Renseignez le numéro de chambre (ex : 101, Chambre Bleue, Suite Jardin...)",
          "Choisissez le type : Standard, Confort, Suite ou Familiale",
          "Indiquez la capacité maximale (nombre de personnes) et le nombre de lits",
          "Définissez le prix par nuit selon le mode choisi (voir ci-dessous)",
          "Ajoutez une description et sélectionnez les équipements disponibles",
          "Uploadez jusqu'à 10 photos (le système les compresse automatiquement)",
          "Cliquez sur « Créer » pour enregistrer la chambre",
        ],
      },
      {
        type: "feature",
        title: "Les types de chambres",
        items: [
          "Standard : chambre basique, idéale pour les courts séjours",
          "Confort : chambre avec équipements supplémentaires (climatisation, minibar...)",
          "Suite : grande chambre avec espace salon séparé",
          "Familiale : chambre adaptée aux familles avec enfants (lits doubles + lits simples)",
        ],
      },
      {
        type: "paragraph",
        title: "Deux modes de tarification",
        text: "PMS Guest House propose deux modes de tarification que vous choisissez lors de la création de la chambre :",
      },
      {
        type: "feature",
        title: "Mode 1 — Prix par chambre",
        items: [
          "Un prix unique pour la chambre, quel que soit le nombre d'occupants",
          "Idéal pour les chambres doubles ou les suites",
          "Exemple : 500 MAD / nuit pour la Suite Jardin, même si 1 ou 2 personnes",
        ],
      },
      {
        type: "feature",
        title: "Mode 2 — Prix par personne",
        items: [
          "Le prix est calculé en multipliant le tarif unitaire par le nombre de personnes",
          "Idéal pour les dortoirs, auberges ou chambres partagées",
          "Exemple : 200 MAD / personne / nuit → 400 MAD pour 2 personnes",
        ],
      },
      {
        type: "feature",
        title: "Lits supplémentaires et lits bébé",
        items: [
          "Lit supplémentaire : vous pouvez définir un prix pour un lit d'appoint (ex : 100 MAD/nuit)",
          "Lit bébé : un prix séparé peut être configuré (ex : 50 MAD/nuit, ou gratuit)",
          "Ces options sont proposées lors de la création d'une réservation si la capacité le permet",
        ],
      },
      {
        type: "feature",
        title: "Gestion des photos",
        items: [
          "Jusqu'à 10 photos par chambre",
          "Formats acceptés : JPG, PNG, WebP",
          "Compression automatique pour un chargement rapide",
          "Les photos s'affichent dans la galerie de la chambre et peuvent être réorganisées",
        ],
      },
      {
        type: "feature",
        title: "Équipements de la chambre",
        items: [
          "Sélectionnez les équipements disponibles dans la liste prédéfinie",
          "Exemples : Wi-Fi, Climatisation, TV, Coffre-fort, Sèche-cheveux, Minibar, Terrasse...",
          "Gérez la liste complète des équipements dans Paramètres > Équipements",
          "Les équipements s'affichent sur la fiche détail de la chambre",
        ],
      },
      {
        type: "paragraph",
        title: "Tarification saisonnière (RoomPrice)",
        text: "Vous pouvez définir des tarifs spécifiques par période pour chaque chambre. Par exemple, un prix différent en haute saison, pendant le Ramadan, ou pour les week-ends. Ces tarifs prioritaires remplacent automatiquement le prix de base pendant les dates configurées.",
      },
      {
        type: "feature",
        title: "Statuts de chambre",
        items: [
          "Disponible : la chambre est prête à être réservée ou occupée",
          "Occupée : un client séjourne actuellement dans cette chambre",
          "Maintenance : la chambre est hors service (réparations, rénovation...)",
          "Le statut change automatiquement lors des check-ins et check-outs",
        ],
      },
      {
        type: "info",
        text: "La page de détail d'une chambre vous montre son historique complet : toutes les réservations passées et à venir, les séjours effectués, et l'état actuel. Cliquez simplement sur une chambre dans la liste pour y accéder.",
      },
      {
        type: "tip",
        text: "Utilisez des numéros de chambre logiques (101 pour le 1er étage, chambre 1) pour vous retrouver facilement. Ajoutez de belles photos pour aider vos clients à choisir leur chambre.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 4. RÉSERVATIONS
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "bookings",
    icon: CalendarDays,
    title: "Réservations",
    description: "Gérez les arrivées et départs",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    content: [
      {
        type: "paragraph",
        title: "Le cœur de votre activité",
        text: "Les réservations sont l'élément central du PMS. C'est ici que vous enregistrez chaque séjour de vos clients, de la première demande jusqu'au départ. Le système vous aide à chaque étape avec des calculs automatiques, des alertes de conflit et un suivi complet des statuts.",
      },
      {
        type: "feature",
        title: "Vue calendrier",
        items: [
          "Affichage mensuel avec vue d'ensemble de toutes les réservations",
          "Chaque jour indique les arrivées (flèche verte), les départs (flèche rouge) et les séjours en cours",
          "Cliquez sur un jour pour voir les réservations détaillées",
          "Navigation rapide entre les mois avec les flèches",
        ],
      },
      {
        type: "steps",
        title: "Créer une réservation",
        items: [
          "Cliquez sur « + Nouvelle réservation » en haut de la page",
          "Sélectionnez un client existant dans la liste, ou créez-en un nouveau directement",
          "Choisissez la chambre souhaitée (seules les chambres disponibles s'affichent)",
          "Définissez les dates d'arrivée et de départ",
          "Indiquez le nombre d'adultes et d'enfants",
          "Le système calcule automatiquement le prix (nombre de nuits × tarif)",
          "Si besoin, ajoutez des lits supplémentaires ou un lit bébé (leurs prix s'ajoutent)",
          "Choisissez la source de réservation (directe, Booking.com, Airbnb...)",
          "Enregistrez la réservation",
        ],
      },
      {
        type: "info",
        title: "Calcul automatique du prix",
        text: "Le système calcule le prix total en fonction du nombre de nuits, du tarif de la chambre (ou par personne), des lits supplémentaires et du lit bébé. Les tarifs saisonniers (RoomPrice) sont automatiquement pris en compte si des dates correspondantes existent. Vous pouvez toujours ajuster le prix manuellement si besoin.",
      },
      {
        type: "feature",
        title: "Le cycle de vie d'une réservation (statuts)",
        items: [
          "En attente : la réservation vient d'être créée, en attente de confirmation",
          "Confirmée : le client a confirmé, la réservation est validée",
          "Arrivée (check-in) : le client est arrivé, la chambre est occupée",
          "Parti (check-out) : le client est parti, la chambre est libérée",
          "Annulée : la réservation a été annulée",
          "No-show : le client avait réservé mais ne s'est pas présenté",
        ],
      },
      {
        type: "steps",
        title: "Effectuer un check-in",
        items: [
          "Trouvez la réservation dans la liste ou le calendrier",
          "Vérifiez que le statut est « Confirmée »",
          "Cliquez sur le bouton « Check-in »",
          "La chambre passe automatiquement en statut « Occupée »",
          "Le statut de ménage de la chambre est réinitialisé",
          "Le client est maintenant considéré comme présent dans l'établissement",
        ],
      },
      {
        type: "steps",
        title: "Effectuer un check-out",
        items: [
          "Trouvez la réservation dans la liste",
          "Vérifiez que le statut est « Arrivée »",
          "Cliquez sur le bouton « Check-out »",
          "La chambre passe automatiquement en statut « Disponible »",
          "Le statut de ménage passe à « En départ » (cleaningStatus = departure)",
          "Une tâche de ménage est automatiquement créée (si l'auto-assignation est activée)",
          "Vous pouvez ensuite créer une facture depuis la réservation",
        ],
      },
      {
        type: "feature",
        title: "Modifier et supprimer une réservation",
        items: [
          "Cliquez sur une réservation pour ouvrir ses détails",
          "Modifiez les dates, la chambre, le nombre de personnes ou le prix",
          "Le système recalcule automatiquement le prix si les dates ou la chambre changent",
          "Pour supprimer : cliquez sur « Supprimer » et confirmez dans la boîte de dialogue",
          "La suppression est irréversible, sauf si la réservation est facturée",
        ],
      },
      {
        type: "warning",
        text: "Le système détecte automatiquement les conflits de dates (double réservation). Si vous tentez de réserver une chambre déjà occupée pour les mêmes dates, un message d'erreur vous avertira. Toutefois, une vérification humaine reste recommandée.",
      },
      {
        type: "feature",
        title: "Sources de réservation",
        items: [
          "Directe : réservation faite par téléphone, email ou en personne",
          "Booking.com : réservation provenant de la plateforme Booking.com",
          "Airbnb : réservation provenant d'Airbnb",
          "Autres plateformes : Expedia, TripAdvisor, Google Hotels...",
          "La source est utile pour les statistiques (voir quel canal apporte le plus de réservations)",
        ],
      },
      {
        type: "tip",
        text: "Consultez le calendrier régulièrement pour visualiser les disponibilités. Les couleurs vous indiquent immédiatement les jours chargés et les périodes creuses.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 5. CLIENTS
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "guests",
    icon: Users,
    title: "Clients",
    description: "Votre carnet d'adresses intelligent",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950",
    content: [
      {
        type: "paragraph",
        title: "Pourquoi c'est utile",
        text: "La section Clients est votre base de données complète de tous les visiteurs. En conservant les informations de vos clients, vous pouvez les retrouver facilement pour une nouvelle réservation, comprendre leurs préférences et offrir un service personnalisé qui fait la différence.",
      },
      {
        type: "feature",
        title: "L'annuaire des clients",
        items: [
          "Liste complète de tous vos clients avec recherche instantanée",
          "Filtrez par nom, email, téléphone ou nationalité",
          "Consultez rapidement le nombre de séjours par client",
          "Accédez à la fiche détaillée de chaque client en un clic",
        ],
      },
      {
        type: "steps",
        title: "Créer un nouveau client",
        items: [
          "Allez dans la section « Clients » via le menu latéral",
          "Cliquez sur « + Nouveau client »",
          "Remplissez les informations obligatoires : nom et prénom",
          "Ajoutez les coordonnées : email, téléphone",
          "Renseignez la nationalité et les pièces d'identité (passeport, CIN...)",
          "Ajoutez l'adresse complète si nécessaire",
          "Ajoutez des notes personnelles (préférences, allergies, demandes spéciales...)",
          "Enregistrez le client",
        ],
      },
      {
        type: "feature",
        title: "Informations utiles à conserver",
        items: [
          "Nom et prénom (obligatoires)",
          "Email et téléphone (pour les confirmations et rappels)",
          "Nationalité et numéro de pièce d'identité (obligatoire dans certains pays)",
          "Adresse complète (ville, code postal, pays)",
          "Notes : préférences de chambre, régime alimentaire, anniversaire...",
        ],
      },
      {
        type: "info",
        title: "La fiche détaillée du client",
        text: "En cliquant sur un client, vous accédez à sa fiche complète avec : toutes ses réservations passées et à venir, les factures associées, le nombre total de séjours effectués, et le montant total dépensé. C'est un outil précieux pour fidéliser votre clientèle.",
      },
      {
        type: "tip",
        text: "Vous pouvez créer un client directement depuis le formulaire de réservation si c'est sa première visite. Les informations seront automatiquement sauvegardées dans la base de clients — pas besoin de naviguer entre les pages.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 6. FACTURATION
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "invoices",
    icon: CreditCard,
    title: "Facturation",
    description: "Créez et imprimez vos factures",
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950",
    content: [
      {
        type: "paragraph",
        title: "Gérez vos factures professionnellement",
        text: "La facturation vous permet de créer des factures complètes et professionnelles pour vos clients. Vous pouvez les lier à une réservation existante ou créer des factures indépendantes pour des services supplémentaires (restaurant, spa, excursions...). L'intégration restaurant permet d'ajouter directement les commandes non facturées.",
      },
      {
        type: "steps",
        title: "Créer une facture depuis une réservation",
        items: [
          "Ouvrez la réservation concernée et cliquez sur « Créer une facture »",
          "Les frais du séjour sont pré-remplis automatiquement (nuits × tarif)",
          "Les commandes restaurant non facturées du client apparaissent — cliquez pour les ajouter",
          "Ajoutez des lignes supplémentaires si nécessaire (services, extras...)",
          "Vérifiez les montants, les quantités et les taux de TVA par ligne",
          "Enregistrez la facture",
        ],
      },
      {
        type: "steps",
        title: "Créer une facture indépendante (standalone)",
        items: [
          "Allez dans la section « Factures » via le menu",
          "Cliquez sur « + Nouvelle facture »",
          "Sélectionnez le client concerné",
          "Ajoutez vos lignes manuellement : description, quantité, prix unitaire, taux de TVA",
          "Enregistrez la facture",
        ],
      },
      {
        type: "feature",
        title: "Lignes de facture (line items)",
        items: [
          "Description : texte libre décrivant la prestation (ex : « Séjour Suite Jardin — 3 nuits »)",
          "Quantité : nombre d'unités (nuits, personnes, services...)",
          "Prix unitaire : prix d'une unité",
          "Taux de TVA : taux applicable à cette ligne (0%, 10%, 14%, 20%...)",
          "Le sous-total, la TVA et le total sont calculés automatiquement",
        ],
      },
      {
        type: "info",
        title: "Intégration restaurant",
        text: "Lors de la création d'une facture, toutes les commandes restaurant non facturées du client sont affichées. Cliquez simplement sur une commande pour ajouter ses articles à la facture. Les prix des articles restaurant sont verrouillés (read-only) — ils proviennent directement du menu et ne peuvent pas être modifiés sur la facture.",
      },
      {
        type: "feature",
        title: "Moyens de paiement disponibles",
        items: [
          "Espèces : paiement en liquide",
          "Carte bancaire : paiement par carte (CB, Visa, Mastercard...)",
          "Virement : virement bancaire",
          "Chèque : paiement par chèque",
          "Mobile Money : paiement mobile (surtout utilisé en Afrique)",
          "Paiement en ligne : via une plateforme de paiement en ligne",
          "Autre : tout autre moyen de paiement à préciser",
        ],
      },
      {
        type: "steps",
        title: "Enregistrer un paiement",
        items: [
          "Ouvrez la facture concernée",
          "Cliquez sur « Enregistrer un paiement »",
          "Saisissez le montant payé et sélectionnez le moyen de paiement",
          "Confirmez le paiement",
          "La facture passe en statut « Payée » si le montant est couvert",
          "Vous pouvez enregistrer plusieurs paiements partiels",
        ],
      },
      {
        type: "feature",
        title: "La page de détail d'une facture",
        items: [
          "Récapitulatif complet : numéro, date, client, statut de paiement",
          "Détail de chaque ligne avec description, quantité, prix, TVA",
          "Historique des paiements enregistrés (date, montant, méthode)",
          "Solde restant à payer",
          "Possibilité d'ajouter des lignes ou des paiements supplémentaires",
        ],
      },
      {
        type: "feature",
        title: "Impression et mise en page",
        items: [
          "Modèle professionnel avec votre logo agrandi en haut",
          "Identifiants légaux : ICE, IF, CNSS, code de la maison d'hôtes",
          "Informations complètes du client",
          "Détail des prestations avec totaux (sous-total, TVA, taxe de séjour, total TTC)",
          "Conditions de paiement",
          "Utilisez « Imprimer » ou « Aperçu avant impression » pour générer le document",
        ],
      },
      {
        type: "paragraph",
        title: "Format du numéro de facture",
        text: "Les numéros de facture suivent le format : FAC-YYYY-NNNNN/GH001 où YYYY est l'année, NNNNN est un numéro séquentiel, et GH001 est le code de votre établissement.",
      },
      {
        type: "warning",
        text: "La suppression d'une facture est réservée au Propriétaire et au Gestionnaire. Cette action est irréversible. En cas d'erreur, il est préférable de créer une facture d'avoir ou de modifier la facture existante.",
      },
      {
        type: "tip",
        text: "Configurez votre logo et vos identifiants légaux (ICE, IF, CNSS) dans Paramètres > Établissement pour qu'ils apparaissent automatiquement sur toutes vos factures imprimées.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 7. RESTAURANT
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "restaurant",
    icon: UtensilsCrossed,
    title: "Restaurant",
    description: "Menu, commandes et intégration facturation",
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    content: [
      {
        type: "paragraph",
        title: "Module restaurant intégré",
        text: "Si votre établissement propose de la restauration, ce module complet vous permet de gérer votre carte (menu), de prendre des commandes et de les suivre jusqu'à la livraison. Les commandes peuvent être liées aux réservations et ajoutées directement aux factures des clients.",
      },
      {
        type: "feature",
        title: "Gestion du menu",
        items: [
          "Catégories : organisez vos plats (Entrées, Plats, Desserts, Boissons, Grillades...)",
          "Chaque item inclut : nom, prix, description, photo, liste des allergènes",
          "Activez ou désactivez des plats selon la disponibilité (plats du jour, rupture de stock...)",
          "Deux modes d'affichage : grille (avec photos) ou liste (compacte)",
          "Réorganisez l'ordre d'affichage des plats par glisser-déposer",
        ],
      },
      {
        type: "steps",
        title: "Créer un item de menu",
        items: [
          "Allez dans l'onglet « Menu » de la section Restaurant",
          "Cliquez sur « + Nouvel item »",
          "Remplissez le nom, le prix et la description du plat",
          "Ajoutez une photo (optionnel mais recommandé pour la vue grille)",
          "Sélectionnez la catégorie et indiquez les allergènes",
          "Activez l'item et enregistrez",
        ],
      },
      {
        type: "steps",
        title: "Créer une commande",
        items: [
          "Allez dans l'onglet « Commandes » de la section Restaurant",
          "Cliquez sur « + Nouvelle commande »",
          "Choisissez le type de commande (voir ci-dessous)",
          "Sélectionnez les plats et les quantités souhaités",
          "Validez la commande",
          "Suivez son évolution dans la liste des commandes",
        ],
      },
      {
        type: "feature",
        title: "Les 3 types de commandes",
        items: [
          "Room Service : liée à une chambre et une réservation en cours. Le client commande depuis sa chambre. Le coût est automatiquement ajoutable à la facture du client.",
          "Sur place (Dine-in) : le client mange au restaurant. Assignez un numéro de table pour le suivi.",
          "À emporter (Takeaway) : le client repart avec sa commande. Aucune table ni chambre nécessaire.",
        ],
      },
      {
        type: "feature",
        title: "Le cycle de vie d'une commande (statuts)",
        items: [
          "En attente : la commande vient d'être créée, elle attend d'être prise en charge",
          "En préparation : le cuisinier prépare les plats",
          "Prête : les plats sont prêts, en attente de service",
          "Servie : la commande a été livrée au client",
          "Annulée : la commande a été annulée (avant ou pendant la préparation)",
        ],
      },
      {
        type: "info",
        title: "Facturation des commandes restaurant",
        text: "Les commandes restaurant non facturées apparaissent automatiquement lors de la création d'une facture pour le client. Cliquez sur une commande pour ajouter tous ses articles à la facture. Les prix des articles sont verrouillés et proviennent directement du menu — impossible de les modifier sur la facture. Ainsi, les prix sont toujours cohérents entre le menu et la facture.",
      },
      {
        type: "feature",
        title: "Statistiques du restaurant",
        items: [
          "Stats du menu : nombre de ventes par item, plats les plus populaires, revenus par catégorie",
          "Stats des commandes : nombre de commandes par période, par type, par statut",
          "Format compact intégré directement dans la page pour une consultation rapide",
        ],
      },
      {
        type: "warning",
        text: "Seules les commandes avec le statut « Annulée » peuvent être supprimées. Les commandes servies ou en cours ne peuvent pas être supprimées pour garantir la traçabilité.",
      },
      {
        type: "tip",
        text: "Utilisez le mode « Grille » pour présenter votre menu aux clients (avec photos appétissantes), et le mode « Liste » pour une gestion rapide au quotidien.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 8. MÉNAGE (HOUSEKEEPING)
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "housekeeping",
    icon: Sparkles,
    title: "Ménage",
    description: "Nettoyage, check-lists et suivi",
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950",
    content: [
      {
        type: "paragraph",
        title: "Module ménage complet (Nouveau !)",
        text: "Le module Ménage est un outil puissant pour organiser et suivre le nettoyage de vos chambres. Il inclut des fiches de chambre avec badges de statut, des check-lists détaillées de 10 points, l'attribution automatique des tâches au check-out, et un panneau de configuration complet pour gérer votre équipe de ménage.",
      },
      {
        type: "feature",
        title: "Fiches de chambre avec badges",
        items: [
          "Chaque chambre est représentée par une carte avec son numéro et son statut de nettoyage",
          "Badges colorés pour un repérage immédiat : En départ (rouge), En cours (orange), Terminé (vert), Vérifié (bleu)",
          "Filtres par statut : cliquez sur les pastilles en haut pour ne voir que les chambres concernées",
          "Vue d'ensemble complète de l'état de propreté de votre établissement",
        ],
      },
      {
        type: "feature",
        title: "Check-list de 10 points par tâche",
        items: [
          "5 catégories avec 2 points chacune, couvrant tous les aspects du nettoyage",
          "Vérification :État général de la chambre, Signes de dommages ou anomalies",
          "Linge : Draps et housses changés, Serviettes de bain remplacées",
          "Nettoyage : Sol et surfaces nettoyés, Poussières éliminées",
          "Salle de bain : Lavabo et douche nettoyés, Toilettes désinfectées",
          "Consommables : Savon et shampoing complétés, Essuie-mains en place",
        ],
      },
      {
        type: "info",
        title: "Automatismes intelligents",
        text: "Le premier point coché de la check-list démarre automatiquement la tâche (statut « En cours »). Lorsque les 10 points sont tous cochés, la tâche passe automatiquement en « Terminée ». Plus besoin de changer manuellement le statut à chaque étape !",
      },
      {
        type: "feature",
        title: "Signalement de dommages et anomalies",
        items: [
          "Pour chaque point de la check-list, vous pouvez signaler un problème",
          "Un champ texte permet de décrire l'anomalie (tâche sur le mur, ampoule grillée...)",
          "Les anomalies sont enregistrées dans l'historique de la chambre",
          "Une tâche avec dommage signalé peut passer en statut « Besoin de réparation »",
        ],
      },
      {
        type: "info",
        title: "Attribution automatique au check-out",
        text: "Lorsqu'un client effectue un check-out, une tâche de ménage est automatiquement créée pour la chambre. Le système recherche le meilleur agent disponible en fonction de ses zones assignées et de son emploi du temps. Si aucun agent n'est disponible, la tâche est créée en « Non assignée » avec un avertissement.",
      },
      {
        type: "steps",
        title: "Attribuer une tâche manuellement",
        items: [
          "Cliquez sur la carte de la chambre concernée",
          "Ouvrez la boîte de dialogue d'attribution du personnel",
          "Sélectionnez un agent de ménage disponible dans la liste",
          "Définissez la priorité si nécessaire",
          "Confirmez l'attribution",
          "L'agent reçoit la tâche dans sa liste",
        ],
      },
      {
        type: "feature",
        title: "Statuts des tâches de ménage",
        items: [
          "En attente (pending) : tâche créée, en attente d'attribution ou de démarrage",
          "En cours (in_progress) : l'agent a commencé le nettoyage (démarrage auto au 1er point coché)",
          "Terminé (completed) : tous les points de la check-list sont cochés (complétion auto)",
          "Vérifié (verified) : un Gouvernant/Gouvernante a vérifié le travail",
          "Besoin de réparation (needs_repair) : un dommage a été signalé, une réparation est nécessaire",
        ],
      },
      {
        type: "feature",
        title: "Historique de nettoyage",
        items: [
          "Chaque chambre conserve un historique complet de ses nettoyages",
          "Date, agent assigné, durée, statut final, anomalies signalées",
          "Consultez l'historique pour suivre la qualité du ménage au fil du temps",
        ],
      },
      {
        type: "feature",
        title: "Panneau de configuration (Settings)",
        items: [
          "Onglet « Auto-assignation » : activer/désactiver, mode (zone ou rotation), démarrage automatique, priorité par défaut",
          "Onglet « Zones » : assigner chaque agent à des chambres ou étages spécifiques",
          "Onglet « Emploi du temps » : planifier les jours et heures de travail de chaque agent",
        ],
      },
      {
        type: "feature",
        title: "Modes d'attribution automatique",
        items: [
          "Par zone : les tâches sont assignées à l'agent responsable de la zone où se trouve la chambre",
          "Par rotation (round-robin) : les tâches sont réparties équitablement entre tous les agents disponibles",
        ],
      },
      {
        type: "warning",
        text: "Si l'auto-assignation est activée mais qu'aucun agent n'est disponible (pas dans la zone, pas sur son heure de travail, ou aucun agent configuré), la tâche est créée en « Non assignée » avec un avertissement visible. Assurez-vous de bien configurer vos agents, zones et emplois du temps.",
      },
      {
        type: "tip",
        text: "Configurez les zones de manière logique : par exemple, Agent 1 = étage 1, Agent 2 = étage 2. Cela permet au système d'assigner automatiquement les bonnes tâches aux bons agents après chaque check-out.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 9. DÉPENSES
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "expenses",
    icon: Receipt,
    title: "Dépenses",
    description: "Suivez toutes vos dépenses",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950",
    content: [
      {
        type: "paragraph",
        title: "Contrôlez vos coûts",
        text: "La section Dépenses vous permet d'enregistrer et de suivre toutes les dépenses liées à votre établissement. En les catégorisant et en les datant, vous obtenez une vue précise de vos coûts qui alimente vos statistiques financières.",
      },
      {
        type: "steps",
        title: "Enregistrer une dépense",
        items: [
          "Allez dans la section « Dépenses » via le menu",
          "Cliquez sur « + Nouvelle dépense »",
          "Sélectionnez la catégorie (voir liste ci-dessous)",
          "Saisissez le montant",
          "Choisissez la date de la dépense",
          "Ajoutez une description (détails du fournisseur, nature de l'achat...)",
          "Enregistrez",
        ],
      },
      {
        type: "feature",
        title: "Catégories de dépenses",
        items: [
          "Fournitures : produits d'accueil, linge, produits de nettoyage, papier toilette...",
          "Entretien : réparations, maintenance du bâtiment, équipements, jardinage...",
          "Alimentation : achats pour le restaurant (fruits, légumes, viandes, boissons...)",
          "Personnel : salaires, charges sociales, primes, formation...",
          "Services : électricité, eau, internet, assurance, téléphone...",
          "Marketing : publicité, site web, photos professionnelles, cartes de visite...",
          "Autre : toute dépense ne correspondant pas aux catégories ci-dessus",
        ],
      },
      {
        type: "feature",
        title: "Filtres et recherche",
        items: [
          "Filtrer par période : cette semaine, ce mois, ce trimestre, cette année ou période personnalisée",
          "Filtrer par catégorie : ne voir que les dépenses d'une catégorie spécifique",
          "Recherche textuelle : trouvez une dépense par sa description",
        ],
      },
      {
        type: "tip",
        text: "Enregistrez vos dépenses régulièrement (idéalement chaque jour ou chaque semaine) pour avoir une vue précise de vos coûts dans les statistiques. Un bon suivi des dépenses est la clé de la rentabilité.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 10. STATISTIQUES
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "statistics",
    icon: BarChart3,
    title: "Statistiques",
    description: "Comprenez votre activité",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950",
    content: [
      {
        type: "paragraph",
        title: "Les chiffres qui comptent",
        text: "Les statistiques vous donnent une vue d'ensemble de la performance de votre établissement. Vous y trouverez des indicateurs clés et des graphiques pour prendre les meilleures décisions et piloter votre activité.",
      },
      {
        type: "feature",
        title: "Sélecteur de période",
        items: [
          "Mode « Mois » : consultez les statistiques d'un mois spécifique, naviguez entre les mois",
          "Mode « Année » : consultez les statistiques d'une année complète avec un menu déroulant pour sélectionner l'année",
          "Bouton « Actualiser » : rechargez les données pour obtenir les dernières informations",
        ],
      },
      {
        type: "feature",
        title: "Indicateurs clés (KPI)",
        items: [
          "Taux d'occupation : pourcentage de chambres occupées par rapport au total disponible",
          "Revenus totaux : somme de toutes les factures payées sur la période",
          "Dépenses totales : somme de toutes les dépenses enregistrées sur la période",
          "Bénéfice net : revenus moins les dépenses (la vraie rentabilité)",
          "Durée moyenne de séjour : nombre moyen de nuits par réservation",
          "Nombre de réservations : total des réservations créées sur la période",
        ],
      },
      {
        type: "feature",
        title: "Graphiques disponibles",
        items: [
          "Sources de réservation : camembert montrant la répartition (Direct, Booking.com, Airbnb...)",
          "Performance par chambre : comparaison des revenus générés par chaque chambre",
          "Ces graphiques vous aident à comprendre quelles chambres et quels canaux sont les plus rentables",
        ],
      },
      {
        type: "steps",
        title: "Exporter les statistiques en PDF",
        items: [
          "Consultez les statistiques pour la période souhaitée",
          "Cliquez sur le bouton « Imprimer » ou utilisez Ctrl+P (Cmd+P sur Mac)",
          "Dans la boîte de dialogue d'impression, sélectionnez « Enregistrer au format PDF »",
          "Le PDF contient tous les indicateurs et graphiques de la page",
        ],
      },
      {
        type: "tip",
        text: "Consultez les statistiques chaque fin de mois pour analyser les tendances et planifier les mois suivants. Comparez les performances mois par mois ou année par année pour identifier les saisonnalités.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 11. NOTIFICATIONS
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    description: "Restez informé en temps réel",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950",
    content: [
      {
        type: "paragraph",
        title: "Soyez toujours au courant",
        text: "Le système de notifications vous tient informé en temps réel des événements importants de votre établissement. Une cloche dans l'en-tête de l'application affiche le nombre de notifications non lues, vous n'avez ainsi rien à manquer.",
      },
      {
        type: "feature",
        title: "Comment ça marche",
        items: [
          "Icône de cloche dans l'en-tête avec un badge rouge indiquant le nombre de notifications non lues",
          "Cliquez sur la cloche pour ouvrir le panneau de notifications (popover)",
          "Les notifications les plus récentes apparaissent en haut",
          "Le système interroge automatiquement les nouvelles notifications toutes les 30 secondes quand le panneau est fermé",
        ],
      },
      {
        type: "feature",
        title: "Types de notifications",
        items: [
          "Nouvelle réservation : un client vient de faire une réservation",
          "Check-in effectué : un client vient d'arriver",
          "Check-out effectué : un client vient de partir",
          "Annulation de réservation : une réservation a été annulée",
          "Nouvelle facture : une facture a été créée",
          "Nouvelle commande restaurant : une commande a été passée",
        ],
      },
      {
        type: "steps",
        title: "Gérer vos notifications",
        items: [
          "Marquer comme lue : cliquez sur une notification individuelle pour la marquer comme lue",
          "Tout marquer comme lu : cliquez sur le bouton « Tout lire » pour marquer toutes les notifications",
          "Supprimer une notification : cliquez sur l'icône de corbeille pour la supprimer définitivement",
          "Accéder à la page complète : cliquez sur « Voir toutes les notifications » pour accéder aux paramètres",
        ],
      },
      {
        type: "info",
        title: "Page des paramètres de notification",
        text: "La page Paramètres > Notifications vous donne accès à l'historique complet de toutes vos notifications. Vous pouvez y gérer, filtrer et supprimer les anciennes notifications en masse. C'est votre centre de gestion des alertes.",
      },
      {
        type: "tip",
        text: "Consultez vos notifications régulièrement pour ne pas manquer une nouvelle réservation ou un check-out à traiter. Le badge rouge sur la cloche vous rappelle qu'il y a des notifications en attente.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 12. PARAMÈTRES
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "settings",
    icon: Settings,
    title: "Paramètres",
    description: "Personnalisez votre espace",
    color: "text-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950",
    content: [
      {
        type: "paragraph",
        title: "Configurez votre établissement à votre image",
        text: "Les paramètres regroupent toutes les options pour personnaliser le fonctionnement du PMS selon vos besoins. C'est ici que vous configurez les informations légales, la facturation, l'équipe et les préférences d'affichage.",
      },
      {
        type: "feature",
        title: "Établissement",
        items: [
          "Nom de l'établissement : apparaît sur les factures et documents",
          "Description : texte de présentation de votre maison d'hôtes",
          "Informations de contact : email, téléphone, site web",
          "Adresse complète : rue, ville, code postal, pays",
          "Logo : upload d'image (JPG, PNG, WebP) — apparaît sur les factures et documents",
          "Devise : MAD, EUR, USD, GBP, CHF, XOF...",
          "Fuseau horaire : pour des dates et heures correctes",
          "Identifiants légaux : ICE, IF, CNSS (obligatoires pour les factures)",
          "Code de la maison d'hôtes (GH001) : attribué automatiquement, en lecture seule",
        ],
      },
      {
        type: "feature",
        title: "Facturation",
        items: [
          "Taxe de séjour : activation/désactivation, montant par adulte et par enfant",
          "Conditions de paiement : délais et modalités affichés sur les factures",
          "Ces paramètres affectent le calcul automatique lors de la création des factures",
        ],
      },
      {
        type: "feature",
        title: "Utilisateurs (réservé au Propriétaire)",
        items: [
          "Créer de nouveaux comptes avec nom, email et rôle",
          "Modifier les informations et le rôle d'un utilisateur existant",
          "Bloquer / Débloquer un utilisateur (empêche la connexion)",
          "Réinitialiser le mot de passe d'un utilisateur",
          "7 rôles disponibles avec permissions précises",
          "Cases à cocher pour définir l'accès au menu par utilisateur",
          "Remplissage automatique des accès pour les rôles de ménage",
        ],
      },
      {
        type: "feature",
        title: "Rôles et permissions",
        items: [
          "Vue d'ensemble de tous les rôles et leurs permissions",
          "Tableau récapitulatif des accès par section",
          "Consultez la section dédiée « Rôles et Permissions » pour les détails complets",
        ],
      },
      {
        type: "feature",
        title: "Profil personnel",
        items: [
          "Modifier votre nom d'affichage",
          "Changer votre photo de profil / avatar",
          "Changer votre mot de passe (accessible à tous les utilisateurs)",
        ],
      },
      {
        type: "feature",
        title: "Sécurité",
        items: [
          "Changement de mot de passe avec vérification de l'ancien",
          "Consultation des sessions actives (appareils connectés)",
          "Possibilité de déconnecter des sessions distantes",
        ],
      },
      {
        type: "feature",
        title: "Données",
        items: [
          "Gestion des données de votre établissement",
          "Import de données depuis un fichier externe",
          "Export de vos données pour sauvegarde ou migration",
        ],
      },
      {
        type: "feature",
        title: "Équipements",
        items: [
          "Gérer la liste complète des équipements disponibles pour les chambres",
          "Ajouter de nouveaux équipements (ex : Projecteur, Bouilloire, Peignoir...)",
          "Modifier ou supprimer des équipements existants",
          "Ces équipements sont proposés lors de la création/modification des chambres",
        ],
      },
      {
        type: "feature",
        title: "Aide",
        items: [
          "Lien vers ce guide d'utilisation",
          "Contact du support technique",
          "Numéro de version de l'application (actuellement v2.7.1)",
        ],
      },
      {
        type: "steps",
        title: "Configurer votre logo pour les factures",
        items: [
          "Allez dans Paramètres > Établissement",
          "Dans la section « Logo », cliquez sur « Télécharger »",
          "Sélectionnez votre image (JPG, PNG ou WebP)",
          "Le système compresse automatiquement l'image pour un chargement rapide",
          "Enregistrez les paramètres en cliquant sur « Sauvegarder »",
          "Le logo apparaîtra désormais sur toutes vos factures imprimées",
        ],
      },
      {
        type: "warning",
        text: "La section « Utilisateurs » n'est visible que par le Propriétaire. Les autres rôles ne peuvent pas accéder à la gestion des utilisateurs, même depuis les paramètres.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 13. RÔLES ET PERMISSIONS
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "roles",
    icon: Shield,
    title: "Rôles et Permissions",
    description: "Qui fait quoi dans l'application",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    content: [
      {
        type: "paragraph",
        title: "Pourquoi les rôles sont importants",
        text: "Dans votre établissement, plusieurs personnes travaillent ensemble avec des responsabilités différentes. Le système de rôles permet de donner à chaque personne accès uniquement aux fonctionnalités dont elle a besoin, sans risquer de modifier ou supprimer des données sensibles par erreur.",
      },
      {
        type: "paragraph",
        title: "Qui peut gérer les utilisateurs ?",
        text: "Seul le Propriétaire (Owner) a le droit de créer, modifier, bloquer, débloquer et supprimer des utilisateurs, ainsi que de réinitialiser leurs mots de passe. Les autres utilisateurs ne voient même pas la section « Utilisateurs » dans les paramètres.",
      },
      {
        type: "feature",
        title: "Propriétaire — Le chef d'orchestre",
        items: [
          "Accès total et illimité à TOUTES les fonctionnalités de l'application",
          "Peut créer, modifier, bloquer, débloquer et supprimer des utilisateurs",
          "Peut réinitialiser le mot de passe de n'importe quel utilisateur",
          "Peut modifier tous les paramètres de l'établissement",
          "Accès complet aux statistiques financières",
          "Peut supprimer des factures",
          "Il est recommandé d'avoir au moins 2 propriétaires pour éviter de perdre l'accès",
        ],
      },
      {
        type: "feature",
        title: "Gestionnaire — Le bras droit",
        items: [
          "Tableau de bord complet avec tous les indicateurs",
          "Gestion complète des chambres (créer, modifier, supprimer)",
          "Gestion complète des réservations (créer, modifier, annuler, check-in, check-out)",
          "Gestion complète des clients",
          "Gestion complète du restaurant (menu, commandes)",
          "Création et modification de factures",
          "Gestion des dépenses",
          "Accès aux statistiques",
          "Gestion du ménage (attribution, vérification)",
          "NE PEUT PAS : gérer les utilisateurs, les paramètres généraux",
        ],
      },
      {
        type: "feature",
        title: "Réceptionniste — L'accueil",
        items: [
          "Tableau de bord de base",
          "Voir l'état des chambres (disponibilité)",
          "Créer et modifier des réservations (check-in, check-out)",
          "Gérer les fiches clients",
          "Créer des factures simples",
          "NE PEUT PAS : supprimer des réservations ou des factures",
          "NE PEUT PAS : accéder au restaurant, aux dépenses, aux statistiques",
          "NE PEUT PAS : gérer les chambres ou les paramètres",
        ],
      },
      {
        type: "feature",
        title: "Comptable — Les chiffres",
        items: [
          "Tableau de bord avec indicateurs financiers",
          "Accès complet à la facturation (créer, modifier, supprimer, paiements)",
          "Voir les réservations (lecture seule)",
          "Gérer les dépenses",
          "Accès complet aux statistiques",
          "Voir les commandes restaurant (lecture seule)",
          "NE PEUT PAS : créer, modifier ou supprimer des réservations",
          "NE PEUT PAS : gérer les chambres, les clients ou les paramètres",
        ],
      },
      {
        type: "feature",
        title: "Femme de ménage — Le nettoyage",
        items: [
          "Accès limité au module Ménage uniquement",
          "Voir les tâches de nettoyage qui lui sont assignées",
          "Remplir la check-list de nettoyage (cocher les points)",
          "Signaler des dommages ou anomalies",
          "NE PEUT PAS : accéder au tableau de bord",
          "NE PEUT PAS : voir les clients, les factures ou les réservations",
          "NE PEUT PAS : accéder au restaurant, aux dépenses ou aux statistiques",
          "NE PEUT PAS : modifier les paramètres",
        ],
      },
      {
        type: "feature",
        title: "Gouvernant — Le responsable ménage",
        items: [
          "Tableau de bord de base",
          "Accès complet au module Ménage",
          "Attribuer et réattribuer les tâches de nettoyage",
          "Vérifier les tâches terminées (statut « Vérifié »)",
          "Consulter les statistiques de ménage",
          "NE PEUT PAS : accéder aux réservations, factures, clients",
          "NE PEUT PAS : accéder au restaurant, aux dépenses ou aux paramètres",
        ],
      },
      {
        type: "feature",
        title: "Gouvernante — La responsable ménage",
        items: [
          "Mêmes accès que le Gouvernant",
          "Accès complet au module Ménage",
          "Attribuer, vérifier et gérer les tâches de nettoyage",
          "Accès au tableau de bord de base",
          "Les accès au menu sont remplis automatiquement lors de l'attribution de ce rôle",
        ],
      },
      {
        type: "list",
        title: "Tableau récapitulatif des permissions",
        items: [
          "Propriétaire : Toutes les fonctionnalités sans exception + gestion des utilisateurs",
          "Gestionnaire : Tableau de bord, Chambres, Réservations, Clients, Factures, Restaurant, Dépenses, Statistiques, Ménage",
          "Réceptionniste : Tableau de bord (base), Chambres (vue), Réservations, Clients, Factures (création)",
          "Comptable : Tableau de bord, Réservations (vue), Factures, Dépenses, Statistiques, Restaurant (vue)",
          "Femme de ménage : Ménage (check-list uniquement)",
          "Gouvernant/Gouvernante : Tableau de bord (base), Ménage (complet avec vérification)",
        ],
      },
      {
        type: "tip",
        text: "Lorsque vous créez un utilisateur avec un rôle de Femme de ménage, Gouvernant ou Gouvernante, les cases d'accès au menu sont automatiquement remplies en fonction du rôle. Vous pouvez ensuite ajuster manuellement si besoin.",
      },
      {
        type: "warning",
        text: "Chaque utilisateur peut modifier son propre mot de passe depuis Paramètres > Profil > Sécurité, quel que soit son rôle. Après avoir créé un compte avec un mot de passe temporaire, demandez à l'utilisateur de le changer immédiatement.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 14. L'INTERFACE
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "interface",
    icon: Globe,
    title: "L'interface",
    description: "Astuces pour naviguer facilement",
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950",
    content: [
      {
        type: "feature",
        title: "Le menu latéral",
        items: [
          "Le menu sur la gauche vous donne accès à toutes les sections de l'application",
          "Chaque section a une icône colorée pour un repérage visuel rapide",
          "La section active est mise en surbrillance",
          "Cliquez sur la petite flèche en bas du menu pour le réduire (mode icônes uniquement)",
          "Quand le menu est réduit, survolez une icône pour voir le nom de la section dans une infobulle",
          "Cliquez à nouveau sur la flèche pour développer le menu",
        ],
      },
      {
        type: "feature",
        title: "Thème clair et sombre",
        items: [
          "Passez du mode clair au mode sombre (et inversement) selon vos préférences",
          "Cliquez sur votre avatar ou nom en bas du menu latéral",
          "Choisissez « Mode clair » ou « Mode sombre » dans le menu déroulant",
          "Le mode sombre est plus confortable pour les yeux en soirée ou dans les environnements sombres",
        ],
      },
      {
        type: "feature",
        title: "Navigation mobile",
        items: [
          "Sur mobile et tablette, le menu est accessible via le bouton hamburger (☰) en haut à gauche",
          "Le menu s'ouvre en superposition (overlay) pour une navigation tactile confortable",
          "Il se ferme automatiquement après avoir sélectionné une section",
        ],
      },
      {
        type: "feature",
        title: "Recherche et filtres",
        items: [
          "La plupart des pages ont une barre de recherche en haut pour trouver rapidement un élément",
          "Les filtres (pastilles, menus déroulants) permettent d'affiner les résultats par statut, date, catégorie...",
          "Combinez la recherche et les filtres pour des résultats précis",
          "Les compteurs sur les pastilles de filtre indiquent le nombre d'éléments par catégorie",
        ],
      },
      {
        type: "feature",
        title: "Notifications en temps réel",
        items: [
          "L'icône de cloche dans l'en-tête affiche les notifications non lues",
          "Le badge rouge indique le nombre de notifications en attente",
          "Cliquez sur la cloche pour ouvrir le panneau de notifications",
        ],
      },
      {
        type: "tip",
        text: "Sur ordinateur, gardez le menu développé pour une navigation rapide entre les sections. Sur tablette, le menu semi-réduit offre un bon compromis entre espace et accessibilité.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 15. GLOSSAIRE
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "glossary",
    icon: HelpCircle,
    title: "Glossaire",
    description: "Les termes techniques expliqués simplement",
    color: "text-slate-600",
    bgColor: "bg-slate-50 dark:bg-slate-950",
    content: [
      {
        type: "feature",
        title: "Termes courants de l'hôtellerie",
        items: [
          "PMS (Property Management System) : Logiciel de gestion d'établissement hôtelier. C'est le nom générique de ce type d'application.",
          "Check-in : L'action d'accueillir un client qui arrive. La chambre passe en « Occupée ».",
          "Check-out : L'action de libérer une chambre quand le client part. La chambre repasse en « Disponible ».",
          "No-show : Un client qui avait réservé mais qui ne s'est pas présenté sans annuler.",
          "Taxe de séjour : Un impôt collecté par l'établissement pour le compte de la collectivité, calculé par nuitée et par personne.",
          "TVA (Taxe sur la Valeur Ajoutée) : Un impôt indirect appliqué sur le prix des services.",
          "Taux d'occupation : Le pourcentage de chambres occupées par rapport au nombre total de chambres disponibles.",
          "ICE (Identifiant Commun des Entreprises) : Un numéro d'identification fiscale unique au Maroc, composé de 15 chiffres.",
          "IF (Identification Fiscale) : Un numéro d'identification attribué par l'administration fiscale.",
          "CNSS (Caisse Nationale de Sécurité Sociale) : Un organisme qui gère la sécurité sociale et les assurances des employés.",
          "Room Service : Service de livraison de repas directement dans la chambre du client.",
          "Check-list : Une liste de points à vérifier ou à accomplir, utilisée notamment pour le ménage.",
          "KPI (Key Performance Indicator) : Indicateur clé de performance. Exemple : le taux d'occupation est un KPI.",
        ],
      },
      {
        type: "tip",
        text: "Retrouvez ce glossaire à tout moment en revenant sur cette page. Si un terme n'est pas expliqué ici, n'hésitez pas à contacter le support depuis Paramètres > Aide.",
      },
    ],
  },
]

// ─── Search Component ────────────────────────────────────────────────────────

function GuideSearch({ query, setQuery, results, onSelect }: {
  query: string
  setQuery: (q: string) => void
  results: { sectionId: string; sectionTitle: string; match: string }[]
  onSelect: (sectionId: string) => void
}) {
  return (
    <div className="relative max-w-xl mx-auto">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Rechercher dans le guide... (ex: facture, réservation, ménage...)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-12 h-12 text-base rounded-xl bg-background"
      />
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background rounded-xl border shadow-lg z-10 max-h-64 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => { onSelect(r.sectionId); setQuery("") }}
              className="w-full text-left px-4 py-3 hover:bg-muted/50 flex items-center gap-3 transition-colors border-b last:border-0"
            >
              <FileText className="w-4 h-4 text-sky-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.sectionTitle}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{r.match}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Content Renderer ────────────────────────────────────────────────────────

function ContentBlock({ block }: { block: GuideContent }) {
  if (block.type === "paragraph") {
    return (
      <div className="space-y-2">
        {block.title && <h4 className="font-semibold text-base">{block.title}</h4>}
        {block.text && <p className="text-muted-foreground leading-relaxed">{block.text}</p>}
      </div>
    )
  }

  if (block.type === "steps") {
    return (
      <div className="space-y-3">
        {block.title && <h4 className="font-semibold text-base">{block.title}</h4>}
        <ol className="space-y-2">
          {block.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  if (block.type === "tip") {
    return (
      <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800">
        <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-800 dark:text-emerald-200">{block.text}</p>
      </div>
    )
  }

  if (block.type === "warning") {
    return (
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-200 dark:border-amber-800">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-200">{block.text}</p>
      </div>
    )
  }

  if (block.type === "info") {
    return (
      <div className="flex items-start gap-3 p-4 bg-sky-50 dark:bg-sky-950/50 rounded-xl border border-sky-200 dark:border-sky-800">
        <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          {block.title && <p className="text-sm font-semibold text-sky-800 dark:text-sky-200 mb-1">{block.title}</p>}
          {block.text && <p className="text-sm text-sky-700 dark:text-sky-300">{block.text}</p>}
        </div>
      </div>
    )
  }

  if (block.type === "feature") {
    return (
      <div className="space-y-3">
        {block.title && <h4 className="font-semibold text-base">{block.title}</h4>}
        <ul className="space-y-2">
          {block.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (block.type === "list") {
    return (
      <div className="space-y-3">
        {block.title && <h4 className="font-semibold text-base">{block.title}</h4>}
        <ul className="space-y-2">
          {block.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return null
}

// ─── Section Card ────────────────────────────────────────────────────────────

function SectionCard({ section, isExpanded, onToggle }: {
  section: GuideSection
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      isExpanded && "ring-2 ring-sky-200 dark:ring-sky-800 shadow-md"
    )}>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", section.bgColor)}>
            <section.icon className={cn("w-5 h-5", section.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{section.title}</CardTitle>
            <CardDescription className="text-sm">{section.description}</CardDescription>
          </div>
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 pb-6">
          <Separator className="mb-6" />
          <div className="space-y-6">
            {section.content.map((block, i) => (
              <ContentBlock key={i} block={block} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ─── Main Guide Page ────────────────────────────────────────────────────────

export default function GuidePage() {
  const [expandedSection, setExpandedSection] = useState<string>("introduction")
  const [expandedAll, setExpandedAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const searchResults = searchQuery.length >= 2
    ? guideSections.flatMap((section) =>
        section.content
          .filter((block) =>
            block.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            block.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            block.items?.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .map((block) => ({
            sectionId: section.id,
            sectionTitle: section.title,
            match: block.title || block.text || block.items?.[0] || "",
          }))
      )
    : []

  const scrollToSection = (sectionId: string) => {
    setExpandedSection(sectionId)
    setExpandedAll(false)
    setTimeout(() => {
      document.getElementById(`guide-section-${sectionId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 100)
  }

  const toggleExpandAll = () => {
    if (expandedAll) {
      setExpandedSection("introduction")
      setExpandedAll(false)
    } else {
      setExpandedSection("__all__")
      setExpandedAll(true)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            Guide d&apos;utilisation
          </h1>
          <p className="text-muted-foreground">
            Tout ce que vous devez savoir pour utiliser PMS Guest House v2.7.1
          </p>
        </div>
      </div>

      {/* Version badge */}
      <div className="flex items-center justify-center gap-3">
        <Badge variant="outline" className="text-xs font-mono">
          <Sparkles className="w-3 h-3 mr-1" />
          Version 2.7.1 — PMS Guest House
        </Badge>
      </div>

      {/* Search */}
      <GuideSearch
        query={searchQuery}
        setQuery={setSearchQuery}
        results={searchResults}
        onSelect={scrollToSection}
      />

      {/* Expand/Collapse all + Quick navigation chips */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Navigation rapide</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleExpandAll}
            className="text-xs"
          >
            {expandedAll ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 mr-1.5" />
                Tout réduire
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 mr-1.5" />
                Tous développer
              </>
            )}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {guideSections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                expandedAll || expandedSection === section.id
                  ? `${section.bgColor} ${section.color} border-current/20`
                  : "bg-background text-muted-foreground border-border hover:bg-muted/50"
              )}
            >
              <section.icon className="w-3.5 h-3.5" />
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {guideSections.map((section) => (
          <div key={section.id} id={`guide-section-${section.id}`}>
            <SectionCard
              section={section}
              isExpanded={expandedAll || expandedSection === section.id}
              onToggle={() => {
                setExpandedAll(false)
                setExpandedSection(
                  expandedSection === section.id ? "" : section.id
                )
              }}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t">
        <p className="text-sm text-muted-foreground mb-2">
          Vous avez une question qui n&apos;est pas dans ce guide ?
        </p>
        <p className="text-sm text-muted-foreground">
          Contactez le support technique depuis la section{" "}
          <Link href="/app/settings/help" className="text-sky-600 hover:underline font-medium">
            Aide
          </Link>
        </p>
        <p className="text-xs text-muted-foreground mt-4 font-mono">
          PMS Guest House v2.7.1
        </p>
      </div>
    </div>
  )
}
