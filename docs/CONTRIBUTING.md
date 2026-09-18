# Guide de contribution

Merci de votre interet pour contribuer a Comptasse ! Ce document explique comment participer au developpement du projet.

## Table des matieres

- [Code de conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Configuration de l'environnement](#configuration-de-lenvironnement)
- [Standards de code](#standards-de-code)
- [Convention de commits](#convention-de-commits)
- [Process de pull request](#process-de-pull-request)
- [Tests](#tests)
- [Code review](#code-review)
- [Signaler un bug](#signaler-un-bug)
- [Proposer une fonctionnalite](#proposer-une-fonctionnalité)

## Code de conduite

En participant a ce projet, vous vous engagez a maintenir un environnement respectueux et inclusif. Nous attendons de tous les contributeurs :

- Respect et courtoisie envers les autres contributeurs
- Ouverture d'esprit face aux critiques constructives
- Concentration sur ce qui est le mieux pour la communaute
- Empathie envers les autres membres de la communaute

Les comportements inacceptables incluent le harcelement, les insultes, et tout comportement discriminatoire.

## Comment contribuer

Il existe plusieurs facons de contribuer a Comptasse :

### Signaler des bugs
Ouvrez une issue sur GitHub avec le label `bug`

### Proposer des fonctionnalites
Ouvrez une issue sur GitHub avec le label `enhancement`

### Ameliorer la documentation
La documentation est aussi importante que le code !

### Contribuer du code
Suivez le process decrit dans ce document

### Traductions
Aidez a traduire l'application dans d'autres langues

### Design et UX
Proposez des ameliorations d'interface

## Configuration de l'environnement

Avant de commencer a contribuer, configurez votre environnement de developpement :

> **Windows :** Certains chemins du repository sont longs et peuvent dépasser la limite par défaut de Windows. Avant de cloner, exécutez la commande suivante depuis une invite de commandes **administrateur** :
> ```
> git config --system core.longpaths true
> ```

1. **Fork le repository** sur votre compte GitHub

2. **Cloner votre fork**
   ```bash
   git clone https://github.com/votre-username/comptasse.git
   cd comptasse
   ```

3. **Ajouter le repository principal comme remote**
   ```bash
   git remote add upstream https://github.com/comptasse/comptasse.git
   ```

4. **Choisir votre methode de developpement**

   **Option A : Docker Compose (Recommande)**
   
   ```bash
   # Installer les dependances
   pnpm install
   
   # Lancer les services
   just dev up
   # ou
   docker compose -f .workflows/dev/compose.yml up -d --build
   
   # Configurer l'environnement
   # Suivez les instructions dans DEVELOPMENT.md
   ```
   
   **Option B : Installation native**
   
   ```bash
   # Installer les dependances
   pnpm install
   
   # Configurer l'environnement
   # Suivez les instructions completes dans DEVELOPMENT.md
   ```

5. **Creer une branche pour votre contribution**
   ```bash
   git checkout -b feature/ma-fonctionnalite
   # ou
   git checkout -b fix/mon-correctif
   ```

Pour plus de details, consultez [DEVELOPMENT.md](DEVELOPMENT.md).

## Standards de code

### TypeScript

- **Utiliser TypeScript strict** : Pas de `any`, sauf exception justifiee
- **Typage explicite** pour les fonctions publiques
- **Interfaces vs Types** : Preferer `type` pour les objets simples, `interface` pour l'extension

**Bon exemple :**
```typescript
type User = {
  id: string
  email: string
  alias: string
}

function createUser(data: { email: string, alias: string }): User {
  return {
    id: generateId(),
    ...data,
  }
}
```

**Mauvais exemple :**
```typescript
function createUser(data: any) {  // any
  return {
    id: generateId(),
    ...data,
  }
}
```

### Naming conventions

- **Variables et fonctions** : `camelCase`
- **Types et interfaces** : `PascalCase`
- **Constantes** : `UPPER_SNAKE_CASE` (si vraiment constante)
- **Fichiers** : `camelCase.ts` (y compris les composants React)
- **Barrel files** : `_index.ts`
- **Models** : suffixe `Model` (`accountModel`)
- **Schemas** : pas de suffixe

```typescript
// Variables et fonctions
const userName = 'John'
function getUserById(id: string) { }

// Types
type UserProfile = { }
interface ApiResponse { }

// Constantes
const MAX_RETRY_COUNT = 3

// Fichiers
// api/src/routes/auth/organizations/...
// website/src/components/forms/textInput.tsx
```

### Structure du code

**Ordre des imports :**
```typescript
// 1. Imports de packages externes
import { Hono } from 'hono'
import * as v from 'valibot'

// 2. Imports de workspace packages
import { models } from '@comptasse/application-metadata/models'
import { schemas } from '@comptasse/application-metadata/schemas'

// 3. Imports relatifs du package actuel
import { authFactory } from '#/factories/authFactory.js'
import { validate } from '#/utilities/validate.js'
```

**Note sur les extensions d'import :**
- `packages/api/` et `packages/metadata/` : extensions `.js`
- `packages/website/` : extensions `.ts`/`.tsx`

**Ordre dans les fichiers :**
```typescript
// 1. Imports
import { ... } from '...'

// 2. Types et interfaces
type MyType = { }

// 3. Constantes
const MY_CONSTANT = 'value'

// 4. Fonctions/composants
export function myFunction() { }

// 5. Export par defaut (si applicable)
export default MyComponent
```

### Validation

```typescript
// Toujours importer valibot avec le namespace v
import * as v from 'valibot'

// Utiliser v.object(), v.string(), etc.
const mySchema = v.object({
    name: v.string(),
    age: v.number(),
})

// Inferer les types depuis les schemas
type MyType = v.InferOutput<typeof mySchema>
```

### Biome

Le projet utilise [Biome](https://biomejs.dev/) pour le linting et le formatage du code, configure au niveau racine du monorepo.

**Verifier le linting et le formatage :**
```bash
pnpm check
```

**Fix automatique :**
```bash
pnpm check:fix
```

**Formatage uniquement :**
```bash
pnpm format:fix
```

**Configuration :**
- Biome est configure dans `biome.json` a la racine du projet
- Il couvre tous les packages (api, website, metadata, tools, ui)
- Les regles sont activees par defaut (recommended)

### Formatage

Les regles de formatage sont appliquees automatiquement par Biome (`pnpm format:fix`).

**Indentation :** 4 espaces (pas de tabs)

**Longueur de ligne :** 120 caracteres maximum

**Points-virgules :** Non requis (sauf cas specifiques)

**Quotes :** Doubles `"` de preference

**Trailing commas :** Oui pour les objets et arrays multilignes

```typescript
const user = {
    id: '123',
    name: 'John',
    email: 'john@example.com',  // trailing comma
}
```

### React

**Composants fonctionnels uniquement**
```typescript
export function MyComponent() {
  return <div>Hello</div>
}
```

**Hooks en debut de composant**
```typescript
export function MyComponent() {
  // Hooks en premier
  const [state, setState] = useState()
  const query = useQuery()
  
  // Puis logique
  const handleClick = () => { }
  
  // Puis render
  return <div>...</div>
}
```

**Props destructurees**
```typescript
export function MyComponent({ title, description, onClose }: MyComponentProps) {
  return <div>{title}</div>
}
```

**Utiliser Panda CSS pour le styling** (via `@comptasse/ui`)
```typescript
import { css, cx } from '@comptasse/ui/utilities/cn.js'

// Bon
<div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>

// Eviter les inline styles
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
```

## Convention de commits

Nous utilisons une convention de commits inspiree de [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

### Types

- `feat` : Nouvelle fonctionnalite
- `fix` : Correction de bug
- `docs` : Documentation uniquement
- `style` : Formatage, points-virgules manquants, etc.
- `refactor` : Refactoring sans changement de fonctionnalite
- `perf` : Amelioration de performance
- `test` : Ajout ou correction de tests
- `chore` : Maintenance, dependances, etc.

### Scopes (optionnel)

- `api` : Backend
- `website` : Frontend (dashboard + site vitrine)
- `metadata` : Package metadata
- `tools` : Outils de base de donnees
- `ui` : Composants UI partages
- `docs` : Documentation

### Exemples

```bash
# Nouvelle fonctionnalite
git commit -m "feat(website): add dark mode toggle"

# Correction de bug
git commit -m "fix(api): correct balance calculation in income statement"

# Documentation
git commit -m "docs: update installation instructions"

# Refactoring
git commit -m "refactor(api): extract email templates to separate files"

# Maintenance
git commit -m "chore(deps): update drizzle to v0.45"
```

### Description

- Utiliser l'imperatif ("add" et non "added" ou "adds")
- Pas de majuscule au debut
- Pas de point a la fin
- Maximum 72 caracteres

### Corps du commit (optionnel)

Pour les changements complexes, ajoutez un corps explicatif :

```
feat(api): add export to Excel functionality

Implement Excel export for financial statements using ExcelJS library.
Users can now export balance sheets and income statements.

- Add ExcelJS dependency
- Create export utility functions
- Add export routes for both statement types
- Update documentation
```

## Process de pull request

### 1. Verifier avant de soumettre

```bash
# Verifier que tout compile
pnpm run build

# Verifier le linting et le formatage
pnpm check

# Ou lancer le pipeline CI complet en local (dans Docker, pas besoin de Node.js)
just build

# Tester manuellement les changements
pnpm run dev
```

### 2. Mettre a jour votre branche

```bash
# Recuperer les derniers changements
git fetch upstream
git rebase upstream/main
```

### 3. Pousser votre branche

```bash
git push origin feature/ma-fonctionnalite
```

### 4. Creer la pull request

Sur GitHub :
1. Cliquez sur "New Pull Request"
2. Selectionnez votre branche
3. Remplissez le template de PR :

```markdown
## Description
Breve description des changements

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalite
- [ ] Breaking change
- [ ] Documentation

## Checklist
- [ ] Mon code suit les standards du projet
- [ ] J'ai commente les parties complexes
- [ ] J'ai mis a jour la documentation si necessaire
- [ ] Mes changements ne generent pas de nouveaux warnings
- [ ] J'ai teste localement

## Screenshots (si applicable)
```

### 5. Attendre la review

- Un mainteneur reviewera votre PR
- Repondez aux commentaires et effectuez les modifications demandees
- Une fois approuvee, votre PR sera mergee

## Tests

Actuellement, le projet n'a pas de suite de tests automatises. Les contributions pour ajouter des tests sont bienvenues !

### Tests manuels requis

Avant de soumettre une PR, testez manuellement :

1. **Fonctionnalite ajoutee/modifiee** : Verifiez qu'elle fonctionne comme prevu
2. **Regressions** : Verifiez que vous n'avez rien casse
3. **Cas limites** : Testez les edge cases (valeurs vides, tres grandes, etc.)
4. **Differents navigateurs** : Chrome, Firefox, Safari (si frontend)

### Tests futurs

Nous prevoyons d'ajouter :
- Tests unitaires (Vitest)
- Tests d'integration (Playwright)
- Tests E2E (Playwright)

Les contributions dans ce sens sont encouragees !

## Code review

### Pour les reviewers

- Soyez constructif et respectueux
- Expliquez le "pourquoi" de vos suggestions
- Distinguez les suggestions obligatoires des optionnelles
- Approuvez si les changements sont satisfaisants

### Pour les auteurs de PR

- Ne prenez pas les commentaires personnellement
- Repondez a tous les commentaires (meme avec "Done" ou "Fixed")
- Demandez des clarifications si necessaire
- Remerciez les reviewers pour leur temps

## Signaler un bug

Pour signaler un bug, ouvrez une issue sur GitHub avec :

### Titre
Resume clair et concis du probleme

### Description
- **Description du bug** : Que se passe-t-il ?
- **Comportement attendu** : Que devrait-il se passer ?
- **Etapes pour reproduire** :
  1. Aller sur '...'
  2. Cliquer sur '...'
  3. Voir l'erreur
- **Screenshots** : Si applicable
- **Environnement** :
  - OS : [ex: Ubuntu 22.04]
  - Navigateur : [ex: Chrome 120]
  - Version Node.js : [ex: 25.2.1]
  - Version : [ex: commit SHA ou release]

### Exemple

```markdown
**Description**
Le calcul du compte de resultat affiche des montants negatifs incorrects.

**Comportement attendu**
Les charges doivent apparaitre en positif et etre soustraites du resultat.

**Etapes pour reproduire**
1. Creer un exercice comptable
2. Ajouter des ecritures de charges
3. Consulter le compte de resultat
4. Observer que les montants sont negatifs

**Screenshots**
[capture d'ecran]

**Environnement**
- OS: macOS 14.2
- Navigateur: Firefox 121
- Version: commit abc123
```

## Proposer une fonctionnalite

Pour proposer une nouvelle fonctionnalite, ouvrez une issue sur GitHub avec :

### Titre
Description claire de la fonctionnalite

### Description
- **Probleme a resoudre** : Quel besoin cette fonctionnalite comble-t-elle ?
- **Solution proposee** : Comment voyez-vous cette fonctionnalite ?
- **Alternatives considerees** : Avez-vous pense a d'autres approches ?
- **Contexte supplementaire** : Captures d'ecran, exemples d'autres apps, etc.

### Exemple

```markdown
**Probleme**
Les utilisateurs ne peuvent pas exporter les donnees comptables pour les traiter dans Excel.

**Solution proposee**
Ajouter un bouton "Exporter en Excel" sur chaque etat financier qui genere un fichier .xlsx avec les donnees formatees.

**Alternatives considerees**
- Export CSV : Moins convivial mais plus simple a implementer
- Export PDF : Deja disponible, mais pas editable

**Contexte**
Plusieurs utilisateurs ont demande cette fonctionnalite pour faire des analyses complementaires.
```

## Ressources additionnelles

- [Documentation d'architecture](ARCHITECTURE.md)
- [Guide de developpement](DEVELOPMENT.md)
- [Configuration](CONFIGURATION.md)
- [Issues GitHub](https://github.com/comptasse/comptasse/issues)
- [Discussions GitHub](https://github.com/comptasse/comptasse/discussions)

## Questions ?

Si vous avez des questions sur la contribution, n'hesitez pas a :
- Ouvrir une discussion sur GitHub
- Contacter les mainteneurs
- Consulter les issues et PR existantes

Merci de contribuer a Comptasse !
