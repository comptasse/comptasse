# Architecture

Ce document decrit l'architecture globale du projet Comptasse, un systeme de comptabilite en partie double pour associations et entreprises francaises.

## Table des matieres

- [Vue d'ensemble](#vue-densemble)
- [Architecture monorepo](#architecture-monorepo)
- [Packages](#packages)
- [Stack technique](#stack-technique)
- [Flux de donnees](#flux-de-données)
- [Authentification](#authentification)
- [Base de donnees](#base-de-données)

## Vue d'ensemble

Comptasse est construit sur une architecture monorepo moderne utilisant **pnpm workspaces**. Le projet est divise en plusieurs packages independants mais interconnectes, chacun ayant une responsabilite specifique.

```
┌─────────────────────────────────────────────────────────┐
│                      Utilisateurs                       │
└────────────────────────────┬────────────────────────────┘
                             │
                  ┌──────────▼──────────┐
                  │ @comptasse/website  │  (Frontend React)
                  │   Port: 5173        │
                  └──────────┬──────────┘
                             │
                             │ HTTP/REST
                             │
                  ┌──────────▼──────────┐
                  │    @comptasse/         │  (Backend Hono)
                  │   application-api   │
                  │   Port: 3000        │
                  └──────────┬──────────┘
                             │
                 ┌───────────┼───────────┐
                 │           │           │
            ┌────▼────┐  ┌───▼────┐
            │   DB    │  │   S3   │
            │ (SQL)   │  │ (File) │
            └─────────┘  └────────┘
```

## Architecture monorepo

Le projet utilise **pnpm workspaces** pour gerer plusieurs packages dans un seul repository. Cette approche offre plusieurs avantages :

- **Partage de code** : Les packages peuvent facilement partager du code via `@comptasse/application-metadata` et `@comptasse/ui`
- **Dependances optimisees** : pnpm deduplique les dependances communes
- **Developpement simplifie** : Build et developpement coordonnes entre packages
- **Versioning coherent** : Toutes les parties du projet evoluent ensemble

### Structure du workspace

```
comptasse/
├── packages/
│   ├── api/          # Backend API
│   ├── metadata/     # Schemas et types partages
│   ├── tools/        # Outils de migration DB
│   ├── ui/           # Composants UI partages
│   └── website/      # Interface utilisateur (dashboard + site vitrine + docs)
├── pnpm-workspace.yaml
└── package.json
```

## Packages

### @comptasse/application-api

**Role :** Backend REST API pour toutes les operations metier

**Technologies :**
- **Hono** : Framework web leger et performant
- **TypeScript** : Typage statique
- **Drizzle ORM** : ORM pour PostgreSQL
- **Valibot** : Validation des donnees
- **AWS SDK** : Stockage de fichiers (S3-compatible)
- **@react-pdf/renderer + PDF client-side** : Generation des PDF dans le navigateur

**Structure :**
```
api/src/
├── api.ts              # Configuration de l'app Hono
├── server.ts           # Point d'entree du serveur
├── clients/            # Clients pour services externes
│   ├── sqlClient.ts
│   └── storageClient.ts
├── factories/          # Factories Hono avec types
│   ├── apiFactory.ts
│   ├── authFactory.ts
│   └── publicFactory.ts
├── middlewares/        # Middlewares d'authentification
│   ├── authMiddleware.ts
│   ├── publicMiddleware.ts
│   └── userVerificationMiddleware.ts
├── routes/             # Routes de l'API
│   ├── routes.ts       # Enregistrement de toutes les routes
│   ├── auth/           # Routes authentifiees
│   │   ├── authRoute.ts
│   │   ├── organizations/  # Gestion organisations (annees, ecritures, rapports, etc.)
│   │   ├── settings/       # Parametres utilisateur
│   │   └── support/        # Support
│   └── public/         # Routes publiques
│       ├── publicRoute.ts
│       ├── signIn.ts
│       ├── signUp.ts
│       └── signOut.ts
├── validators/         # Validation des donnees entrantes
│   └── bodyValidator.ts
└── utilities/          # Utilitaires
    ├── sql/            # Helpers SQL (selectOne, selectMany, insertOne, insertMany, deleteOne, deleteMany, updateOne)
    ├── storage/        # I/O S3 cote serveur (get/put/delete)
    ├── cookies/        # Gestion cookies securises
    ├── workspace/      # Logique metier (generation donnees exercices)
    ├── getEnv.ts       # Validation des variables d'environnement (Valibot)
    ├── exception.ts    # Gestion des erreurs structurees
    ├── response.ts     # Helpers de reponse HTTP
    ├── validate.ts     # Validation des donnees entrantes
    └── ...             # Autres utilitaires
```

**Points d'entree :**
- `server.ts` : Lance le serveur HTTP
- `api.ts` : Configure l'application Hono avec middlewares et routes

**Responsabilites :**
- Gestion de l'authentification (mot de passe + sessions)
- CRUD pour toutes les entites (organisations, comptes, ecritures, etc.)
- Validation des ecritures comptables
- Generation des etats financiers
- Gestion des pieces justificatives (upload/download via S3)

### @comptasse/website

**Role :** Interface utilisateur web complete incluant le dashboard, le site vitrine et la documentation

**Technologies :**
- **React 19** : Framework UI
- **TanStack Router** : Routing type-safe
- **TanStack Query** : Gestion d'etat serveur et cache
- **TanStack Table** : Tableaux de donnees performants
- **TanStack Virtual** : Virtualisation pour grandes listes
- **Radix UI** : Composants accessibles headless
- **Panda CSS** : Framework CSS utility-first
- **React Hook Form** : Gestion de formulaires
- **Valibot** : Validation cote client
- **cmdk** : Palette de commandes
- **Vite** : Build tool et dev server

**Structure :**
```
website/src/
├── root.tsx            # Point d'entree React
├── index.html          # HTML principal
├── assets/             # Ressources statiques
│   ├── css/
│   ├── images/
│   └── manifest/       # PWA manifest
├── components/         # Composants reutilisables
│   ├── document/       # Composants lies aux documents
│   ├── formats/        # Formatage de donnees
│   ├── forms/          # Formulaires
│   ├── inputs/         # Champs de saisie
│   ├── layouts/        # Layouts, data blocks, tables
│   └── overlays/       # Modals, drawers, tooltips
├── contexts/           # Contexts React
│   ├── data/           # Context de donnees globales (TanStack Query)
│   ├── router/         # Configuration du router
│   └── toasts/         # Notifications
├── features/           # Features par domaine metier
│   ├── dashboard/      # Dashboard (organisations, settings, support)
│   ├── docs/           # Documentation (comptabilite, dashboard, general)
│   ├── website/        # Site vitrine (home, pricing, etc.)
│   ├── signIn/         # Connexion
│   ├── signUp/         # Inscription
│   └── error/          # Page d'erreur
├── routes/             # Definition des routes
│   ├── platformRouter.tsx   # Creation du router TanStack
│   ├── platformTree.ts      # Arbre de routes complet
│   ├── rootLayoutRoute.tsx  # Layout racine
│   ├── catchRoute.tsx       # Route catch-all
│   └── root/                # Routes imbriquees
│       ├── dashboard/       # Routes du dashboard
│       ├── docs/            # Routes de la documentation
│       ├── website/         # Routes du site vitrine
│       ├── signIn/          # Route connexion
│       └── signUp/          # Route inscription
└── utilities/          # Utilitaires
    ├── postAPI.ts      # Client API
    ├── useHTTPData.ts  # Hook pour data fetching
    ├── cookies/        # Gestion cookies
    └── ...             # Autres utilitaires
```

**Responsabilites :**
- Interface utilisateur complete (dashboard)
- Site vitrine avec pages marketing
- Documentation integree (comptabilite, utilisation du dashboard)
- Formulaires de saisie avec validation
- Tableaux de donnees avec tri, filtrage, pagination
- Visualisation des etats financiers
- Gestion des documents et pieces justificatives
- Notifications et retours utilisateur

### @comptasse/application-metadata

**Role :** Package partage contenant tous les schemas, modeles et types utilises par l'API et le frontend

**Technologies :**
- **Drizzle ORM** : Definition des schemas de base de donnees
- **Valibot** : Schemas de validation
- **TypeScript** : Types partages
- **nanoid** : Generation d'identifiants uniques

**Structure :**
```
metadata/src/
├── models/             # Modeles Drizzle ORM
│   ├── _index.ts       # Barrel export
│   ├── account.ts
│   ├── file.ts
│   ├── balanceSheet.ts
│   ├── computation.ts
│   ├── computationIncomeStatement.ts
│   ├── document.ts
│   ├── incomeStatement.ts
│   ├── journal.ts
│   ├── organization.ts
│   ├── organizationUser.ts
│   ├── entry.ts        # Ecritures comptables
│   ├── entryLine.ts    # Lignes d'ecriture
│   ├── entryTag.ts     # Table de jointure entree-tag
│   ├── tag.ts          # Tags d'ecritures
│   ├── user.ts
│   ├── userSession.ts
│   └── year.ts
├── schemas/            # Schemas Valibot pour validation
│   └── [memes fichiers que models/]
├── routes/             # Definitions de routes typees
│   ├── auth/           # Routes authentifiees (organisations, settings, support)
│   └── public/         # Routes publiques (user: signIn, signUp, signOut, resetPassword)
├── components/         # Composants metier partages
│   ├── models/
│   ├── schemas/
│   └── values/         # Valeurs par defaut et constantes
└── utilities/          # Utilitaires
    ├── generate.ts
    ├── generateId.ts   # Generation d'IDs (nanoid, 16 chars, alphabet custom)
    └── routeDefinition.ts
```

**Exports (subpath) :**
```typescript
// Utilisable par l'API et le frontend
import { models } from '@comptasse/application-metadata/models'
import { schemas } from '@comptasse/application-metadata/schemas'
import { routes } from '@comptasse/application-metadata/routes'
import { generateId } from '@comptasse/application-metadata/utilities'
import { components } from '@comptasse/application-metadata/components'
```

**Responsabilites :**
- Definition unique des schemas de base de donnees
- Validation coherente des donnees entre frontend et backend
- Types TypeScript partages
- Generation d'IDs uniques (nanoid)
- Definitions de routes type-safe

### @comptasse/ui

**Role :** Composants UI partages et systeme de style

**Technologies :**
- **React** : Framework UI
- **Panda CSS** : Framework CSS utility-first
- **Tabler Icons** : Icones

**Structure :**
```
ui/src/
├── index.ts            # Barrel export
├── components/         # Composants reutilisables
│   ├── buttons/        # Boutons (button, buttonContent, linkContent)
│   └── layouts/        # Layouts (badge, circularLoader, logo, separator)
├── fonts/              # Polices (Monaspace Neon)
├── styles/             # CSS (fonts)
└── utilities/          # Utilitaires
    ├── cn.ts           # Utilitaire CSS (cx, css)
    └── sleep.ts
```

**Exports (subpath) :**
```typescript
import { Button } from '@comptasse/ui'
import { cn } from '@comptasse/ui/utilities/cn.js'
import { css } from '@comptasse/ui/styled-system/css'
```

**Responsabilites :**
- Composants UI reutilisables entre packages
- Systeme de theming et styles partages (Panda CSS)
- Polices et assets partages

### @comptasse/application-tools

**Role :** Outils de gestion de la base de donnees (migrations, seed, maintenance)

**Technologies :**
- **Drizzle Kit** : CLI pour migrations
- **tsx** : Execution TypeScript
- **Postgres** : Client PostgreSQL
- **@ngneat/falso** : Generation de donnees de test

**Scripts disponibles :**
```bash
# Generer les migrations depuis le schema
pnpm --filter tools run generate

# Pousser le schema directement vers la DB
pnpm --filter tools run push

# Introspecter le schema de la DB
pnpm --filter tools run pull

# Appliquer les migrations
pnpm --filter tools run migrate

# Seed avec donnees de demonstration
pnpm --filter tools run seed

# Vider la base de donnees
pnpm --filter tools run clear

# Reset complet (clear + push + seed)
pnpm --filter tools run reset

# Supprimer les migrations
pnpm --filter tools run drop
```

**Structure :**
```
tools/src/
├── env.ts              # Configuration environnement
├── dbClient.ts         # Client de base de donnees
├── schemas.ts          # Import des schemas metadata
├── drizzle.config.ts   # Configuration Drizzle Kit
├── migrate.ts          # Script de migration
├── clearDB.ts          # Script de nettoyage
└── seed/               # Scripts de seed
    ├── seed.ts         # Seed principal
    ├── migration.ts    # Migrations de donnees
    ├── entryLines.ts    # Lignes d'ecritures
    ├── entries2022.ts   # Donnees exemple 2022
    └── entries2023.ts   # Donnees exemple 2023
```

**Responsabilites :**
- Gestion du schema de base de donnees
- Migrations de structure et de donnees
- Generation de donnees de test
- Maintenance de la base de donnees

## Stack technique

### Backend (API)

| Composant | Technologie | Role |
|-----------|-------------|------|
| Runtime | Node.js 25+ | Environnement d'execution |
| Language | TypeScript 5.9 | Langage de programmation |
| Framework | Hono 4.10 | Framework web minimaliste |
| ORM | Drizzle 0.44 | Mapping objet-relationnel |
| Validation | Valibot 1.2 | Validation de schemas |
| Database | PostgreSQL | Base de donnees relationnelle |
| Storage | AWS S3 SDK | Stockage de fichiers |
| PDF | @react-pdf/renderer + generatePdfFromUblXml | Generation de PDF cote client |

### Frontend (Website / Dashboard)

| Composant | Technologie | Role |
|-----------|-------------|------|
| Framework | React 19.2 | UI framework |
| Routing | TanStack Router 1.139 | Routing type-safe |
| State | TanStack Query 5.90 | Server state management |
| Tables | TanStack Table 8.21 | Data tables |
| Virtual | TanStack Virtual 3.13 | Virtualisation listes |
| UI | Radix UI | Composants accessibles |
| Styling | Panda CSS | CSS utility-first |
| Forms | React Hook Form 7.66 | Gestion de formulaires |
| Validation | Valibot 1.2 | Validation client-side |
| Icons | Tabler Icons 3.35 | Icones |
| Build | Vite 7.2 | Build tool moderne |

### Tooling

| Outil | Version | Role |
|-------|---------|------|
| pnpm | Latest | Package manager |
| TypeScript | 5.9 | Compilateur TypeScript |
| Biome | 2.3 | Formatter et linter |
| Drizzle Kit | 0.31 | Migrations de base de donnees |
| tsx | 4.20 | Execution TypeScript |

## Flux de donnees

### Authentification

```
1. Utilisateur envoie email + mot de passe
   └─> POST /api/public/signIn
       └─> Verification du hash (PBKDF2)
       └─> Creation session
       └─> Cookie securise (httpOnly, signe)
       └─> Redirection vers dashboard
       
2. Requetes authentifiees
   └─> Cookie envoye automatiquement
       └─> checkAuthMiddleware verifie la session
       └─> Acces aux routes protegees
```

### CRUD standard

```
Website                        API                      Database
────────────────────────────────────────────────────────────
1. User action
   └─> postAPI()
       └─> POST /api/auth/...
           └─> authMiddleware
               └─> Validation donnees (Valibot)
                   └─> Drizzle ORM
                       └─> SQL Query
                           └─> PostgreSQL
                           
2. Response
   ┌─ JSON
   └─ TanStack Query cache
      └─ Invalidation automatique
         └─ Re-fetch et mise a jour UI
```

### Upload de fichiers

```
1. Selection fichier
   └─> Demande URL signee PUT
       └─> POST /api/auth/.../generatePutSignedUrl
           └─> S3 genere URL temporaire (expires 15min)
           
2. Upload direct vers S3
   └─> PUT https://s3.../file
       (pas de passage par l'API)
       
3. Sauvegarde reference
   └─> POST /api/auth/.../file
       └─> Stocke storageKey en DB
```

### Download de fichiers

```
1. Demande URL signee GET
   └─> POST /api/auth/.../generateGetSignedUrl
       └─> S3 genere URL temporaire (expires 1h)
       
2. Download direct depuis S3
   └─> GET https://s3.../file
       (pas de passage par l'API)
```

## Authentification

### Strategie

Comptasse utilise une **authentification par mot de passe** (PBKDF2) combinee a des **sessions persistantes** cote serveur stockees dans des cookies httpOnly.

### Flow complet

1. **Inscription** (`/api/public/signUp`)
   - Validation email + mot de passe
   - Hash du mot de passe (PBKDF2, 128000 iterations) avec salt unique
   - Creation user et session
   - Cookie signe et httpOnly

2. **Connexion** (`/api/public/signIn`)
   - Verification du hash du mot de passe
   - Creation d'une session
   - Cookie signe et httpOnly

3. **Reset de mot de passe** (`/api/public/resetPassword`)
   - Generation d'un mot de passe temporaire
   - Remplacement du hash en base
   - Retour du mot de passe temporaire dans la reponse

4. **Requetes authentifiees**
   - Cookie envoye automatiquement
   - `checkAuthMiddleware` verifie la session
   - Charge l'utilisateur en contexte
   - Verifie l'appartenance a l'organisation si necessaire

5. **Deconnexion** (`/api/public/signOut`)
   - Suppression de la session en DB
   - Suppression du cookie

### Securite

- **Cookies signes** : Verification de l'integrite avec `COOKIES_KEY`
- **httpOnly** : Protection contre XSS
- **sameSite** : Protection contre CSRF
- **CORS configure** : Origine autorisee uniquement
- **Hashing securise** : PBKDF2 avec salt unique par utilisateur
- **Anti-énumeration** : Le reset de mot de passe repond toujours 200, meme si l'email n'existe pas

## Base de donnees

### Schema principal

Le schema PostgreSQL contient les tables suivantes (via Drizzle ORM) :

**Utilisateurs et organisations :**
- `user` : Utilisateurs de l'application
- `organization` : Organisations (entreprises/associations)
- `organizationUser` : Relation many-to-many avec roles
- `userSession` : Sessions actives

**Comptabilite :**
- `year` : Exercices comptables
- `account` : Plan comptable
- `journal` : Journaux comptables
- `entry` : Ecritures comptables
- `entryLine` : Lignes d'ecriture (debit/credit)
- `tag` : Tags d'ecritures
- `entryTag` : Table de jointure entree-tag
- `document` : Documents comptables
- `file` : Pieces justificatives

**Etats financiers :**
- `balanceSheet` : Configuration du bilan
- `incomeStatement` : Configuration du compte de resultat
- `computation` : Calculs personnalises
- `computationIncomeStatement` : Relation calculs/compte de resultat

### Relations cles

```
organization 1──n organizationUser n──1 user
     │
     ├── 1──n year
     ├── 1──n account
     ├── 1──n journal
     └── 1──n document
              │
              └── 1──n entry
                       │
                       ├── 1──n entryLine
                       │            │
                       │            └── n──1 account
                       └── n──n tag (via entryTag)
```

### Migrations

Les migrations sont gerees par **Drizzle Kit** :
- Le schema source est defini dans `@comptasse/application-metadata`
- Drizzle Kit genere automatiquement les migrations SQL
- Application via `drizzle-kit migrate` ou `push` (dev)

## Diagramme de dependances

```
@comptasse/website ──depends on──> @comptasse/application-metadata
          │                                          ▲
          └─depends on──> @comptasse/ui                 │
                                                     │
@comptasse/application-api  ──depends on───────────────┘
                                                     ▲
                                                     │
@comptasse/application-tools ──depends on──────────────┘

@comptasse/ui  (independant de metadata)
```

Les packages API, website et tools dependent tous de `@comptasse/application-metadata` pour partager les schemas, modeles et types. Le package website depend aussi de `@comptasse/ui` pour les composants UI partages. Cette architecture assure une coherence totale entre le frontend et le backend.

---

Pour plus d'informations sur la configuration, consultez [CONFIGURATION.md](CONFIGURATION.md).
