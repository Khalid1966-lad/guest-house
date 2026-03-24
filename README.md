# 🏨 PMS Guest House - SaaS Multi-Tenants

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

Solution SaaS complète de gestion de maisons d'hôtes avec architecture multi-tenants.

## 📋 Fonctionnalités

### 🏠 Gestion de l'établissement
- Création et configuration de maisons d'hôtes
- Paramètres personnalisables (horaires, devises, fuseaux horaires)
- Identifiant unique pour chaque établissement

### 🛏️ Gestion des chambres
- Configuration flexible des chambres (type, capacité, équipements)
- Tarifs de base et tarifs saisonniers
- Statuts en temps réel (disponible, occupée, maintenance)

### 📅 Réservations
- Planning intuitif avec vue calendrier
- Gestion des arrivées/départs
- Sources multiples (direct, Booking, Airbnb, etc.)
- Notifications automatiques

### 👥 Gestion des clients
- Fiches clients complètes
- Historique des séjours
- Programme de fidélité (niveaux VIP)
- Préférences enregistrées

### 💳 Facturation & Paiements
- Factures automatiques
- Suivi des paiements
- Multiples méthodes de paiement
- Gestion des avoirs et remboursements

### 🍽️ Restaurant
- Gestion du menu
- Commandes en chambre ou en table
- Facturation intégrée aux séjours

### 📊 Statistiques & Rapports
- Tableau de bord avec KPIs
- Graphiques de revenus
- Taux d'occupation
- Export des données

### 🔐 Sécurité & Multi-tenancy
- Architecture multi-tenants sécurisée
- Isolation des données par `guest_house_id`
- Audit logs complets
- Authentification robuste avec NextAuth.js

## 🏗️ Architecture

### Multi-Tenancy

Le système utilise une architecture **shared database** avec colonne `guest_house_id` sur toutes les tables métier :

```
┌─────────────────────────────────────────────────────────────┐
│                    Base de données                          │
├─────────────────────────────────────────────────────────────┤
│  guest_houses ─────┬── users (guest_house_id)              │
│                    ├── rooms (guest_house_id)               │
│                    ├── bookings (guest_house_id)            │
│                    ├── guests (guest_house_id)              │
│                    ├── invoices (guest_house_id)            │
│                    └── ... (toutes les tables métier)       │
└─────────────────────────────────────────────────────────────┘
```

### Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | PostgreSQL (Prisma ORM) |
| Auth | NextAuth.js v4 |
| Validation | Zod |
| State | Zustand + TanStack Query |

## 📁 Structure du projet

```
src/
├── app/
│   ├── (auth)/              # Pages d'authentification
│   │   ├── login/          # Connexion
│   │   ├── register/       # Inscription
│   │   └── onboarding/     # Création maison d'hôtes
│   ├── (app)/              # Pages protégées
│   │   └── app/
│   │       ├── dashboard/  # Tableau de bord
│   │       ├── rooms/      # Gestion chambres
│   │       ├── bookings/   # Réservations
│   │       ├── guests/     # Clients
│   │       ├── invoices/   # Facturation
│   │       ├── restaurant/ # Restaurant
│   │       ├── expenses/   # Dépenses
│   │       ├── statistics/ # Statistiques
│   │       └── settings/   # Paramètres
│   ├── api/                # API Routes
│   │   ├── auth/          # Authentification
│   │   └── guest-houses/  # Maisons d'hôtes
│   ├── layout.tsx         # Layout racine
│   └── page.tsx           # Landing page
├── components/
│   ├── layout/            # Composants de layout
│   │   └── sidebar.tsx    # Sidebar + Header
│   └── ui/                # Composants shadcn/ui
├── lib/
│   ├── auth.ts           # Configuration NextAuth
│   ├── db.ts             # Client Prisma
│   ├── session.ts        # Helpers de session
│   └── utils.ts          # Utilitaires
├── prisma/
│   └── schema.prisma     # Schéma de base de données
└── types/                # Types TypeScript
```

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- Bun (recommandé) ou npm
- PostgreSQL (local ou cloud)

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd guest-house

# Installer les dépendances
bun install

# Configurer les variables d'environnement
cp .env.example .env

# Initialiser la base de données
bun run db:push

# Lancer le serveur de développement
bun run dev
```

### Variables d'environnement

```env
# Base de données PostgreSQL (requis pour Vercel)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/database?sslmode=require"

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here

