# Guide de contribution

Merci de contribuer à (RE)Sources Relationnelles. Ce guide décrit les règles de
travail de l'équipe. Les choix d'outillage sont justifiés dans
[`docs/GESTION_VERSIONS_ET_EVOLUTIONS.md`](./docs/GESTION_VERSIONS_ET_EVOLUTIONS.md).

---

## Mise en route

### Prérequis

- **Bun 1.3.11** (version épinglée par `packageManager`)
- **PostgreSQL 17**
- Un bucket compatible S3 pour l'envoi de fichiers (facultatif en local)

### Installation

```bash
git clone https://github.com/My5t3r10us/re_sources_relationnelles.git
cd re_sources_relationnelles
bun install

cp .env.example .env        # puis renseigner les valeurs
createdb resources

bun run db:migrate          # applique le schéma
bun run db:seed             # jeu de démonstration (refusé en production)
bun run dev
```

### Base de test

Elle doit être **distincte** de la base de développement : `tests/setup/db.ts`
tronque toutes les tables entre chaque test.

```bash
cp .env.test.example .env.test
createdb resources_test
bun run db:test:push
```

---

## Commandes

| Commande | Rôle |
|---|---|
| `bun run dev` | Serveur de développement |
| `bun run build` | Build de production |
| `bun run lint` | ESLint |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` | Tests unitaires et API |
| `bun run test:coverage` | Tests avec couverture |
| `bun run test:e2e` | Tests Playwright |
| `bun run db:generate` | Génère une migration depuis `db/schema.ts` |
| `bun run db:migrate` | Applique les migrations |
| `bun run db:baseline` | Marque une base existante comme migrée (**une seule fois**) |
| `bun run db:purge` | Purge de rétention du journal |

---

## Branches

| Préfixe | Origine | Usage |
|---|---|---|
| `feat/` | `develop` | Nouvelle fonctionnalité |
| `fix/` | `develop` | Correction non urgente |
| `hotfix/` | **`master`** | Correction critique en production |
| `docs/` | `develop` | Documentation seule |

`master` est protégée : pas de push direct, CI verte et une revue approuvée
obligatoires.

> Un `hotfix/` part de `master`, jamais de `develop` : un correctif urgent ne
> doit embarquer que la correction, pas les évolutions en cours d'intégration.
> Le report sur `develop` après mise en production est obligatoire.

Une branche de plus de deux semaines signale un lot trop gros : découpez-le.

---

## Commits

**Conventional Commits**, sujets en **français avec accents**.

```
<type>(<portée>): <sujet à l'impératif, sans majuscule, sans point final>

<corps : le POURQUOI — le diff dit déjà le QUOI>

<pied : closes #42, BREAKING CHANGE:>
```

Types : `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `ci`, `chore`.
Portées usuelles : `auth`, `rgpd`, `securite`, `deploiement`, `catalogue`,
`moderation`, `mobile`, `api`, `db`.

```
fix(securite): valide le role a l'execution dans updateUserRole

Le type union n'existait qu'a la compilation. Une Server Action etant une route
HTTP reelle, tout administrateur pouvait s'attribuer super_admin.

closes #42
```

---

## Pull requests

1. Branche à jour sur `develop`.
2. `bun run lint`, `bun run typecheck` et `bun run test` au vert **en local**.
3. Modèle de pull request rempli.
4. Lien vers l'issue (`closes #n`).
5. Une revue approuvée minimum.

### Grille de revue

- [ ] **Autorisation** — chaque point d'entrée vérifie le rôle, relu en base
- [ ] **Validation** — toute entrée passe par un schéma Zod
- [ ] **Journalisation** — les actions d'administration sont tracées
- [ ] **Secrets** — aucune valeur sensible dans le code ni les journaux
- [ ] **Tests** — le comportement nouveau est couvert
- [ ] **Commentaires** — ils expliquent le *pourquoi*, jamais le *quoi*

---

## Règles de code

### La règle centrale

> **Toute fonction exportée d'un fichier `"use server"` est une route HTTP
> publique.** Ses arguments arrivent du réseau, et le type TypeScript disparaît
> à la compilation.

Chaque Server Action commence donc par :

```ts
const donnees = parseOrThrow(monSchema, entree);
```

Ignorer cette règle a produit la vulnérabilité critique C-1.

### Autorisation

Ne jamais faire confiance au cookie pour le rôle ou l'état du compte. Utilisez
les gardes existantes :

| Contexte | Fonction | Module |
|---|---|---|
| Server Action / page | `requireUser`, `requireAdmin`, `requireSuperAdmin` | `lib/auth-server.ts` |
| Route API | `requireApiAuth`, `requireApiAdmin` | `lib/api-auth.ts` |
| Règles métier | `canManageUser`, `canAssignRole` | `lib/authz.ts` |

### Réponses d'API

Toujours `apiSuccess` / `apiError` de `lib/api-response.ts` — jamais un
`NextResponse.json` nu. L'enveloppe `{ data, error }` est le contrat de
l'application mobile.

### Migrations

```bash
# 1. Modifier db/schema.ts
# 2. Générer
bun run db:generate
# 3. Relire le SQL produit AVANT de committer
# 4. Vérifier sur une base vierge
```

> **Migration destructive** (suppression de colonne, renommage) : la dérouler en
> **deux mises en production** — d'abord ajouter et alimenter la nouvelle forme,
> ensuite seulement supprimer l'ancienne. Sans cela, un retour arrière
> applicatif se heurte à un schéma déjà avancé.

### Tests

- **Unitaire** (`tests/unit/`) — composants et fonctions pures.
- **API** (`tests/api/`) — routes et logique métier, contre un **PostgreSQL
  réel** : contraintes, cascades et énumérations sont précisément ce qu'il faut
  vérifier.
- **E2E** (`tests/e2e/`) — parcours complets.

**Toute correction de sécurité s'accompagne d'un test qui échoue si la
correction est défaite.**

### Style

- Interface et messages d'erreur **en français**.
- Système de design : voir `design/civic_clarity/DESIGN.md`. En particulier,
  pas de bordure 1px pour séparer des sections — la hiérarchie passe par les
  niveaux de surface.
- Les pages statiques restent **synchrones et sans props**, pour rester
  compatibles avec `tests/unit/pages/static-pages.test.tsx`.

### Next.js 16

Cette version comporte des ruptures par rapport aux versions antérieures.
**Consultez `node_modules/next/dist/docs/` avant d'écrire du code Next**, comme
le rappelle `AGENTS.md`.

---

## Signaler

| Nature | Canal |
|---|---|
| Anomalie | Issue — modèle *Signalement d'anomalie* |
| Évolution | Issue — modèle *Demande d'évolution* |
| Incident de production | Issue — modèle *Incident* + étiquette `S1-critique` |
| **Faille de sécurité** | **Jamais dans une issue publique** — voir `.github/ISSUE_TEMPLATE/config.yml` |

Publier une vulnérabilité non corrigée revient à en publier le mode d'emploi.

---

## Publier une version

Réservé au lead technique. Procédure détaillée dans
[`docs/GESTION_VERSIONS_ET_EVOLUTIONS.md` §4](./docs/GESTION_VERSIONS_ET_EVOLUTIONS.md#4-versionnement-sémantique).
