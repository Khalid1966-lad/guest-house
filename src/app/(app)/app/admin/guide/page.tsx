"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Shield, Database, Building2, CreditCard, Search, ChevronRight, ChevronDown,
  Lightbulb, AlertTriangle, CheckCircle2, ArrowLeft, FileText, Info,
  Download, Upload, RefreshCw, Users, Crown, ChevronUp, Clock,
  type LucideIcon
} from "lucide-react"
import Link from "next/link"

// ─── Guide Data Interfaces ────────────────────────────────────────────────────

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

// ─── Guide Sections ───────────────────────────────────────────────────────────

const guideSections: GuideSection[] = [
  {
    id: "introduction",
    icon: Shield,
    title: "Bienvenue, Super Administrateur",
    description: "Vue d'ensemble de vos pouvoirs sur la plateforme",
    color: "text-violet-700",
    bgColor: "bg-violet-100 dark:bg-violet-950",
    content: [
      {
        type: "paragraph",
        title: "Qu'est-ce que le Super Administrateur ?",
        text: "En tant que Super Administrateur de PMS Guest House, vous disposez du contrôle total sur la plateforme. Vous gérez l'ensemble des maisons d'hôtes inscrites, leurs abonnements, les sauvegardes du système et les inscriptions en attente. C'est le rôle le plus puissant et le plus critique de la plateforme.",
      },
      {
        type: "feature",
        title: "Vos responsabilités principales",
        items: [
          "Surveiller et gérer toutes les maisons d'hôtes de la plateforme",
          "Activer ou bloquer les établissements selon leur conformité",
          "Gérer les abonnements et les plans tarifaires",
          "Assurer la sécurité des données avec des sauvegardes régulières",
          "Valider les nouvelles inscriptions de propriétaires",
          "Réinitialiser les mots de passe des propriétaires en cas de besoin",
        ],
      },
      {
        type: "tip",
        text: "Accédez au panneau d'administration directement depuis l'URL ou via la section Admin dans votre navigation. Vous pouvez également consulter ce guide à tout moment depuis le panneau d'administration.",
      },
      {
        type: "warning",
        text: "Vos actions ont un impact sur l'ensemble de la plateforme. Soyez particulièrement vigilant lors de la restauration de sauvegardes ou du blocage d'une maison d'hôtes, car ces actions affectent tous les utilisateurs de l'établissement concerné.",
      },
    ],
  },
  {
    id: "panel-overview",
    icon: Crown,
    title: "Panel Admin — Vue d'ensemble",
    description: "Le tableau de bord de la plateforme",
    color: "text-purple-700",
    bgColor: "bg-purple-100 dark:bg-purple-950",
    content: [
      {
        type: "paragraph",
        title: "Comment accéder au Panel Admin",
        text: "Le Panel Admin est accessible via l'URL directe de la section admin ou depuis la navigation principale si votre compte a le rôle Super Administrateur. C'est votre point de départ pour superviser toute la plateforme.",
      },
      {
        type: "feature",
        title: "Statistiques globales disponibles",
        items: [
          "Nombre total de maisons d'hôtes inscrites sur la plateforme",
          "Nombre de maisons d'hôtes actives (abonnement en cours)",
          "Nombre de maisons d'hôtes en attente (inscription non complétée ou en essai)",
          "Nombre total d'utilisateurs (tous rôles confondus, tous établissements)",
          "Nombre d'abonnements actifs et leur répartition par plan",
          "Vue d'ensemble des dernières inscriptions et activités",
        ],
      },
      {
        type: "feature",
        title: "Navigation depuis le Panel",
        items: [
          "Maisons d'hôtes : liste complète de tous les établissements",
          "Abonnements : gestion des plans et des souscriptions actives",
          "Sauvegardes : outil de backup et restauration de la base de données",
          "Inscriptions en attente : nouveaux propriétaires à valider",
        ],
      },
      {
        type: "tip",
        text: "Consultez le Panel Admin régulièrement pour surveiller l'état de la plateforme. Les indicateurs colorés vous alertent immédiatement sur les actions nécessitant votre attention (inscriptions en attente, abonnements expirés, etc.).",
      },
    ],
  },
  {
    id: "guesthouses",
    icon: Building2,
    title: "Gestion des Maisons d'Hôtes",
    description: "Créez, activez et supervisez les établissements",
    color: "text-fuchsia-700",
    bgColor: "bg-fuchsia-100 dark:bg-fuchsia-950",
    content: [
      {
        type: "paragraph",
        title: "Le cœur de votre rôle",
        text: "La gestion des maisons d'hôtes est votre fonction principale. Vous pouvez voir tous les établissements de la plateforme, les créer manuellement, modifier leurs informations, les activer ou les bloquer, et même réinitialiser le mot de passe de leur propriétaire.",
      },
      {
        type: "feature",
        title: "Statuts d'une maison d'hôtes",
        items: [
          "Active : l'établissement est pleinement opérationnel, le propriétaire et son équipe peuvent utiliser le PMS",
          "En attente (Pending) : l'établissement est inscrit mais n'a pas encore été activé par le super admin",
          "Essai (Trial) : l'établissement est en période d'essai de 14 jours avec toutes les fonctionnalités",
          "Bloquée (Blocked) : l'établissement a été désactivé par le super admin, l'accès est coupé",
        ],
      },
      {
        type: "steps",
        title: "Créer une nouvelle maison d'hôtes",
        items: [
          "Cliquez sur « + Nouvelle maison d'hôtes » dans la page de gestion",
          "Remplissez le nom de l'établissement (ex: Riad Jardin Secret, Dar Zellij...)",
          "Indiquez l'adresse complète : rue, ville, code postal, pays",
          "Renseignez les coordonnées : email, téléphone, site web",
          "Définissez la devise par défaut et le fuseau horaire",
          "Créez le compte du propriétaire : nom, prénom, email, mot de passe temporaire",
          "Choisissez le plan d'abonnement initial",
          "Enregistrez — le propriétaire recevra un accès immédiat",
        ],
      },
      {
        type: "steps",
        title: "Activer une maison d'hôtes en attente",
        items: [
          "Repérez la maison d'hôtes avec le statut « En attente » dans la liste",
          "Cliquez sur les actions (menu contextuel) ou le bouton « Activer »",
          "Vérifiez que les informations sont complètes et correctes",
          "Confirmez l'activation — un essai de 14 jours démarre automatiquement si aucun abonnement n'est défini",
          "Le propriétaire reçoit la confirmation et peut commencer à utiliser la plateforme",
        ],
      },
      {
        type: "steps",
        title: "Bloquer une maison d'hôtes",
        items: [
          "Trouvez la maison d'hôtes dans la liste",
          "Cliquez sur les actions > « Bloquer »",
          "Confirmez le blocage — tous les utilisateurs de l'établissement perdent l'accès",
          "Les données sont conservées mais inaccessibles",
          "Pour réactiver : utilisez l'option « Débloquer » dans les actions",
        ],
      },
      {
        type: "steps",
        title: "Réinitialiser le mot de passe du propriétaire",
        items: [
          "Trouvez la maison d'hôtes concernée dans la liste",
          "Cliquez sur les actions > « Réinitialiser le mot de passe »",
          "Définissez un nouveau mot de passe temporaire (minimum 6 caractères)",
          "Communiquez le mot de passe au propriétaire par un canal sécurisé",
          "Le propriétaire devra le changer depuis son profil après connexion",
        ],
      },
      {
        type: "steps",
        title: "Modifier les informations d'une maison d'hôtes",
        items: [
          "Cliquez sur la maison d'hôtes dans la liste pour voir ses détails",
          "Cliquez sur « Modifier » pour accéder au formulaire d'édition",
          "Modifiez les champs souhaités (nom, adresse, coordonnées, etc.)",
          "Enregistrez les modifications — elles sont appliquées immédiatement",
        ],
      },
      {
        type: "feature",
        title: "Détails d'une maison d'hôtes",
        items: [
          "Informations générales : nom, description, adresse, coordonnées",
          "Statut actuel et date de création",
          "Nombre d'utilisateurs et leurs rôles",
          "Nombre de chambres et leur disponibilité",
          "Plan d'abonnement actuel et sa date d'expiration",
          "Statistiques de base : réservations, revenus",
        ],
      },
      {
        type: "warning",
        text: "Le blocage d'une maison d'hôtes est une action critique. Tous les utilisateurs de l'établissement (propriétaire, gestionnaires, réceptionnistes, etc.) perdront immédiatement l'accès à la plateforme. Utilisez cette fonction uniquement en cas de problème grave (non-paiement, activité illégale, etc.).",
      },
      {
        type: "tip",
        text: "Utilisez la barre de recherche et les filtres par statut pour retrouver rapidement une maison d'hôtes. Vous pouvez filtrer par : Active, En attente, Essai, Bloquée.",
      },
    ],
  },
  {
    id: "subscriptions",
    icon: CreditCard,
    title: "Gestion des Abonnements",
    description: "Plans, facturation et suivi des souscriptions",
    color: "text-amber-700",
    bgColor: "bg-amber-100 dark:bg-amber-950",
    content: [
      {
        type: "paragraph",
        title: "Le système d'abonnement",
        text: "Chaque maison d'hôtes de la plateforme doit avoir un abonnement actif pour utiliser le PMS. Vous gérez les plans tarifaires, créez et modifiez les abonnements, et suivez l'historique des changements de statut.",
      },
      {
        type: "feature",
        title: "Les 4 plans d'abonnement",
        items: [
          "Essai (14 jours) : accès complet gratuit pendant 14 jours, accordé automatiquement aux nouvelles maisons d'hôtes",
          "Basique : plan d'entrée de gamme avec les fonctionnalités essentielles",
          "Pro : plan intermédiaire avec des fonctionnalités avancées supplémentaires",
          "Premium : plan complet avec toutes les fonctionnalités et le support prioritaire",
        ],
      },
      {
        type: "paragraph",
        title: "Essai automatique",
        text: "Lorsqu'une nouvelle maison d'hôtes est créée et activée, elle reçoit automatiquement un abonnement d'essai de 14 jours. Pendant cette période, le propriétaire a accès à toutes les fonctionnalités. À l'expiration, la maison d'hôtes passe en statut « Expiré » et doit souscrire à un plan payant pour continuer.",
      },
      {
        type: "steps",
        title: "Créer un abonnement pour une maison d'hôtes",
        items: [
          "Allez dans la section « Abonnements » du Panel Admin",
          "Cliquez sur « + Nouvel abonnement »",
          "Sélectionnez la maison d'hôtes concernée dans la liste déroulante",
          "Choisissez le plan souhaité (Basique, Pro ou Premium)",
          "Définissez la date de début et la durée de l'abonnement",
          "Ajoutez des notes si nécessaire (ex: tarif spécial, réduction...)",
          "Enregistrez — l'abonnement est actif immédiatement",
        ],
      },
      {
        type: "steps",
        title: "Modifier un abonnement existant",
        items: [
          "Trouvez l'abonnement dans la liste (utilisez les filtres si nécessaire)",
          "Cliquez sur « Modifier » dans les actions",
          "Changez le plan, prolongez la durée ou ajustez les informations",
          "Enregistrez — les modifications sont appliquées immédiatement",
          "Un historique des changements est conservé automatiquement",
        ],
      },
      {
        type: "feature",
        title: "Statuts des abonnements",
        items: [
          "Actif : l'abonnement est en cours, la maison d'hôtes a accès à toutes les fonctionnalités de son plan",
          "Expiré : la période est terminée, la maison d'hôtes doit renouveler ou changer de plan",
          "Annulé : l'abonnement a été résilié manuellement",
          "En attente : l'abonnement est programmé pour une date future",
        ],
      },
      {
        type: "feature",
        title: "Historique des abonnements",
        items: [
          "Chaque changement de statut est enregistré avec la date et l'auteur",
          "Vous pouvez voir l'historique complet d'une maison d'hôtes",
          "Les transitions d'un plan à un autre sont tracées",
          "Les dates de début, fin et d'expiration sont visibles",
        ],
      },
      {
        type: "info",
        text: "Un essai automatique de 14 jours est créé pour chaque nouvelle maison d'hôtes activée. Vous n'avez pas besoin de le créer manuellement. Si le propriétaire souscrit à un plan payant avant la fin de l'essai, l'essai est remplacé par le nouveau plan.",
      },
      {
        type: "tip",
        text: "Surveillez les abonnements proches de l'expiration pour contacter les propriétaires à l'avance et les inciter à renouveler. Un abonnement expiré bloque l'accès à la maison d'hôtes.",
      },
    ],
  },
  {
    id: "backups",
    icon: Database,
    title: "Sauvegardes (Backup)",
    description: "Protégez et restaurez les données de la plateforme",
    color: "text-rose-700",
    bgColor: "bg-rose-100 dark:bg-rose-950",
    content: [
      {
        type: "paragraph",
        title: "Pourquoi les sauvegardes sont critiques",
        text: "Les sauvegardes sont votre filet de sécurité le plus important. Elles contiennent une copie complète de toutes les données de la plateforme. En cas de panne matérielle, d'erreur humaine ou de corruption de données, les sauvegardes vous permettent de restaurer l'intégralité de la base de données ou un seul établissement.",
      },
      {
        type: "feature",
        title: "Tables incluses dans la sauvegarde (21 tables)",
        items: [
          "GuestHouse : toutes les maisons d'hôtes et leurs configurations",
          "User : tous les utilisateurs de la plateforme",
          "Role : les rôles et permissions",
          "Room : toutes les chambres de tous les établissements",
          "Guest : les fiches clients",
          "Booking : toutes les réservations",
          "Invoice & InvoiceItem : les factures et leurs lignes détaillées",
          "Payment : les paiements enregistrés",
          "MenuItem : les plats du restaurant",
          "RestaurantOrder & OrderItem : les commandes et leurs détails",
          "Expense : les dépenses",
          "CleaningTask & CleaningTaskItem : les tâches de ménage",
          "HousekeepingZone : les zones de ménage",
          "StaffSchedule : les plannings du personnel",
          "Notification : les notifications",
          "AuditLog : le journal d'audit des actions",
          "Subscription : les abonnements",
        ],
      },
      {
        type: "paragraph",
        title: "Format de sauvegarde",
        text: "Les sauvegardes sont générées au format JSON, compressées avec gzip (.json.gz), puis stockées en base de données sous forme de données encodées en base64. Ce format garantit la portabilité et l'efficacité du stockage.",
      },
      {
        type: "steps",
        title: "Effectuer une sauvegarde complète",
        items: [
          "Allez dans la section « Sauvegardes » du Panel Admin",
          "Cliquez sur le bouton « Sauvegarde complète »",
          "Le système exporte toutes les 21 tables de la base de données",
          "Les données sont compressées en gzip puis encodées en base64",
          "La sauvegarde est stockée avec un identifiant unique, une date et heure",
          "Un résumé indique le nombre de tables et d'enregistrements sauvegardés",
          "Vous pouvez télécharger la sauvegarde en fichier .json.gz sur votre PC",
        ],
      },
      {
        type: "steps",
        title: "Créer une sauvegarde manuelle avec label",
        items: [
          "Cliquez sur « Nouvelle sauvegarde » dans la section Sauvegardes",
          "Donnez un label descriptif (ex: « Avant maintenance serveur », « Fin de mois Janvier »)",
          "Le label vous aide à identifier rapidement la sauvegarde dans la liste",
          "La sauvegarde est créée immédiatement avec toutes les tables",
        ],
      },
      {
        type: "feature",
        title: "Sauvegarde automatique",
        items: [
          "Le système crée automatiquement des sauvegardes à intervalles réguliers",
          "Un maximum de 7 sauvegardes automatiques est conservé",
          "Les plus anciennes sont supprimées automatiquement quand la limite est atteinte",
          "Les sauvegardes automatiques sont identifiables par leur label « auto »",
          "Elles garantissent une protection minimale en cas de problème imprévu",
        ],
      },
      {
        type: "steps",
        title: "Télécharger une sauvegarde",
        items: [
          "Trouvez la sauvegarde souhaitée dans la liste",
          "Cliquez sur le bouton « Télécharger » dans les actions",
          "Un fichier .json.gz est généré et téléchargé sur votre ordinateur",
          "Conservez ce fichier dans un endroit sûr (disque externe, cloud...)",
        ],
      },
      {
        type: "steps",
        title: "Restauration complète de la base de données",
        items: [
          "Trouvez la sauvegarde à restaurer dans la liste",
          "Cliquez sur « Restaurer tout » dans les actions",
          "Le système effectue d'abord une sauvegarde de sécurité automatique (safety backup)",
          "Ensuite, il valide le contenu de la sauvegarde (dry-run)",
          "Si la validation passe, toutes les tables sont remplacées par les données de la sauvegarde",
          "Un résumé de la restauration est affiché (tables restaurées, enregistrements)",
          "Tous les utilisateurs sont reconnectés avec les données restaurées",
        ],
      },
      {
        type: "steps",
        title: "Restauration d'une seule maison d'hôtes",
        items: [
          "Trouvez la sauvegarde contenant les données souhaitées",
          "Cliquez sur « Restaurer une maison d'hôtes » dans les actions",
          "Sélectionnez la maison d'hôtes à restaurer dans la liste",
          "Seules les données liées à cet établissement sont restaurées (chambres, réservations, clients, factures, etc.)",
          "Les autres maisons d'hôtes ne sont pas affectées",
          "Un safety backup est effectué avant la restauration partielle",
        ],
      },
      {
        type: "steps",
        title: "Importer une sauvegarde depuis votre PC",
        items: [
          "Cliquez sur « Importer une sauvegarde » dans la section Sauvegardes",
          "Sélectionnez un fichier .json.gz depuis votre ordinateur",
          "Le système décompresse et valide le fichier",
          "Les données sont importées et stockées comme une nouvelle sauvegarde",
          "Vous pouvez ensuite l'utiliser pour une restauration si nécessaire",
        ],
      },
      {
        type: "info",
        title: "Découverte dynamique des tables",
        text: "Le système de sauvegarde découvre automatiquement les tables de la base de données. Si de nouvelles tables sont ajoutées à l'avenir (par exemple lors d'une mise à jour du PMS), elles seront automatiquement incluses dans les sauvegardes sans modification du code. Cela garantit que vos sauvegardes sont toujours complètes.",
      },
      {
        type: "info",
        title: "Validation (Dry-run)",
        text: "Avant toute restauration, le système effectue une validation (dry-run) pour vérifier l'intégrité de la sauvegarde. Cette étape vérifie que le fichier est valide, que les tables attendues sont présentes et que les données sont cohérentes. La restauration ne commence que si la validation réussit.",
      },
      {
        type: "warning",
        text: "La restauration complète remplace TOUTES les données de la plateforme. Assurez-vous d'avoir sélectionné la bonne sauvegarde. Un safety backup est automatiquement créé avant chaque restauration, mais il est recommandé de vérifier deux fois avant de confirmer.",
      },
      {
        type: "warning",
        text: "La restauration d'une maison d'hôtes spécifique remplace uniquement les données de cet établissement. Les données des autres établissements restent intactes. Cependant, les données référentielles partagées (comme les rôles) ne sont pas affectées.",
      },
      {
        type: "tip",
        text: "Conservez toujours au moins une sauvegarde récente sur un support externe (disque dur, clé USB, stockage cloud). En cas de panne du serveur, les sauvegardes stockées uniquement en base de données seraient également perdues.",
      },
    ],
  },
  {
    id: "pending-registrations",
    icon: Users,
    title: "Inscriptions en attente",
    description: "Validez les nouveaux propriétaires",
    color: "text-orange-700",
    bgColor: "bg-orange-100 dark:bg-orange-950",
    content: [
      {
        type: "paragraph",
        title: "Que sont les inscriptions en attente ?",
        text: "Les inscriptions en attente correspondent aux utilisateurs qui se sont enregistrés sur la plateforme mais n'ont pas encore complété le processus d'onboarding. Ce sont généralement des propriétaires potentiels qui ont créé leur compte mais n'ont pas encore créé de maison d'hôtes.",
      },
      {
        type: "feature",
        title: "Profil d'une inscription en attente",
        items: [
          "Nom et prénom du propriétaire potentiel",
          "Adresse email de contact",
          "Date d'inscription",
          "Statut de l'inscription (en attente, en cours, abandonnée)",
        ],
      },
      {
        type: "steps",
        title: "Gérer une inscription en attente",
        items: [
          "Consultez la liste des inscriptions en attente dans le Panel Admin",
          "Vérifiez les informations du propriétaire (nom, email, date)",
          "Si l'inscription est récente, vous pouvez patienter que le propriétaire complète son onboarding",
          "Si l'inscription est ancienne, vous pouvez contacter le propriétaire pour l'accompagner",
          "Vous pouvez créer manuellement une maison d'hôtes pour ce propriétaire depuis la section « Maisons d'hôtes »",
          "Une fois la maison d'hôtes créée et activée, l'inscription disparaît de la liste",
        ],
      },
      {
        type: "info",
        text: "Un propriétaire sans maison d'hôtes est un compte utilisateur qui existe mais qui ne peut pas encore utiliser le PMS. Il n'a pas accès au tableau de bord ni aux fonctionnalités de gestion. La création d'une maison d'hôtes active automatiquement son accès complet.",
      },
      {
        type: "tip",
        text: "Consultez régulièrement les inscriptions en attente pour identifier les propriétaires qui ont besoin d'aide pour démarrer. Un suivi proactif améliore le taux de conversion et la satisfaction des utilisateurs.",
      },
    ],
  },
  {
    id: "best-practices",
    icon: Lightbulb,
    title: "Bonnes pratiques",
    description: "Conseils pour une gestion efficace de la plateforme",
    color: "text-teal-700",
    bgColor: "bg-teal-100 dark:bg-teal-950",
    content: [
      {
        type: "feature",
        title: "Sécurité",
        items: [
          "Utilisez des mots de passe temporaires complexes lors de la création de comptes",
          "Demandez toujours aux propriétaires de changer leur mot de passe à la première connexion",
          "Bloquez immédiatement tout accès compromis ou suspect",
          "Vérifiez régulièrement les journaux d'audit (AuditLog) pour détecter les activités anormales",
          "Ne partagez jamais vos identifiants Super Administrateur",
        ],
      },
      {
        type: "feature",
        title: "Sauvegardes",
        items: [
          "Vérifiez que les sauvegardes automatiques fonctionnent correctement",
          "Effectuez une sauvegarde manuelle avant toute opération critique",
          "Conservez des sauvegardes hors ligne sur un support externe",
          "Testez régulièrement la restauration pour vous assurer qu'elle fonctionne",
          "Nommez vos sauvegardes manuelles avec des labels clairs et descriptifs",
        ],
      },
      {
        type: "feature",
        title: "Gestion des abonnements",
        items: [
          "Surveillez les abonnements proches de l'expiration",
          "Contactez les propriétaires avant l'expiration pour leur proposer le renouvellement",
          "Gardez un historique des offres spéciales ou réductions accordées",
          "Documentez les raisons de tout blocage ou annulation d'abonnement",
        ],
      },
      {
        type: "feature",
        title: "Support et communication",
        items: [
          "Répondez rapidement aux demandes des propriétaires",
          "Documentez les problèmes récurrents pour améliorer la plateforme",
          "Accompagnez les nouveaux propriétaires dans leur prise en main",
          "Tenez à jour ce guide si de nouvelles fonctionnalités sont ajoutées",
        ],
      },
      {
        type: "tip",
        text: "Créez une routine quotidienne : consultez le Panel Admin le matin, vérifiez les inscriptions en attente et les abonnements expirés. Une gestion proactive évite la plupart des problèmes.",
      },
    ],
  },
  {
    id: "glossary",
    icon: FileText,
    title: "Glossaire Super Admin",
    description: "Les termes spécifiques à l'administration",
    color: "text-slate-700",
    bgColor: "bg-slate-100 dark:bg-slate-950",
    content: [
      {
        type: "feature",
        title: "Termes techniques",
        items: [
          "Safety Backup : sauvegarde de sécurité automatique créée avant chaque restauration",
          "Dry-run : simulation de restauration qui valide les données sans les appliquer",
          "Découverte dynamique : le système détecte automatiquement les nouvelles tables dans la base de données",
          "Base64 : encodage utilisé pour stocker les sauvegardes compressées en base de données",
          "Gzip : algorithme de compression utilisé pour réduire la taille des sauvegardes",
          "Essai automatique : période d'essai de 14 jours accordée automatiquement à chaque nouvelle maison d'hôtes",
          "AuditLog : journal qui enregistre toutes les actions importantes effectuées sur la plateforme",
          "Onboarding : processus d'inscription et de première configuration d'un propriétaire",
        ],
      },
      {
        type: "feature",
        title: "Plans d'abonnement",
        items: [
          "Essai : accès gratuit et complet pendant 14 jours",
          "Basique : plan d'entrée de gamme avec les fonctionnalités essentielles",
          "Pro : plan intermédiaire avec des fonctionnalités avancées",
          "Premium : plan complet avec support prioritaire et toutes les fonctionnalités",
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
        placeholder="Rechercher dans le guide... (ex: sauvegarde, abonnement, maison d'hôtes...)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-12 h-12 text-base rounded-xl border-violet-200 dark:border-violet-800 bg-white dark:bg-gray-900 focus:border-violet-400"
      />
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl border border-violet-100 dark:border-violet-900 shadow-lg z-10 max-h-64 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => { onSelect(r.sectionId); setQuery("") }}
              className="w-full text-left px-4 py-3 hover:bg-violet-50 dark:hover:bg-violet-950 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <FileText className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.sectionTitle}</p>
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
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center mt-0.5">
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

  if (block.type === "info") {
    return (
      <div className="flex items-start gap-3 p-4 bg-violet-50 dark:bg-violet-950 rounded-xl border border-violet-200 dark:border-violet-800">
        <Info className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          {block.title && <p className="text-sm font-medium text-violet-800 dark:text-violet-200 mb-1">{block.title}</p>}
          <p className="text-sm text-violet-700 dark:text-violet-300">{block.text}</p>
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
              <CheckCircle2 className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
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
      "transition-all duration-200 hover:shadow-md cursor-pointer border-violet-100 dark:border-violet-900",
      isExpanded && "ring-2 ring-violet-300 dark:ring-violet-700 shadow-md"
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
              <ChevronDown className="w-5 h-5 text-violet-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 pb-6">
          <Separator className="mb-6 bg-violet-100 dark:bg-violet-900" />
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

export default function SuperAdminGuidePage() {
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
        <Link href="/app/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
              <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            Guide Super Administrateur
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Tout ce que vous devez savoir pour administrer la plateforme PMS Guest House
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
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-violet-50 dark:hover:bg-violet-950 hover:text-violet-600 hover:border-violet-200 dark:hover:border-violet-800"
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
      <div className="text-center py-8 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-violet-500" />
          <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
            Guide réservé aux Super Administrateurs
          </p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Vous avez une question technique ou besoin d&apos;assistance ?
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Contactez le support technique ou consultez le{" "}
          <Link href="/app/guide" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">
            guide d&apos;utilisation général
          </Link>{" "}
          pour plus d&apos;informations sur les fonctionnalités du PMS.
        </p>
      </div>
    </div>
  )
}