# Application
APP_NAME="PMS Guest House"
APP_URL=http://localhost:3000
```

## 🚀 Déploiement sur Vercel

### Prérequis

1. Un compte [Vercel](https://vercel.com)
2. Une base de données PostgreSQL cloud (choisissez une option) :
   - [Neon](https://neon.tech) (recommandé, gratuit)
   - [Supabase](https://supabase.com) (gratuit)
   - [PlanetScale](https://planetscale.com)
   - [Railway](https://railway.app)

### Étapes de déploiement

1. **Créer la base de données**
   ```bash
   # Exemple avec Neon
   # 1. Allez sur https://neon.tech
   # 2. Créez un projet gratuit
   # 3. Copiez les URLs de connexion
   ```

2. **Pousser sur GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

3. **Connecter à Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Importez votre repository GitHub
   - Configurez les variables d'environnement :
     - `DATABASE_URL`
     - `DIRECT_URL`
     - `NEXTAUTH_URL` (votre URL Vercel)
     - `NEXTAUTH_SECRET` (générez avec `openssl rand -base64 32`)

4. **Déployer**
   - Cliquez sur "Deploy"
   - Vercel détectera automatiquement Next.js

5. **Initialiser la base de données**
   ```bash
   # En local, avec les variables de production
   bun run db:push
   # ou
   bun run db:migrate:deploy
   ```

### Variables d'environnement Vercel

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL de connexion PostgreSQL (pooled) |
| `DIRECT_URL` | URL de connexion directe (migrations) |
| `NEXTAUTH_URL` | URL de votre app Vercel |
| `NEXTAUTH_SECRET` | Secret JWT (32+ caractères) |
| `APP_NAME` | Nom de l'application |
| `APP_URL` | URL publique de l'application |

## 📊 Schéma de base de données

### Tables principales

| Table | Description |
|-------|-------------|
| `guest_houses` | Maisons d'hôtes (tenants) |
| `users` | Utilisateurs avec rôle et appartenance |
| `rooms` | Chambres avec tarifs |
| `bookings` | Réservations |
| `guests` | Clients/hôtes |
| `invoices` | Factures |
| `invoice_items` | Lignes de facture |
| `payments` | Paiements |
| `menu_items` | Articles du restaurant |
| `restaurant_orders` | Commandes restaurant |
| `order_items` | Lignes de commande |
| `expenses` | Dépenses |
| `audit_logs` | Journal d'audit |

### Règle d'or

**Toutes les requêtes SQL doivent filtrer par `guest_house_id`** pour garantir l'isolation des données entre tenants.

## 🔐 Authentification

### Rôles utilisateur

| Rôle | Permissions |
|------|-------------|
| `owner` | Accès complet, gestion des paramètres |
| `admin` | Gestion complète sauf paramètres critiques |
| `manager` | Gestion des réservations, chambres, clients |
| `staff` | Opérations quotidiennes uniquement |

### Flux d'authentification

1. **Inscription** → Création du compte utilisateur
2. **Onboarding** → Création de la maison d'hôtes
3. **Connexion** → Authentification avec NextAuth
4. **Session** → Token JWT avec infos du tenant

## 📈 Roadmap

### Sprint 1 ✅
- [x] Initialisation du projet
- [x] Configuration Prisma + schéma complet
- [x] Authentification NextAuth
- [x] Pages login/register/onboarding
- [x] Dashboard basique

### Sprint 2 ✅
- [x] Gestion complète des chambres
- [x] CRUD chambres avec formulaire
- [x] Statuts et disponibilité
- [x] Tarifs saisonniers
- [x] Équipements paramétrables

### Sprint 3 (En cours)
- [x] Système de réservations
- [x] Calendrier interactif
- [ ] Gestion des conflits
- [ ] Check-in/Check-out

### Sprint 4 (À venir)
- [ ] Profil client enrichi
- [ ] Historique des séjours

### Sprint 5-8 (À venir)
- [ ] Facturation avancée
- [ ] Module restaurant
- [ ] Gestion des dépenses
- [ ] Statistiques et exports

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push sur la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 💬 Support

- 📧 Email: support@pms-guesthouse.com
- 📖 Documentation: [docs.pms-guesthouse.com](https://docs.pms-guesthouse.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/guest-house/issues)

---

Fait avec ❤️ par l'équipe PMS Guest House
