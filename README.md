# (RE)Sources Relationnelles

Version 1.0.0

(RE)Sources Relationnelles est un projet ministériel simulé réalisé dans un cadre pédagogique. La plateforme centralise des ressources fiables autour des relations humaines et permet aux citoyens, modérateurs et administrateurs de les publier, les partager et les exploiter.

## Fonctionnalités

- Catalogue public et référentiel dynamique par catégorie, type de média et région.
- Création et partage de ressources privées, partagées ou publiques.
- Cycle de validation avec brouillons, file de modération, publication et suspension.
- Commentaires, réponses, mentions J'aime et signalements.
- Suivi personnel avec favoris, ressources exploitées et mises de côté.
- Sessions collaboratives avec participants et messagerie.
- Statistiques d'activité, d'engagement, de modération et de progression.
- Back-office de gestion des utilisateurs, ressources, catégories et signalements.
- Interface disponible en huit langues : français, anglais, allemand, espagnol, italien, néerlandais, polonais et portugais.
- Droits RGPD d'effacement et de portabilité des données personnelles.

## Stack technique

| Périmètre | Technologies |
| --- | --- |
| Web | Next.js 16 avec App Router, React 19, TypeScript, Tailwind CSS 4 |
| Données | Drizzle ORM, PostgreSQL 17 |
| Authentification | better-auth, authentification à deux facteurs TOTP |
| Stockage | API S3 compatible Tigris |
| Internationalisation | next-intl |
| Mobile | Expo, expo-router, NativeWind, Zustand |
| Tests | Vitest, Playwright, Maestro |
| Retours utilisateurs | Fider (portail auto-hébergé) |
| Supervision | OneUptime via OpenTelemetry (OTLP/HTTP) |

## Arborescence

| Dossier | Rôle |
| --- | --- |
| `app/` | Routes, pages, layouts, actions serveur et API Next.js |
| `components/` | Composants d'interface partagés |
| `lib/` | Services, règles métier, sécurité et utilitaires |
| `db/` | Schéma Drizzle, connexion et jeu de données de démonstration |
| `migrations/` | Migrations SQL versionnées |
| `messages/` | Traductions des huit langues prises en charge |
| `mobile/` | Application Expo pour iOS, Android et le développement web |
| `tests/` | Tests unitaires, API et end-to-end |
| `docs/` | Plans de sécurité, déploiement et maintenance |
| `design/` | Maquettes et règles visuelles du projet |

## Démarrage

### Prérequis

- Bun 1.3.11
- Node.js 20.9 ou supérieur
- PostgreSQL 17

### Application web

```bash
bun install
cp .env.example .env
bun run db:push
bun run db:seed
bun run dev
```

L'application est ensuite accessible sur `http://localhost:3000`.

### Application mobile

L'application mobile possède son propre lockfile npm. Depuis `mobile/` :

```bash
npm install
npm start
```

Renseigner `EXPO_PUBLIC_API_URL` dans `mobile/.env` avec l'adresse de l'API accessible depuis le simulateur ou l'appareil.

## Variables d'environnement

Les valeurs sensibles doivent rester dans les fichiers d'environnement locaux ou dans le gestionnaire de secrets de la plateforme de déploiement.

| Variable | Rôle | Requise |
| --- | --- | --- |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL | Oui |
| `BETTER_AUTH_SECRET` | Secret de signature des sessions better-auth | Oui |
| `BETTER_AUTH_URL` | URL de base utilisée par better-auth | Oui |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'application | Oui |
| `AWS_ACCESS_KEY_ID` | Identifiant du stockage S3 | Pour les fichiers |
| `AWS_SECRET_ACCESS_KEY` | Secret du stockage S3 | Pour les fichiers |
| `AWS_BUCKET` | Nom du bucket S3 | Pour les fichiers |
| `AWS_REGION` | Région du stockage S3 | Pour les fichiers |
| `AWS_ENDPOINT_URL_S3` | Point d'accès de l'API S3 | Pour les fichiers |
| `AWS_PUBLIC_URL` | URL publique des fichiers, lue à la compilation | Pour les fichiers |
| `CRON_SECRET` | Secret protégeant les tâches planifiées internes | Oui en production |
| `AUTH_LOG_RETENTION_DAYS` | Durée de conservation des journaux d'authentification | Non |
| `FIDER_URL` | URL de l'instance Fider, vue depuis le serveur | Pour les retours |
| `FIDER_API_KEY` | Clé d'API Fider, strictement serveur | Pour les retours |
| `NEXT_PUBLIC_FIDER_URL` | URL publique du portail de retours | Pour les retours |
| `ONEUPTIME_OTLP_ENDPOINT` | Racine OTLP de l'instance OneUptime | Pour la supervision |
| `ONEUPTIME_OTLP_TOKEN` | Jeton d'ingestion OneUptime | Pour la supervision |
| `ONEUPTIME_SERVICE_NAME` | Nom du service dans OneUptime | Non |

Les deux intégrations sont facultatives et inactives tant que leurs variables
ne sont pas renseignées : le bouton de retour n'est alors pas affiché, et
aucune télémétrie n'est émise.

## Seed

`db/seed.ts` choisit son mode automatiquement selon l'environnement détecté
(`NODE_ENV`, `APP_ENV`, `VERCEL_ENV`, `RAILWAY_ENVIRONMENT_NAME`). `SEED_MODE`
force le mode, ce qui est nécessaire en préproduction : rien ne la distingue
automatiquement de la production.

