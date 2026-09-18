# Comptasse

[![Licence AGPL-3.0](https://img.shields.io/badge/licence-AGPL--3.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-25-green.svg)](https://nodejs.org/)

Application open source de comptabilité en partie double pour les associations et entreprises francaises.

Pour en savoir plus, consultez le site officiel : [comptasse.com](https://comptasse.com)

## Table des matières

- [À propos](#a-propos)
- [Démarrage rapide](#demarrage-rapide)
- [Documentation](#documentation)
- [Licence](#licence)
- [Support](#support)

## A propos

Comptasse est une application open source de gestion de comptabilite en partie double. Ce répertoire contient le code source du projet. Il inclut le backend API, l'application web, les schémas partagés et les outils de migration.

## Demarrage rapide

### Option 1 : Avec just (recommande)

Prérequis : [just](https://github.com/casey/just), Docker

```bash
git clone https://github.com/comptasse/comptasse.git
cd comptasse

# Demarrer l'environnement de developpement
just dev up

# Arreter l'environnement
just dev down

# Reinitialiser la base de donnees
just dev reset

# Consulter les logs
just dev logs
```

### Option 2 : Avec Docker Compose

Prérequis : Docker

```bash
git clone https://github.com/comptasse/comptasse.git
cd comptasse

# Demarrer les services
docker compose -f .workflows/dev/compose.yml up -d --build

# Arreter les services
docker compose -f .workflows/dev/compose.yml down

# Consulter les logs
docker compose -f .workflows/dev/compose.yml logs -f
```

### Acces

Une fois l'environnement demarré :

| Service    | URL                     |
|------------|-------------------------|
| Website  | http://localhost:5173   |
| API        | http://localhost:3000   |
| RustFS     | http://localhost:9001   |

**Identifiants de demonstration :** `demo@comptasse.com` / `demo`

Pour plus de détails, consultez le [guide de developpement](docs/DEVELOPMENT.md).

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Vue d'ensemble de l'architecture et du stack technique
- [Configuration](docs/CONFIGURATION.md) - Variables d'environnement et configuration des services
- [Développement](docs/DEVELOPMENT.md) - Guide complet pour les développeurs
- [Contribution](docs/CONTRIBUTING.md) - Guidelines pour contribuer au projet

## Packages

Le projet est organisé en monorepo avec les packages suivants :

- **@comptasse/application-api** - Backend REST API (Hono, PostgreSQL)
- **@comptasse/website** - Interface web (React, TanStack Router)
- **@comptasse/application-metadata** - Schémas et modèles partagés (Valibot, Drizzle ORM)
- **@comptasse/application-tools** - Outils de migration et seed de base de données
- **@comptasse/ui** - Composants UI partagés

Pour plus de details, consultez la [documentation d'architecture](docs/ARCHITECTURE.md).

## Licence

Ce projet est sous licence AGPL-3.0. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Support

- [Signaler un bug](https://github.com/comptasse/comptasse/issues)
- [Proposer une fonctionnalité](https://github.com/comptasse/comptasse/issues)
- Contact : contact@comptasse.com

---

Developpé avec soin pour (et par) la communaute francaise

