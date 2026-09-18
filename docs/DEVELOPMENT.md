# Guide de developpement

Ce document vous guidera pour installer, configurer et developper Comptasse sur votre machine locale.

## Table des matieres

- [Choix de l'environnement](#choix-de-lenvironnement)
- [Prerequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Initialisation de la base de donnees](#initialisation-de-la-base-de-données)
- [Lancement en developpement](#lancement-en-développement)
- [Structure du projet](#structure-du-projet)
- [Scripts disponibles](#scripts-disponibles)
- [Workflow de developpement](#workflow-de-développement)
- [Debugging](#debugging)
- [Conseils](#conseils)

## Choix de l'environnement

Vous avez deux options pour developper Comptasse :

### Option 1 : Developpement avec Docker Compose (Recommande)

**Avantages :**
- Configuration simplifiee (pas d'installation de PostgreSQL, RustFS, etc.)
- Environnement standardise et reproductible
- Isolation complete des services
- Node.js et pnpm installes localement (meilleure performance IDE)

**Prerequis :**
- Node.js 25+
- pnpm
- Docker et Docker Compose

**Ideal pour :** Developpement quotidien, bonne balance performance/simplicite

### Option 2 : Developpement natif

**Avantages :**
- Controle total sur chaque service
- Peut etre plus rapide sur certaines machines
- Pas besoin de Docker

**Prerequis :**
- Node.js 25+
- pnpm
- PostgreSQL installe localement
- Optionnellement Docker pour RustFS

**Ideal pour :** Developpeurs experimentes, personnalisation avancee

## Prerequis

### Prerequis communs

- **Node.js** : Version 25 ou superieure
  ```bash
  node --version  # Devrait afficher v25.x.x ou superieur
  ```
  
  Installation : https://nodejs.org/

- **pnpm** : Version 10 ou superieure
  ```bash
  pnpm --version
  ```
  
  Installation :
  ```bash
  npm install -g pnpm
  # ou
  curl -fsSL https://get.pnpm.io/install.sh | sh -
  ```

### Option 1 : Avec Docker Compose

- **Docker** et **Docker Compose** : https://www.docker.com/get-started
  ```bash
  docker --version
  docker compose version
  ```

C'est tout ! PostgreSQL, RustFS seront lances automatiquement dans des containers.

### Option 2 : Developpement natif

- **PostgreSQL** : Version 14 ou superieure recommandee
  ```bash
  psql --version
  ```

  **Installation :**
  
  **Ubuntu/Debian :**
  ```bash
  sudo apt update
  sudo apt install postgresql postgresql-contrib
  sudo systemctl start postgresql
  ```

  **macOS :**
  ```bash
  brew install postgresql@16
  brew services start postgresql@16
  ```

  **Windows :**
  Telecharger depuis https://www.postgresql.org/download/windows/

- **Docker** (optionnel, pour RustFS) : https://www.docker.com/get-started
- Ou configurez des services S3 alternatifs

## Installation

### Etape 1 : Cloner le repository

```bash
git clone https://github.com/comptasse/comptasse.git
cd comptasse
```

### Etape 2 : Installer les dependances

```bash
pnpm install
```

Cette commande installera toutes les dependances de tous les packages du monorepo.

### Etape 3 : Verifier l'installation

```bash
pnpm ls --depth=0
```

Vous devriez voir tous les packages workspace listes.

## Configuration

### Option 1 : Configuration avec Docker Compose (Recommande)

#### 1. Lancer les services avec just (recommande)

```bash
just dev up
```

Ou directement avec Docker Compose :

```bash
docker compose -f .workflows/dev/compose.yml up -d --build
```

Les services seront disponibles sur :
- **PostgreSQL** : `localhost:5432` (user: `postgres`, password: `admin`, database: `default`)
- **RustFS API** : `localhost:9000`
- **RustFS Console** : http://localhost:9001 (credentials: `rustfsadmin` / `rustfsadmin`)

#### 2. Creer le bucket RustFS

Accedez a la console RustFS : http://localhost:9001
- Credentials : `rustfsadmin` / `rustfsadmin`
- Creez un bucket nomme `comptasse-files`

#### 3. Variables d'environnement

Aucun fichier `.env` n'est necessaire : toutes les variables d'environnement sont injectees directement par le fichier `docker-compose`. Les valeurs par defaut developpement sont definies dans `.workflows/dev/compose.yml`.

**`packages/tools` :**

La connexion a la base de donnees est fournie via `SQL_DATABASE_URL` (injectee par Compose).

### Option 2 : Configuration native

#### 1. Creer la base de donnees PostgreSQL

```bash
# Se connecter a PostgreSQL
sudo -u postgres psql

# Dans le shell PostgreSQL :
CREATE USER comptasse_user WITH PASSWORD 'comptasse_password';
CREATE DATABASE comptasse OWNER comptasse_user;
GRANT ALL PRIVILEGES ON DATABASE comptasse TO comptasse_user;
\q
```

#### 2. Configurer les services externes (optionnel)

**RustFS (Stockage de fichiers) :**

```bash
# Lancer RustFS avec Docker
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name rustfs \
  -e "RUSTFS_ACCESS_KEY=rustfsadmin" \
  -e "RUSTFS_SECRET_KEY=rustfsadmin" \
  -e "RUSTFS_CONSOLE_ENABLE=true" \
  -e "RUSTFS_VOLUMES=/data" \
  -v ~/rustfs/data:/data \
  rustfs/rustfs:latest

# Acceder a la web UI : http://localhost:9001
# Creer un bucket nomme "comptasse-files"
```

#### 3. Variables d'environnement

Aucun fichier `.env` n'est necessaire : les variables d'environnement sont injectees directement par `docker-compose` (voir `.workflows/dev/compose.yml`).

---

**Pour plus de details sur la configuration, consultez [CONFIGURATION.md](CONFIGURATION.md).**

## Initialisation de la base de donnees

### Pour le developpement local (hors Docker)

**Etape 1 : Pousser le schema vers la base de donnees**

```bash
pnpm --filter tools run push
```

Cette commande cree toutes les tables necessaires dans PostgreSQL a partir des schemas definis dans `@comptasse/application-metadata`.

**Etape 2 : Seed avec des donnees de demonstration**

```bash
pnpm --filter tools run seed
```

Cette commande insere :
- Un utilisateur de demonstration : `demo@comptasse.com` / `demo`
- Une organisation exemple : "Comptasse"
- Des comptes comptables de base
- Des journaux
- Des ecritures comptables d'exemple pour 2022 et 2023
- Des documents et etats financiers

**Etape 3 : Reinitialiser la base (si necessaire)**

Pour tout supprimer et recommencer :

```bash
pnpm --filter tools run reset
```

Cette commande execute : `clear` + `push` + `seed`

### Avec Docker Compose

Pour reinitialiser la base de donnees dans l'environnement Docker :

```bash
just dev reset
```

Ou manuellement :
```bash
docker compose -f .workflows/dev/compose.yml exec api sh -c "cd /workspace/packages/tools && pnpm run reset"
```

## Lancement en developpement

### Commande principale

```bash
pnpm run dev
```

Cette commande lance simultanement :
- **API** sur http://localhost:3000
- **Website (Dashboard)** sur http://localhost:5173

Les deux processus tournent en parallele avec hot-reload active.

### Lancer individuellement (optionnel)

Dans des terminaux separes :

**Terminal 1 - API :**
```bash
pnpm --filter api run dev
```

**Terminal 2 - Website :**
```bash
pnpm --filter website run dev
```

**Terminal 3 - Metadata (optionnel, watch mode) :**
```bash
pnpm --filter metadata run dev
```

### Acces a l'application

- **Frontend (Dashboard)** : http://localhost:5173
- **API** : http://localhost:3000
- **RustFS Console** : http://localhost:9001 (rustfsadmin / rustfsadmin)

### Identifiants de demonstration

```
Email    : demo@comptasse.com
Password : demo
```

### Notes par option

**Docker Compose :**
- Assurez-vous que les services sont lances : `docker compose -f .workflows/dev/compose.yml ps`
- Si les services ne sont pas demarres : `just dev up`

**Natif :**
- Assurez-vous que PostgreSQL est demarre
- Si vous utilisez RustFS avec Docker, verifiez qu'il tourne : `docker ps`

## Structure du projet

```
comptasse/
├── packages/
│   ├── api/                    # Backend API (@comptasse/application-api)
│   │   ├── src/
│   │   │   ├── api.ts         # Configuration Hono
│   │   │   ├── server.ts      # Point d'entree
│   │   │   ├── clients/       # Clients services externes
│   │   │   ├── factories/     # Factories Hono typees
│   │   │   ├── middlewares/   # Auth, validation, etc.
│   │   │   ├── routes/        # Routes API
│   │   │   │   ├── auth/      # Routes authentifiees
│   │   │   │   └── public/    # Routes publiques
│   │   │   ├── validators/    # Validation des donnees
│   │   │   └── utilities/     # Utilitaires
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── website/               # Frontend React (@comptasse/website)
│   │   ├── src/
│   │   │   ├── root.tsx       # Point d'entree React
│   │   │   ├── index.html     # HTML principal
│   │   │   ├── assets/        # CSS, images, manifest
│   │   │   ├── components/    # Composants UI reutilisables
│   │   │   ├── contexts/      # React contexts
│   │   │   ├── features/      # Features par domaine
│   │   │   │   ├── dashboard/ # Dashboard (organisations, settings, support)
│   │   │   │   ├── docs/      # Documentation integree
│   │   │   │   ├── website/   # Site vitrine
│   │   │   │   ├── signIn/    # Connexion
│   │   │   │   └── signUp/    # Inscription
│   │   │   ├── routes/        # Definition routes
│   │   │   └── utilities/     # Utilitaires
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   ├── metadata/               # Schemas et types partages (@comptasse/application-metadata)
│   │   ├── src/
│   │   │   ├── models/        # Modeles Drizzle ORM
│   │   │   ├── schemas/       # Schemas Valibot
│   │   │   ├── routes/        # Definitions routes API
│   │   │   ├── components/    # Composants metier
│   │   │   └── utilities/     # Utilitaires
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                     # Composants UI partages (@comptasse/ui)
│   │   ├── src/
│   │   │   ├── components/    # Boutons, layouts, etc.
│   │   │   ├── fonts/         # Polices
│   │   │   ├── styles/        # CSS
│   │   │   └── utilities/     # cn, sleep
│   │   ├── package.json
│   │   └── panda.config.ts
│   │
│   └── tools/                  # Outils base de donnees (@comptasse/application-tools)
│       ├── src/
│       │   ├── clearDB.ts     # Vider la DB
│       │   ├── migrate.ts     # Migrations
│       │   ├── schemas.ts     # Import schemas
│       │   ├── dbClient.ts    # Client DB
│       │   ├── drizzle.config.ts  # Config Drizzle Kit
│       │   └── seed/          # Scripts de seed
│       └── package.json
│
├── .workflows/                  # Docker configurations
│   ├── .dev/                   # Environnement Docker de developpement
│   │   ├── compose.yml
│   │   └── packages/
│   │       ├── api/            # Dockerfile de dev
│   │       ├── dashboard/      # Dockerfile de dev
│   │       └── website/        # Dockerfile de dev
│   └── .build/                 # Configuration Docker de production et CI
│       ├── compose.yml
│       └── packages/
│           ├── api/
│           ├── ci/             # Dockerfile pour le pipeline CI local (just build)
│           └── dashboard/
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md
│   ├── BUSINESS_MODEL.md
│   ├── CONFIGURATION.md
│   ├── CONTRIBUTING.md
│   └── DEVELOPMENT.md
│
├── justfile                    # Commandes just (dev up/down/reset/logs, build)
├── biome.json                  # Configuration Biome (linter + formatter)
├── pnpm-workspace.yaml         # Configuration workspace
├── package.json                # Scripts racine
├── LICENSE
└── README.md
```

## Scripts disponibles

### Scripts racine (depuis `/`)

```bash
# Lancer API + Website en developpement
pnpm run dev

# Builder tous les packages
pnpm run build

# Verifier le linting et le formatage (Biome)
pnpm check

# Corriger automatiquement le linting et le formatage
pnpm check:fix
```

### Commandes just

```bash
# Demarrer l'environnement Docker de developpement
just dev up

# Arreter l'environnement
just dev down

# Reinitialiser la base de donnees
just dev reset

# Voir les logs
just dev logs

# Lancer le pipeline CI en local (Biome check + build, dans Docker)
just build
```

### Scripts API (`packages/api/`)

```bash
# Developpement avec hot-reload
pnpm --filter api run dev

# Build pour production
pnpm --filter api run build

# Lancer en production (apres build)
pnpm --filter api run start
```

### Scripts Website (`packages/website/`)

```bash
# Developpement avec hot-reload
pnpm --filter website run dev

# Build pour production
pnpm --filter website run build
```

### Scripts Metadata (`packages/metadata/`)

```bash
# Build avec watch mode
pnpm --filter metadata run dev

# Build une fois
pnpm --filter metadata run build
```

### Scripts Tools (`packages/tools/`)

```bash
# Generer les migrations depuis le schema
pnpm --filter tools run generate

# Pousser le schema vers la DB (dev)
pnpm --filter tools run push

# Introspecter le schema de la DB
pnpm --filter tools run pull

# Appliquer les migrations (production)
pnpm --filter tools run migrate

# Seed avec donnees de demo
pnpm --filter tools run seed

# Vider completement la DB
pnpm --filter tools run clear

# Reset complet : clear + push + seed
pnpm --filter tools run reset

# Supprimer les migrations
pnpm --filter tools run drop
```

## Workflow de developpement

### Developpement typique

#### Avec Docker Compose

1. **Lancer les services**
   ```bash
   just dev up
   ```

2. **Lancer l'application** (dans un terminal separe si necessaire)
   ```bash
   pnpm run dev
   ```

3. **Developper avec hot-reload**
   - Modifications dans `packages/api/src/` : Rechargement automatique de l'API
   - Modifications dans `packages/website/src/` : HMR (Hot Module Replacement)
   - Modifications dans `packages/metadata/src/` : Necessite rebuild (ou mode watch)

4. **Arreter les services (a la fin de la session)**
   ```bash
   just dev down
   ```

#### Avec installation native

1. **Lancer les services externes**
   ```bash
   # PostgreSQL (si pas demarre)
   sudo systemctl start postgresql
   
   # RustFS (si utilise avec Docker)
   docker start rustfs
   ```

2. **Lancer l'application**
   ```bash
   pnpm run dev
   ```

3. **Developper avec hot-reload**
   - Modifications dans `packages/api/src/` : Rechargement automatique de l'API
   - Modifications dans `packages/website/src/` : HMR (Hot Module Replacement)
   - Modifications dans `packages/metadata/src/` : Necessite rebuild (ou mode watch)

### Modifier le schema de base de donnees

1. **Modifier les modeles** dans `packages/metadata/src/models/`

2. **Rebuild metadata**
   ```bash
   pnpm --filter metadata run build
   ```

3. **Generer la migration** (optionnel, pour production)
   ```bash
   pnpm --filter tools run generate
   ```

4. **Appliquer les changements**
   ```bash
   # Developpement : push direct
   pnpm --filter tools run push
   
   # Production : migrations
   pnpm --filter tools run migrate
   ```

5. **Mettre a jour le seed** si necessaire dans `packages/tools/src/seed/`

### Ajouter une nouvelle route API

1. **Creer la definition de route** dans `packages/metadata/src/routes/`
   ```typescript
   // packages/metadata/src/routes/auth/myFeature.ts
   import { routeDefinition } from '#src/utilities/routeDefinition.js'
   import * as v from 'valibot'
   
   export const myFeatureRoute = routeDefinition({
       path: '/api/auth/my-feature',
       paramsSchema: v.object({ /* ... */ }),
       bodySchema: v.object({ /* ... */ }),
       responseSchema: v.object({ /* ... */ }),
   })
   ```

2. **Creer l'implementation** dans `packages/api/src/routes/auth/`
   ```typescript
   // packages/api/src/routes/auth/myFeature.ts
   import { myFeatureRoute } from '@comptasse/application-metadata/routes'
   import { authFactory } from '#/factories/authFactory.js'
   
   export const myFeature = authFactory.createApp().post(
       myFeatureRoute.path,
       async (c) => {
           // Implementation
           return c.json({ /* ... */ })
       }
   )
   ```

3. **Enregistrer la route** dans `packages/api/src/routes/routes.ts`

4. **Utiliser cote frontend** dans `packages/website/src/utilities/postAPI.ts`

### Ajouter une nouvelle page

1. **Creer le composant** dans `packages/website/src/features/`

2. **Definir la route** dans `packages/website/src/routes/root/`

3. **Mettre a jour le tree** dans le fichier tree correspondant (ex: `dashboardTree.ts`, `docsTree.ts`)

4. **Ajouter la navigation** si necessaire dans les layouts

## Debugging

### API (Backend)

**Logs verbeux :**
```env
VERBOSE=true
```

**Debugger Node.js :**

Modifier `packages/api/package.json` :
```json
{
  "scripts": {
    "dev:debug": "tsx watch --inspect ./src/server.ts"
  }
}
```

Lancer :
```bash
pnpm --filter api run dev:debug
```

Attacher le debugger dans VS Code avec cette configuration (`.vscode/launch.json`) :
```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to API",
  "port": 9229,
  "skipFiles": ["<node_internals>/**"]
}
```

### Website (Frontend)

**Console du navigateur :**
- Ouvrir DevTools (F12)
- Voir les erreurs, warnings, et logs

**React DevTools :**
- Installer l'extension React DevTools
- Inspecter les composants et leur state

**TanStack Query DevTools :**
Deja integre dans l'application, visible en bas de l'ecran en mode dev.

### Base de donnees

**Inspecter la DB :**
```bash
# Avec Docker Compose
psql postgres://postgres:admin@localhost:5432/default

# Avec installation native
psql postgres://comptasse_user:comptasse_password@localhost:5432/comptasse
```

**Commandes SQL utiles :**
```sql
-- Lister les tables
\dt

-- Voir le schema d'une table
\d table_name

-- Compter les enregistrements
SELECT COUNT(*) FROM users;

-- Voir les derniers enregistrements
SELECT * FROM users ORDER BY "createdAt" DESC LIMIT 10;
```

**Drizzle Studio** (GUI pour visualiser la DB) :
```bash
pnpm dlx drizzle-kit studio --config=packages/tools/src/drizzle.config.ts
```

## Conseils

### Performance

- **Hot-reload lent ?** Redemarrez le serveur de developpement
- **Build lent ?** Verifiez que Node.js est a jour
- **pnpm lent ?** Nettoyez le cache : `pnpm store prune`

### Problemes courants

**"Cannot connect to database" :**
- **Avec Docker :** Verifiez que les containers sont lances : `docker compose -f .workflows/dev/compose.yml ps`
- **Natif :** Verifiez que PostgreSQL est demarre : `sudo systemctl status postgresql`
- Testez la connexion : `psql postgres://postgres:admin@localhost:5432/default`

**"Module not found @comptasse/application-metadata" :**
- Rebuild metadata : `pnpm --filter metadata run build`
- Ou lancez en mode watch : `pnpm --filter metadata run dev`

**"CORS error" :**
- Verifiez `CORS_ORIGIN` dans `.workflows/dev/compose.yml`
- Assurez-vous que l'URL correspond exactement

**"Cookie not set" :**
- Verifiez `COOKIES_DOMAIN` (doit etre `localhost` en dev)
- Verifiez que l'API et le frontend sont sur le meme domaine

**"S3/Storage error" :**
- Verifiez que RustFS est demarre : `docker ps | grep rustfs`
- Verifiez que le bucket existe (console : http://localhost:9001)
- Testez l'endpoint : `curl http://localhost:9000`

**Problemes Docker :**
- **Port deja utilise :** Un autre service utilise le meme port
  ```bash
  # Voir ce qui utilise le port 5432 (PostgreSQL)
  sudo lsof -i :5432
  ```
- **Container ne demarre pas :** Voir les logs
  ```bash
  docker compose -f .workflows/dev/compose.yml logs postgres
  docker compose -f .workflows/dev/compose.yml logs rustfs
  ```
- **Reinitialiser completement :**
  ```bash
  docker compose -f .workflows/dev/compose.yml down -v
  docker compose -f .workflows/dev/compose.yml up -d --build
  ```

### Bonnes pratiques

1. **Commits atomiques** : Un commit = une fonctionnalite/fix
2. **Messages de commit clairs** : Suivez les conventions (voir CONTRIBUTING.md)
3. **Tester avant de commit** : Lancez `just build` pour verifier le linting et la compilation
4. **Suivre les patterns existants** : Regardez le code existant pour rester coherent
5. **Documenter les changements** : Commentaires pour la logique complexe

### Ressources utiles

- **Hono** : https://hono.dev/
- **Drizzle ORM** : https://orm.drizzle.team/
- **Valibot** : https://valibot.dev/
- **TanStack Router** : https://tanstack.com/router/
- **TanStack Query** : https://tanstack.com/query/
- **Radix UI** : https://www.radix-ui.com/
- **Panda CSS** : https://panda-css.com/

---

Pour contribuer au projet, consultez [CONTRIBUTING.md](CONTRIBUTING.md).