| Mode | Déclenchement | Effet |
| --- | --- | --- |
| Démonstration | Environnement autre que production | Vide les tables, puis insère le jeu complet (12 comptes, 40 ressources, commentaires, signalements, sessions) |
| Contenu seul | Environnement de production, ou `SEED_MODE=production` | N'efface rien : insère les 8 catégories et les 40 ressources éditoriales, plus un unique compte administrateur qui les porte |

En mode contenu seul, aucun compte de démonstration n'est créé. Le compte
éditorial (`SEED_ADMIN_EMAIL`, par défaut `contenu@ressources.local`) reçoit un
mot de passe aléatoire affiché **une seule fois** en fin d'exécution : il n'est
stocké que haché, donc à conserver puis à changer après la première connexion.
Les écritures sont conditionnelles, une seconde exécution ne duplique rien et
ne régénère pas le mot de passe.

### Comptes de démonstration

Créés uniquement en mode démonstration. Le mot de passe commun est défini par
`SEED_PASSWORD`.

| E-mail | Rôle |
| --- | --- |
| `superadmin@ressources.local` | Super-administrateur |
| `admin@ressources.local` | Administrateur |
| `moderation1@ressources.local` | Modérateur |
| `moderation2@ressources.local` | Modérateur |
| `alice@ressources.local` | Citoyenne |
| `bilal@ressources.local` | Citoyen |
| `claire@ressources.local` | Citoyenne |
| `david@ressources.local` | Citoyen |
| `emma@ressources.local` | Citoyenne |
| `farid@ressources.local` | Citoyen |
| `gabrielle@ressources.local` | Citoyenne |
| `hugo@ressources.local` | Citoyen désactivé |

## Commandes

| Usage | Commande | Description |
| --- | --- | --- |
| Développement | `bun run dev` | Lance Next.js en développement |
| Production | `bun run build` | Compile l'application |
| Production | `bun run start` | Lance l'application compilée |
| Qualité | `bun run lint` | Vérifie les règles ESLint |
| Qualité | `bun run typecheck` | Génère les types Next.js puis vérifie TypeScript |
| Base | `bun run db:generate` | Génère une migration Drizzle |
| Base | `bun run db:push` | Synchronise le schéma local |
| Base | `bun run db:migrate` | Exécute les migrations |
| Base | `bun run db:baseline` | Initialise la référence des migrations |
| Base | `bun run db:purge` | Purge les données locales |
| Base | `bun run db:studio` | Ouvre Drizzle Studio |
| Base | `bun run db:seed` | Insère les données de démonstration |
| Base de test | `bun run db:test:push` | Synchronise le schéma de la base de test |
| Base de test | `bun run db:test:generate` | Génère les migrations avec l'environnement de test |
| Base de test | `bun run db:test:studio` | Ouvre Drizzle Studio sur la base de test |
| Tests | `bun run test` | Lance la suite Vitest |
| Tests | `bun run test:watch` | Relance Vitest à chaque modification |
| Tests | `bun run test:unit` | Lance les tests unitaires |
| Tests | `bun run test:api` | Lance les tests d'API |
| Tests | `bun run test:coverage` | Produit le rapport de couverture |
| Tests | `bun run test:e2e` | Lance les tests Playwright |
| Tests | `bun run test:e2e:ui` | Ouvre l'interface Playwright |
| Tests | `bun run test:e2e:install` | Installe les navigateurs Playwright et leurs dépendances |

## Tests

Les tests unitaires et d'API utilisent Vitest. Les parcours web de bout en bout utilisent Playwright, tandis que les parcours mobiles sont décrits avec Maestro.

```bash
bun run test:unit
bun run test:api
bun run test:e2e

cd mobile
npx maestro test .maestro/flows
```

## CI/CD

Le flux de promotion est `dev` → `staging` → `master`. Le workflow
`.github/workflows/ci.yml` exécute le lint, la vérification TypeScript, la
compilation, les tests avec couverture et les parcours Playwright sur `dev` et
`staging`. Une validation réussie de `staging` déclenche le déploiement Dokploy
de préproduction. `master` ne relance pas la CI : son workflow dédié déclenche
uniquement le déploiement de production.

Le workflow `.github/workflows/audit-dependances.yml` analyse tous les deux
jours les dépendances web avec Bun et mobiles avec npm, en récupérant toujours
le contenu de `master`. Les vulnérabilités de sévérité modérée ou supérieure
sont regroupées dans une issue GitHub dédiée et le rapport reste disponible
comme artefact du run.

## Sécurité et RGPD

L'état des contrôles techniques et des remédiations est détaillé dans [SECURITY_AUDIT.md](SECURITY_AUDIT.md). Le projet implémente notamment l'effacement de compte, la portabilité des données et une purge de rétention des journaux d'authentification.

Les procédures associées sont décrites dans le [plan de sécurisation](docs/PLAN_SECURISATION.md), le [plan de déploiement](docs/PLAN_DEPLOIEMENT.md) et le [plan de gestion des versions et évolutions](docs/GESTION_VERSIONS_ET_EVOLUTIONS.md).

## Documentation

- [Plan de sécurisation](docs/PLAN_SECURISATION.md)
- [Plan de déploiement](docs/PLAN_DEPLOIEMENT.md)
- [Gestion des versions et évolutions](docs/GESTION_VERSIONS_ET_EVOLUTIONS.md)
- [Guide de contribution](CONTRIBUTING.md)
- [Journal des changements](CHANGELOG.md)
- [Audit de sécurité](SECURITY_AUDIT.md)

## Licence et cadre pédagogique

Ce projet a été réalisé dans le cadre d'une formation. Il simule une plateforme ministérielle à des fins pédagogiques et n'est affilié à aucun ministère ni organisme public.
