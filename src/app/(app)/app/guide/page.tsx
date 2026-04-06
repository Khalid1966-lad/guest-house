"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  Users,
  CreditCard,
  UtensilsCrossed,
  Receipt,
  BarChart3,
  Settings,
  HelpCircle,
  Search,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  BookOpen,
  Star,
  Zap,
  Shield,
  Printer,
  FileText,
  Download,
  Upload,
  Eye,
  Plus,
  Trash2,
  Edit,
  Mail,
  Phone,
  Globe,
  Moon,
  Sun,
  Bell,
  User,
  UsersRound,
  Hotel,
  TrendingUp,
  DollarSign,
  Clock,
  MapPin,
  Camera,
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
  type: "paragraph" | "steps" | "tip" | "warning" | "feature" | "list"
  title?: string
  items?: string[]
  text?: string
  icon?: LucideIcon
}

const guideSections: GuideSection[] = [
  {
    id: "introduction",
    icon: BookOpen,
    title: "Bienvenue",
    description: "Découvrez votre outil de gestion",
    color: "text-sky-600",
    bgColor: "bg-sky-50 dark:bg-sky-950",
    content: [
      {
        type: "paragraph",
        title: "Qu'est-ce que PMS Guest House ?",
        text: "PMS Guest House est votre assistant de gestion tout-en-un pour les maisons d'hôtes. Il vous aide à gérer vos réservations, vos clients, vos factures, votre restaurant et bien plus encore, le tout depuis un seul endroit.",
      },
      {
        type: "feature",
        title: "Ce que vous pouvez faire",
        items: [
          "Gérer vos chambres et leur disponibilité en temps réel",
          "Créer et suivre les réservations de vos clients",
          "Facturer automatiquement les séjours et les services",
          "Gérer les commandes du restaurant",
          "Suivre vos dépenses et vos revenus",
          "Consulter des statistiques détaillées",
          "Personnaliser les paramètres de votre établissement",
        ],
      },
      {
        type: "tip",
        text: "Utilisez le menu sur la gauche pour naviguer entre les différentes sections. Vous pouvez le réduire en cliquant sur la petite flèche pour ne garder que les icônes !",
      },
    ],
  },
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
        text: "Le tableau de bord est la première page que vous voyez en vous connectant. Il vous donne un aperçu instantané de l'état de votre maison d'hôtes : combien de chambres sont occupées, les arrivées et départs du jour, les réservations en attente, etc.",
      },
      {
        type: "feature",
        title: "Ce que vous y trouvez",
        items: [
          "Le nombre de chambres occupées, libres et en maintenance",
          "Les arrivées et départs prévus pour aujourd'hui",
          "Les réservations récentes et leur statut",
          "Un résumé financier rapide (revenus, dépenses)",
          "La liste des tâches à effectuer (check-in, check-out...)",
        ],
      },
      {
        type: "tip",
        text: "Regardez le tableau de bord chaque matin pour planifier votre journée. Les indicateurs colorés vous alertent immédiatement sur ce qui nécessite votre attention.",
      },
    ],
  },
  {
    id: "rooms",
    icon: BedDouble,
    title: "Gestion des Chambres",
    description: "Créez et organisez vos chambres",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950",
    content: [
      {
        type: "paragraph",
        title: "Comment ça fonctionne",
        text: "La section Chambres vous permet de créer et gérer toutes les chambres de votre établissement. Chaque chambre a un numéro unique, un type (standard, confort, suite...), une capacité, un prix de base et des équipements.",
      },
      {
        type: "steps",
        title: "Ajouter une nouvelle chambre",
        items: [
          "Cliquez sur le bouton « + Nouvelle chambre » en haut de la page",
          "Remplissez le numéro de la chambre (ex: 101, Chambre Bleue...)",
          "Choisissez le type : Standard, Confort, Suite, Familiale...",
          "Indiquez la capacité (nombre de personnes) et le nombre de lits",
          "Définissez le prix par nuit",
          "Ajoutez une description et des équipements (Wi-Fi, climatisation, TV...)",
          "Cliquez sur « Créer » pour enregistrer",
        ],
      },
      {
        type: "feature",
        title: "Fonctionnalités avancées",
        items: [
          "Prix week-end différent du prix en semaine",
          "Gestion des lits supplémentaires et des lits bébé",
          "Photos de la chambre",
          "Tarifs spéciaux par période (haute saison, événements...)",
          "Statut de la chambre : Disponible, Occupée, Maintenance, Nettoyage",
        ],
      },
      {
        type: "tip",
        text: "Utilisez des numéros de chambre logiques (101 pour le 1er étage, chambre 1) pour vous retrouver facilement. Ajoutez des photos pour aider vos clients à choisir.",
      },
    ],
  },
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
        text: "Les réservations sont l'élément central du PMS. C'est ici que vous enregistrez chaque séjour de vos clients, du premier contact jusqu'au départ.",
      },
      {
        type: "steps",
        title: "Créer une réservation",
        items: [
          "Cliquez sur « + Nouvelle réservation »",
          "Sélectionnez le client (ou créez-le directement s'il est nouveau)",
          "Choisissez la chambre souhaitée parmi celles disponibles",
          "Définissez les dates d'arrivée et de départ",
          "Indiquez le nombre d'adultes et d'enfants",
          "Le système calcule automatiquement le nombre de nuits et le prix total",
          "Si besoin, ajoutez des lits supplémentaires ou un lit bébé",
          "Enregistrez la réservation",
        ],
      },
      {
        type: "steps",
        title: "Check-in et Check-out",
        items: [
          "Le jour de l'arrivée, trouvez la réservation dans la liste",
          "Cliquez sur « Check-in » pour confirmer l'arrivée du client",
          "La chambre passe automatiquement en statut « Occupée »",
          "Le jour du départ, cliquez sur « Check-out »",
          "Vous pouvez ensuite créer une facture depuis la réservation",
        ],
      },
      {
        type: "feature",
        title: "Statuts des réservations",
        items: [
          "Confirmée : la réservation est validée",
          "En cours : le client est actuellement dans l'établissement",
          "Terminée : le client est parti",
          "Annulée : la réservation a été annulée",
          "No-show : le client ne s'est pas présenté",
        ],
      },
      {
        type: "warning",
        text: "Vérifiez toujours la disponibilité de la chambre avant de créer une réservation. Le système vous avertit en cas de conflit de dates, mais une vérification humaine est toujours recommandée.",
      },
    ],
  },
  {
    id: "guests",
    icon: Users,
    title: "Gestion des Clients",
    description: "Votre carnet d'adresses intelligent",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950",
    content: [
      {
        type: "paragraph",
        title: "Pourquoi c'est utile",
        text: "La section Clients est votre base de données de tous les visiteurs. En conservant les informations de vos clients, vous pouvez les retrouver facilement, comprendre leurs préférences et offrir un service personnalisé.",
      },
      {
        type: "steps",
        title: "Ajouter un nouveau client",
        items: [
          "Allez dans la section « Clients » via le menu",
          "Cliquez sur « + Nouveau client »",
          "Remplissez les informations de base : nom, prénom, email, téléphone",
          "Ajoutez l'adresse si nécessaire",
          "Indiquez la nationalité et les pièces d'identité (passeport, CIN...)",
          "Enregistrez le client",
        ],
      },
      {
        type: "feature",
        title: "Informations utiles à garder",
        items: [
          "Nom et prénom (obligatoires)",
          "Email et téléphone (pour les rappels de réservation)",
          "Nationalité et numéro de pièce d'identité (pour les formalités)",
          "Préférences (chambre calme, étage élevé, régime alimentaire...)",
          "Notes personnelles (ex: « aime la chambre avec vue jardin »)",
        ],
      },
      {
        type: "tip",
        text: "Vous pouvez créer un client directement depuis le formulaire de réservation si c'est sa première visite. Les informations seront automatiquement sauvegardées dans la base de clients.",
      },
    ],
  },
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
        title: "Gérez vos factures facilement",
        text: "La facturation vous permet de créer des factures professionnelles pour vos clients. Vous pouvez les lier à une réservation existante ou créer des factures independantes pour des services supplémentaires.",
      },
      {
        type: "steps",
        title: "Créer une facture depuis une réservation",
        items: [
          "Dans la liste des réservations, trouvez le séjour concerné",
          "Le système vous proposera d'importer automatiquement les frais du séjour",
          "Les articles sont pré-remplis (description, quantité, prix)",
          "Vérifiez et ajustez si nécessaire",
          "Ajoutez la taxe de séjour si applicable",
          "Enregistrez la facture",
        ],
      },
      {
        type: "steps",
        title: "Imprimer ou exporter une facture",
        items: [
          "Ouvrez la facture en cliquant dessus dans la liste",
          "Cliquez sur « Imprimer » pour l'imprimer directement",
          "Ou cliquez sur « Aperçu avant impression » pour la voir dans un nouvel onglet",
          "La facture s'affiche avec votre logo et vos informations légales",
        ],
      },
      {
        type: "feature",
        title: "Votre facture contient",
        items: [
          "Le logo et le nom de votre établissement (agrandi)",
          "Le numéro et la date de la facture",
          "Les informations du client",
          "Le détail de chaque prestation (description, quantité, prix)",
          "Les totaux : sous-total, TVA, taxe de séjour, total",
          "Les identifiants légaux : ICE, IF, CNSS",
        ],
      },
      {
        type: "tip",
        text: "Configurez votre logo et vos identifiants légaux (ICE, IF, CNSS) dans Paramètres > Établissement pour qu'ils apparaissent automatiquement sur toutes vos factures.",
      },
    ],
  },
  {
    id: "restaurant",
    icon: UtensilsCrossed,
    title: "Restaurant",
    description: "Gérez le menu et les commandes",
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    content: [
      {
        type: "paragraph",
        title: "Module restaurant intégré",
        text: "Si votre maison d'hôtes propose de la restauration, ce module vous permet de gérer votre carte (menu), de prendre des commandes et de les suivre jusqu'à la livraison.",
      },
      {
        type: "feature",
        title: "Gestion du menu",
        items: [
          "Créez des catégories (Entrées, Plats, Desserts, Boissons...)",
          "Ajoutez chaque item avec son prix, sa description et sa photo",
          "Indiquez les allergènes et les options végétariennes/véganes",
          "Activez ou désactivez des plats selon la disponibilité",
          "Organisez l'ordre d'affichage des plats",
        ],
      },
      {
        type: "steps",
        title: "Prendre une commande",
        items: [
          "Cliquez sur « + Nouvelle commande »",
          "Sélectionnez la chambre ou le client",
          "Ajoutez les plats souhaités et les quantités",
          "Validez la commande",
          "Suivez son statut : En attente > En préparation > Prête > Livrée",
        ],
      },
      {
        type: "tip",
        text: "Activez ou désactivez le module restaurant dans Paramètres > Établissement > onglet Restaurant selon vos besoins.",
      },
    ],
  },
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
        text: "La section Dépenses vous permet d'enregistrer et de suivre toutes les dépenses liées à votre établissement : fournitures, entretien, salaires, services, etc.",
      },
      {
        type: "feature",
        title: "Catégories de dépenses",
        items: [
          "Fournitures : produits d'accueil, linge, produits de nettoyage...",
          "Entretien : réparations, maintenance du bâtiment et des équipements",
          "Alimentation : achats pour le restaurant",
          "Personnel : salaires et charges sociales",
          "Services : électricité, eau, internet, assurance...",
          "Marketing : publicité, site web, photos...",
        ],
      },
      {
        type: "tip",
        text: "Enregistrez vos dépenses régulièrement (idéalement chaque jour ou chaque semaine) pour avoir une vue précise de vos coûts dans les statistiques.",
      },
    ],
  },
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
        text: "Les statistiques vous donnent une vue d'ensemble de la performance de votre établissement. Vous y trouverez des graphiques et des indicateurs clés pour prendre les meilleures décisions.",
      },
      {
        type: "feature",
        title: "Indicateurs disponibles",
        items: [
          "Taux d'occupation : le pourcentage de chambres remplies",
          "Revenus totaux : ce que votre établissement a gagné",
          "Dépenses totales : ce que vous avez dépensé",
          "Bénéfice net : revenus moins les dépenses",
          "Durée moyenne de séjour : combien de temps restent vos clients",
          "Répartition par source : d'où viennent vos réservations",
          "Performance par chambre : quelle chambre rapporte le plus",
        ],
      },
      {
        type: "tip",
        text: "Consultez les statistiques chaque fin de mois pour analyser les tendances et planifier les mois suivants. Utilisez les filtres de période pour comparer les performances.",
      },
    ],
  },
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
        text: "Les paramètres regroupent toutes les options pour personnaliser le fonctionnement du PMS selon vos besoins spécifiques.",
      },
      {
        type: "feature",
        title: "Paramètres de l'établissement",
        items: [
          "Informations générales : nom, description, email, téléphone, site web",
          "Adresse : adresse complète, ville, code postal, pays",
          "Logo : le logo apparaît sur les factures et documents imprimés",
          "Devise : EUR, USD, GBP, MAD, CHF, XOF...",
          "Fuseau horaire : pour des dates et heures correctes",
          "ICE, IF, CNSS : identifiants légaux pour vos factures",
        ],
      },
      {
        type: "feature",
        title: "Paramètres de réservation",
        items: [
          "Heures d'arrivée et de départ par défaut",
          "Délai minimum de pré-avis pour une réservation",
          "Délai maximum de réservation à l'avance",
          "Politique d'annulation personnalisée",
        ],
      },
      {
        type: "feature",
        title: "Paramètres de facturation",
        items: [
          "Taux de taxe de séjour par adulte et par enfant",
          "Activation de la taxe de séjour",
          "Identifiants fiscaux (ICE, IF, CNSS)",
        ],
      },
      {
        type: "feature",
        title: "Mon profil",
        items: [
          "Modifier votre nom et votre photo de profil",
          "Changer votre mot de passe",
          "Choisir la langue et le thème (clair/sombre)",
        ],
      },
      {
        type: "feature",
        title: "Gestion des utilisateurs et rôles",
        items: [
          "Seul le Propriétaire peut créer, modifier, bloquer et supprimer des utilisateurs",
          "5 rôles disponibles : Propriétaire, Gestionnaire, Réceptionniste, Comptable, Ménage",
          "Chaque rôle a des permissions précises et adaptées à sa fonction",
          "Consultez la section « Rôles et Permissions » ci-dessous pour les détails complets",
        ],
      },
      {
        type: "steps",
        title: "Configurer votre logo pour les factures",
        items: [
          "Allez dans Paramètres > Établissement",
          "Dans la section « Logo », cliquez sur « Télécharger »",
          "Sélectionnez votre image (JPG, PNG ou WebP)",
          "Le système compresse automatiquement l'image",
          "Enregistrez les paramètres en cliquant sur « Sauvegarder »",
        ],
      },
    ],
  },
  {
    id: "roles",
    icon: Shield,
    title: "Rôles et Permissions",
    description: "Comprenez qui fait quoi dans l'application",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    content: [
      {
        type: "paragraph",
        title: "Pourquoi les rôles sont importants",
        text: "Dans une maison d'hôtes, plusieurs personnes travaillent ensemble avec des responsabilités différentes. Le système de rôles permet de donner à chaque personne accès uniquement aux fonctionnalités dont elle a besoin pour travailler, sans risquer de modifier ou supprimer des données sensibles par erreur.",
      },
      {
        type: "paragraph",
        title: "Qui peut gérer les utilisateurs ?",
        text: "Seul le Propriétaire (Owner) a le droit de créer, modifier, bloquer, débloquer, supprimer des utilisateurs et réinitialiser leurs mots de passe. C'est le seul rôle avec un accès complet à la gestion de l'équipe. Les autres utilisateurs ne voient même pas la section « Utilisateurs » dans les paramètres.",
      },
      {
        type: "paragraph",
        title: "Profil personnel et mot de passe",
        text: "Chaque utilisateur, quel que soit son rôle, peut consulter son propre profil et modifier son mot de passe depuis Paramètres > Mon Compte. Cette fonctionnalité est accessible à tous les membres de l'équipe.",
      },
      {
        type: "feature",
        title: "👑 Propriétaire (Owner)",
        items: [
          "Accès total et illimité à toutes les fonctionnalités de l'application",
          "Peut créer, modifier, bloquer, débloquer et supprimer des utilisateurs",
          "Peut réinitialiser le mot de passe de n'importe quel utilisateur",
          "Peut créer, modifier et supprimer des rôles personnalisés",
          "Peut modifier tous les paramètres de l'établissement",
          "Accès aux statistiques financières complètes",
          "Peut appliquer des remises et effectuer des remboursements",
          "Seul rôle autorisé à gérer les utilisateurs et les rôles",
          "Impossible de se supprimer soi-même ou de supprimer le dernier propriétaire",
        ],
      },
      {
        type: "tip",
        text: "Il est recommandé d'avoir au moins 2 propriétaires dans l'établissement pour éviter de perdre l'accès administratif si le compte principal est bloqué.",
      },
      {
        type: "feature",
        title: "💼 Gestionnaire (Manager)",
        items: [
          "Voit le tableau de bord et toutes les statistiques",
          "Peut gérer les réservations (créer, modifier, annuler)",
          "Peut gérer les clients et leurs informations",
          "Peut gérer les chambres (ajouter, modifier)",
          "Peut gérer le restaurant et les commandes",
          "Peut créer et modifier des factures",
          "Peut gérer les dépenses",
          "Accès aux revenus et peut appliquer des remises",
          "NE PEUT PAS : gérer les utilisateurs, les rôles ou les paramètres",
        ],
      },
      {
        type: "feature",
        title: "🎧 Réceptionniste (Receptionist)",
        items: [
          "Voit le tableau de bord de base",
          "Peut voir l'état des chambres (disponibilité)",
          "Peut créer et modifier des réservations",
          "Peut gérer les fiches clients",
          "Peut créer des factures simples (sans modification)",
          "NE PEUT PAS : supprimer des réservations ou factures",
          "NE PEUT PAS : accéder au restaurant, dépenses, statistiques",
          "NE PEUT PAS : gérer les chambres, les paramètres",
          "Rôle idéal pour l'accueil et le service client",
        ],
      },
      {
        type: "feature",
        title: "🧮 Comptable (Accountant)",
        items: [
          "Voit le tableau de bord et les statistiques financières",
          "Accès complet à la facturation (créer, modifier, supprimer)",
          "Peut voir les réservations (lecture seule)",
          "Peut gérer les dépenses",
          "Accès aux revenus et peut appliquer des remises",
          "Peut voir le restaurant (lectures des commandes)",
          "NE PEUT PAS : créer, modifier ou supprimer des réservations",
          "NE PEUT PAS : gérer les chambres ou les clients",
          "NE PEUT PAS : accéder aux paramètres ou utilisateurs",
          "Rôle idéal pour la comptabilité et le suivi financier",
        ],
      },
      {
        type: "feature",
        title: "✨ Personnel Ménage (Housekeeping)",
        items: [
          "Voit les chambres et leur état en temps réel",
          "Peut voir les réservations (pour planifier les nettoyages)",
          "Peut gérer les chambres (changer le statut : nettoyage, disponible...)",
          "Peut voir les commandes restaurant (pour le room service)",
          "NE PEUT PAS : accéder au tableau de bord",
          "NE PEUT PAS : voir les clients ou factures",
          "NE PEUT PAS : gérer les réservations ou les dépenses",
          "NE PEUT PAS : accéder aux statistiques ou paramètres",
          "Rôle idéal pour l'équipe de ménage et d'entretien",
        ],
      },
      {
        type: "feature",
        title: "🌐 Super Administrateur",
        items: [
          "Rôle spécial réservé à l'administrateur de la plateforme",
          "Gère les maisons d'hôtes (création, activation, blocage)",
          "N'appartient pas à un établissement spécifique",
          "Accès au panneau d'administration global",
          "Ce rôle n'est pas assignable depuis l'interface",
        ],
      },
      {
        type: "steps",
        title: "Comment le Propriétaire gère les utilisateurs",
        items: [
          "Cliquez sur « Utilisateurs » dans le menu latéral (visible uniquement par le Propriétaire)",
          "Ou allez dans Paramètres > Utilisateurs",
          "Cliquez sur « Ajouter un utilisateur » pour créer un nouveau compte",
          "Remplissez le nom, prénom, email et choisissez un rôle",
          "Définissez un mot de passe temporaire (minimum 6 caractères)",
          "L'utilisateur recevra un compte actif immédiatement",
          "Pour bloquer un utilisateur : cliquez sur les 3 points > « Bloquer »",
          "Pour réinitialiser un mot de passe : cliquez sur les 3 points > « Réinitialiser le mot de passe »",
          "Pour modifier le rôle : cliquez sur « Modifier » et changez le rôle",
          "Communiquez le mot de passe temporaire à l'utilisateur en personne ou par un canal sécurisé",
        ],
      },
      {
        type: "warning",
        text: "Lorsque vous bloquez un utilisateur, il ne peut plus se connecter à l'application. Ses données (réservations, factures créées) restent intactes. Pour lui redonner l'accès, utilisez l'option « Débloquer ».",
      },
      {
        type: "tip",
        text: "Après avoir créé un compte avec un mot de passe temporaire, demandez à l'utilisateur de le changer immédiatement depuis Paramètres > Mon Compte > Sécurité.",
      },
      {
        type: "paragraph",
        title: "Tableau récapitulatif des permissions",
        text: "Voici un aperçu rapide des accès par rôle. Le Propriétaire a TOUJOURS tous les accès sans exception.",
      },
      {
        type: "list",
        title: "Accès par rôle",
        items: [
          "Propriétaire : ✅ Tout (tableau de bord, chambres, réservations, clients, factures, restaurant, dépenses, statistiques, paramètres, utilisateurs, rôles)",
          "Gestionnaire : ✅ Tableau de bord, chambres, réservations, clients, factures, restaurant, dépenses, statistiques | ❌ Paramètres, utilisateurs, rôles",
          "Réceptionniste : ✅ Tableau de bord, chambres (vue), réservations, clients, factures (création) | ❌ Restaurant, dépenses, statistiques, paramètres, utilisateurs",
          "Comptable : ✅ Tableau de bord, réservations (vue), clients (vue), factures, restaurant (vue), dépenses, statistiques | ❌ Chambres, paramètres, utilisateurs",
          "Ménage : ✅ Chambres, réservations (vue), restaurant (vue) | ❌ Tableau de bord, clients, factures, dépenses, statistiques, paramètres, utilisateurs",
        ],
      },
    ],
  },
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
          "Le menu sur la gauche vous donne accès à toutes les sections",
          "Cliquez sur la petite flèche pour le réduire et ne voir que les icônes",
          "Quand le menu est réduit, survolez une icône pour voir le nom de la section",
          "Cliquez à nouveau sur la flèche pour développer le menu",
        ],
      },
      {
        type: "feature",
        title: "Thème clair et sombre",
        items: [
          "Cliquez sur votre nom en bas du menu latéral",
          "Choisissez « Mode clair » ou « Mode sombre »",
          "Le mode sombre est plus confortable pour les yeux en soirée",
        ],
      },
      {
        type: "feature",
        title: "Recherche et filtres",
        items: [
          "La plupart des pages ont une barre de recherche en haut",
          "Utilisez les filtres pour affiner les résultats (par statut, date...)",
          "Les boutons colorés (pastilles) filtrent rapidement par catégorie",
        ],
      },
      {
        type: "tip",
        text: "Sur mobile, le menu est accessible via le bouton hamburger (trois barres) en haut à gauche. Il s'ouvre en glissant depuis le bord gauche de l'écran.",
      },
    ],
  },
  {
    id: "glossary",
    icon: BookOpen,
    title: "Glossaire",
    description: "Les termes techniques expliqués simplement",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    content: [
      {
        type: "feature",
        title: "Termes courants",
        items: [
          "PMS : Property Management System — Système de gestion d'établissement",
          "Check-in : L'arrivée du client dans l'établissement",
          "Check-out : Le départ du client de l'établissement",
          "ICE : Identifiant Commun des Entreprises — numéro d'identification marocain de 15 chiffres",
          "IF : Identification Fiscale — numéro d'identification fiscale",
          "CNSS : Caisse Nationale de Sécurité Sociale — numéro de sécurité sociale",
          "Taxe de séjour : Impôt collecté par l'établissement pour chaque nuitée",
          "TVA : Taxe sur la Valeur Ajoutée",
          "No-show : Client qui a réservé mais ne s'est pas présenté",
          "Taux d'occupation : Pourcentage de chambres occupées par rapport au total",
        ],
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
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <Input
        type="text"
        placeholder="Rechercher dans le guide... (ex: facture, réservation, chambre...)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-12 h-12 text-base rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
      />
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl border shadow-lg z-10 max-h-64 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => { onSelect(r.sectionId); setQuery("") }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors border-b last:border-0"
            >
              <FileText className="w-4 h-4 text-sky-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{r.sectionTitle}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{r.match}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
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
        {block.text && <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{block.text}</p>}
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
              <span className="text-gray-600 dark:text-gray-400">{item}</span>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  if (block.type === "tip") {
    return (
      <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950 rounded-xl border border-emerald-200 dark:border-emerald-800">
        <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-800 dark:text-emerald-200">{block.text}</p>
      </div>
    )
  }

  if (block.type === "warning") {
    return (
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950 rounded-xl border border-amber-200 dark:border-amber-800">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-200">{block.text}</p>
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
              <span className="text-gray-600 dark:text-gray-400">{item}</span>
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
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600 dark:text-gray-400">{item}</span>
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
      "transition-all duration-200 hover:shadow-md cursor-pointer",
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
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
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
    setTimeout(() => {
      document.getElementById(`guide-section-${sectionId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 100)
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
          <p className="text-gray-500 dark:text-gray-400">
            Tout ce que vous devez savoir pour utiliser PMS Guest House
          </p>
        </div>
      </div>

      {/* Search */}
      <GuideSearch
        query={searchQuery}
        setQuery={setSearchQuery}
        results={searchResults}
        onSelect={scrollToSection}
      />

      {/* Quick navigation chips */}
      <div className="flex flex-wrap gap-2">
        {guideSections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
              expandedSection === section.id
                ? `${section.bgColor} ${section.color} border-current/20`
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            <section.icon className="w-3.5 h-3.5" />
            {section.title}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {guideSections.map((section) => (
          <div key={section.id} id={`guide-section-${section.id}`}>
            <SectionCard
              section={section}
              isExpanded={expandedSection === section.id}
              onToggle={() => setExpandedSection(
                expandedSection === section.id ? "" : section.id
              )}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Vous avez une question qui n&apos;est pas dans ce guide ?
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Contactez le support technique depuis la section{" "}
          <Link href="/app/settings/help" className="text-sky-600 hover:underline font-medium">
            Aide
          </Link>
        </p>
      </div>
    </div>
  )
}
