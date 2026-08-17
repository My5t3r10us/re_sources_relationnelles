# Plan de déploiement — (RE)Sources Relationnelles

**Bloc INFCDAAL3 — Déployer et sécuriser les applications informatiques**
Version 1.0 · 15 août 2026 · Document du prestataire à destination du Ministère des Solidarités et de la Santé

---

## Sommaire

1. [Contexte et principes directeurs](#1-contexte-et-principes-directeurs)
2. [Environnements](#2-environnements)
3. [Versioning](#3-versioning)
4. [Déploiements automatisés et amélioration continue](#4-déploiements-automatisés-et-amélioration-continue)
5. [Intégration des tests](#5-intégration-des-tests-unitaires-de-performance-et-autres)
6. [Maintenances correctives et évolutives](#6-prise-en-compte-des-maintenances-correctives-et-évolutives)
7. [Pilotage et reporting](#7-pilotage-et-reporting)
8. [Étapes et ressources affectées](#8-étapes-et-ressources-affectées)
9. [Continuité : sauvegarde, restauration, retour arrière](#9-continuité-sauvegarde-restauration-retour-arrière)
10. [Chiffrage](#10-chiffrage)

---

## 1. Contexte et principes directeurs

La plateforme traite des données personnelles de citoyens sur un sujet
sensible — la qualité des relations. Le déploiement est donc conçu autour de
quatre principes.

| Principe | Traduction concrète |
|---|---|
| **Rien ne part en production sans passer la CI** | Le déploiement est un job de la chaîne, conditionné à la réussite de `lint`, `typecheck`, `build`, `test` et `e2e`. |
| **Un environnement se reconstruit depuis zéro** | Schéma de base rejouable depuis une baseline unique, configuration entièrement en variables d'environnement. |
| **Aucun secret dans le dépôt** | `.gitignore` couvre `.env*` ; les valeurs sont portées par les secrets GitHub et Dokploy. `.env.example` documente les variables sans les renseigner. |
| **Le retour arrière est une opération prévue** | Toute mise en production s'accompagne d'un point de retour identifié et d'une procédure écrite. |

### Pile technique

| Couche | Choix | Justification |
|---|---|---|
| Application | Next.js 16 (App Router), React 19, TypeScript | Rendu serveur, une seule base de code pour le front et l'API. |
| Base de données | PostgreSQL 17 + Drizzle ORM | Requêtes paramétrées par construction ; migrations versionnées avec le code. |
| Authentification | better-auth (sessions 24 h, TOTP) | Hachage délégué à une implémentation éprouvée. |
| Stockage fichiers | Objet compatible S3 | Découplé du serveur applicatif : un redéploiement ne perd aucun fichier. |
| Mobile | Expo / React Native | Application pensée « mobile first », distincte de l'adaptation responsive. |
| Intégration continue | GitHub Actions | Intégré au dépôt et à la gestion des évolutions. |
| Exécution | Dokploy + Railpack | PaaS auto-hébergé : maîtrise de la localisation des données, sans exploiter Kubernetes. |

---

## 2. Environnements

Quatre environnements, du poste du développeur à la production.

| | **Développement** | **Test (CI)** | **Préproduction** | **Production** |
|---|---|---|---|---|
| **Rôle** | Développer une fonctionnalité | Valider chaque commit | Recette métier, répétition de la mise en production | Service rendu aux citoyens |
| **Déclencheur** | Manuel (`bun run dev`) | Push et pull request sur `dev`/`staging` | Fusion sur `staging` | Fusion sur `master` |
| **Hébergement** | Poste du développeur | Runner GitHub Actions éphémère | Dokploy — application dédiée | Dokploy — application dédiée |
| **Base** | Postgres local | Postgres 17 en service conteneurisé, détruit à la fin du job | Postgres dédié, jeu de données anonymisé | Postgres dédié, sauvegardé |
| **Bucket** | Bucket de développement | Aucun (client S3 simulé) | Bucket de préproduction | Bucket de production, **privé** |
| **Données** | Jeu de démonstration (`db:seed`) | Fixtures créées et détruites par test | Extraction anonymisée de production | Données réelles |
| **Accès** | Développeur | Public (logs CI) | Équipe projet et référents métier | Citoyens |
| **Indexation** | — | — | Interdite (`X-Robots-Tag: noindex`) | Autorisée |

> **Point de vigilance.** La préproduction ne doit jamais recevoir une copie
> brute de la production : ce serait une communication de données personnelles
> à des personnes non habilitées. L'extraction passe par une anonymisation
> (adresses électroniques réécrites, mots de passe régénérés, `auth_log` vidé).

### Créer un environnement depuis zéro

Procédure identique pour la préproduction et la production, environ 30 minutes.

```bash
# 1. Base de données vierge
createdb resources_prod

# 2. Application Dokploy : source Git, branche cible, build Railpack
#    Variables d'environnement : voir .env.example

# 3. Schéma — la baseline crée l'intégralité des tables
DATABASE_URL=... bun run db:migrate

# 4. Compte super-administrateur initial (hors seed de démonstration)

# 5. Vérification
curl -fsS https://<hôte>/api/health
```

> **Cette procédure n'était pas possible avant la version 1.0.** Le dossier de
> migrations contenait trois paires de doublons et un fichier absent du
> journal : rejouer l'historique sur une base vierge échouait. L'écrasement en
> une baseline unique a rétabli cette propriété, sans laquelle la promesse
> « quatre environnements » ne tient pas.

### Bascule d'une base créée avec `db:push`

Les bases antérieures à la version 1.0 n'ont pas de table de comptabilité des
migrations. **Une seule fois, avant le premier déploiement de la version 1.0 :**

```bash
DATABASE_URL=<url de production> bun run db:baseline
```

Le script refuse de s'exécuter sur une base vierge, pour éviter de déclarer
appliquée une baseline qui ne l'est pas.

---

## 3. Versioning

Le détail et la justification du choix figurent dans
[`GESTION_VERSIONS_ET_EVOLUTIONS.md`](./GESTION_VERSIONS_ET_EVOLUTIONS.md).
Ce qui concerne directement le déploiement :

- **Git + GitHub**, dépôt unique (web, API et application mobile).
- **Flux de promotion** : les branches de travail alimentent `dev`, `dev`
  alimente `staging`, puis `staging` alimente `master`.
- **SemVer** (`MAJEUR.MINEUR.CORRECTIF`) avec un tag annoté par mise en
  production. Le tag est **le point de retour arrière** : c'est lui qui rend
  la procédure du §9 exécutable.
- **Branches protégées** : pas de push direct ; `staging` accepte uniquement
  `dev`, et `master` uniquement `staging`.
- La version est exposée par `GET /api/health`, ce qui permet de vérifier après
  coup *quelle* version est réellement en ligne.

---

## 4. Déploiements automatisés et amélioration continue

### Chaîne d'intégration et de déploiement

La CI est définie dans `.github/workflows/ci.yml` et déclenchée à chaque push
et pull request sur `dev` et `staging`. Elle ne s'exécute jamais sur `master`.

```
                    ┌── lint ────────┐
                    ├── typecheck ───┤
 dev / staging ─────┼── build ───────┼──► deploy (staging → préproduction)
                    ├── test ────────┤         │
                    └── e2e ─────────┘         ▼
                                        webhook Dokploy
                                               │
                                               ▼
                                     Railpack : build de l'image
                                               │
                                               ▼
                              bun run db:migrate && bun run start
                                               │
                                               ▼
                                    GET /api/health → 200

 staging ──► master ──► deploy-production.yml ──► production
                         (aucune CI relancée)
```

Les cinq jobs de contrôle s'exécutent **en parallèle** : un retour rapide
encourage les petits incréments. Le job `deploy-preproduction` porte
`needs: [lint, typecheck, build, test, e2e]` — un seul échec bloque la
préproduction. La production reçoit ensuite exactement le commit recetté sur
`staging`, sans relancer ces contrôles.

### Application des migrations

C'est le point le plus délicat de la chaîne : le webhook Dokploy déclenche un
build, mais **rien n'appliquait le schéma**. Chaque changement de
`db/schema.ts` faisait donc dériver la production.

Railpack n'expose pas de `preDeployCommand` — sa structure `deploy` se limite à
`base`, `inputs`, `startCommand`, `variables` et `paths`. La migration est donc
enchaînée dans la commande de démarrage :

```json
{
  "$schema": "https://schema.railpack.com",
  "deploy": {
    "startCommand": "bun run db:migrate && bun run start"
  }
}
```

Trois propriétés en découlent :

1. **Ordre garanti** — le `&&` interrompt le démarrage si la migration échoue :
   l'application ne tourne jamais sur un schéma incohérent.
2. **Multi-répliques** — `db/migrate.ts` prend un `pg_advisory_lock` avant
   d'appliquer quoi que ce soit. Sans ce verrou, deux répliques démarrant
   simultanément liraient toutes deux une comptabilité vide et la seconde
   échouerait sur un « already exists ».
3. **Indépendance vis-à-vis de `drizzle-kit`** — le migrateur utilise
   `drizzle-orm`, dépendance de production. `drizzle-kit` est une
   devDependency : rien ne garantit sa présence dans l'image après le build.

> **Règle de conception des migrations.** Une migration destructive
> (suppression de colonne, renommage) se déroule en deux mises en production :
> d'abord ajouter et alimenter la nouvelle forme, ensuite seulement supprimer
> l'ancienne. Sans cela, un retour arrière applicatif se heurte à un schéma
> déjà avancé.

### Amélioration continue

| Boucle | Rythme | Ce qui en sort |
|---|---|---|
| Revue de pull request | À chaque évolution | Correction avant fusion |
| Rétrospective d'itération | Toutes les deux semaines | Ajustement du processus |
| Revue des indicateurs (§7) | Mensuelle | Priorisation de la dette |
| Revue de sécurité | Trimestrielle | Mise à jour du plan de sécurisation |

Axes déjà identifiés pour la suite : analyse automatique des dépendances
(Dependabot) et du code (CodeQL), seuil de couverture bloquant, extension de la
matrice de navigateurs aux moteurs Firefox et WebKit, intégration de
l'application mobile à la chaîne.

---

## 5. Intégration des tests unitaires, de performance et autres

### Ce qui tourne aujourd'hui

| Niveau | Outil | Volume | Emplacement | Job CI |
|---|---|---|---|---|
| Unitaire | Vitest + Testing Library | ~380 | `tests/unit/` | `test` |
| Intégration API | Vitest + Supertest, Postgres réel | ~230 | `tests/api/` | `test` |
| Bout en bout | Playwright (Chromium) | 4 scénarios | `tests/e2e/` | `e2e` |
| Qualité statique | ESLint | — | — | `lint` |
| Typage | `tsc --noEmit` | — | — | `typecheck` |

**616 tests, tous au vert** à la version 1.0.

Les tests d'API s'exécutent contre un **PostgreSQL 17 réel** en service
conteneurisé, et non contre une base simulée : les contraintes d'intégrité, les
cascades et le comportement des énumérations sont précisément ce qu'il faut
vérifier. `tests/setup/db.ts` tronque les tables entre chaque test, ce qui
impose une exécution sérialisée (`singleFork`) — coût assumé au profit de la
fidélité.

Le job `e2e` construit l'application **en mode production** puis la démarre,
plutôt que d'utiliser le serveur de développement : c'est l'artefact réellement
déployé qui est éprouvé.

### Tests de non-régression de sécurité

Chaque faille corrigée lors de l'audit est accompagnée d'un test qui échoue si
la correction est défaite. Les droits RGPD suivent la même règle : un test
vérifie notamment que la durée de conservation annoncée dans la politique de
confidentialité correspond à celle que le code applique.

### À construire

| Type | Outil envisagé | Objectif |
|---|---|---|
| Performance | k6 ou Artillery | Tenue de charge du catalogue et de la recherche ; palier à définir avec le ministère. |
| Accessibilité | axe-core dans Playwright | Préalable à l'audit RGAA et à la mise à jour de la déclaration. |
| Charge base | `pg_stat_statements` | Détection des requêtes lentes avant qu'elles n'atteignent la production. |
| Mobile | Maestro | Parcours critiques de l'application Expo. |

---

## 6. Prise en compte des maintenances correctives et évolutives

### Maintenance corrective

| Sévérité | Définition | Prise en charge | Correction visée | Circuit |
|---|---|---|---|---|
| **S1 — Critique** | Service indisponible, fuite de données, faille exploitée | 1 h ouvrée | 4 h | Branche `hotfix/` vers `dev`, CI complète, promotion accélérée par `staging`, puis `master` |
| **S2 — Majeure** | Fonction essentielle inutilisable, sans contournement | 4 h ouvrées | 2 jours ouvrés | Circuit normal, priorité haute |
| **S3 — Mineure** | Gêne avec contournement | 2 jours ouvrés | Itération suivante | Circuit normal |
| **S4 — Cosmétique** | Défaut d'affichage ou de libellé | — | Selon disponibilité | Regroupée |

Un incident S1 déclenche systématiquement une analyse *post mortem* écrite,
sans recherche de responsabilité individuelle, dont la conclusion est un test de
non-régression.

### Maintenance évolutive

Cadence de deux semaines. Toute évolution part d'une issue GitHub qualifiée,
passe par une branche dédiée, une pull request, une revue, la préproduction pour
recette métier, puis la production.

### Maintenance réglementaire et de sécurité

| Tâche | Fréquence | Responsable |
|---|---|---|
| Mise à jour des dépendances | Mensuelle | Développeur |
| Correctif de sécurité critique | Sous 48 h | Lead technique |
| Revue des comptes d'administration | Trimestrielle | Super-administrateur |
| Purge de rétention `auth_log` | **Hebdomadaire, automatisée** | Tâche planifiée |
| Vérification des sauvegardes | Mensuelle | DevOps |
| Test de restauration réel | Trimestrielle | DevOps |
| Revue du registre des traitements | Semestrielle | DPO |

**Ordonnancement de la purge de rétention** — tâche planifiée Dokploy,
hebdomadaire :

```bash
curl -fsS -X POST \
     -H "Authorization: Bearer $CRON_SECRET" \
     https://<hôte>/api/v1/maintenance/purge-auth-log
```

Une exécution en ligne de commande dans le conteneur est également possible
(`bun run db:purge`). Sans `CRON_SECRET`, la route refuse tout appel : une purge
ouverte permettrait d'effacer les traces d'audit sur simple requête.

---

## 7. Pilotage et reporting

### Indicateurs de livraison

| Indicateur | Cible | Source |
|---|---|---|
| Délai commit → production | < 1 jour | GitHub Actions |
| Fréquence de mise en production | ≥ 1 par itération | Tags Git |
| Taux d'échec des mises en production | < 15 % | Historique des runs |
| Délai de rétablissement (S1) | < 4 h | Issues étiquetées `incident` |
| Durée de la CI | < 15 min | GitHub Actions |

### Indicateurs de service

| Indicateur | Cible | Source |
|---|---|---|
| Disponibilité mensuelle | ≥ 99,5 % | Supervision sur `/api/health` |
| Temps de réponse médian | < 500 ms | Journaux Dokploy |
| Latence base (`/api/health`) | < 50 ms | Charge utile de la sonde |
| Taux d'erreurs 5xx | < 0,5 % | Journaux |

### Indicateurs d'usage et de conformité

Le tableau de bord d'administration existant couvre déjà consultations,
recherches, exploitations et créations, avec filtres et export. Il alimente le
reporting mensuel au ministère.

Côté conformité : nombre de demandes RGPD reçues et leur délai de traitement,
nombre de comptes supprimés, volume purgé du journal, nombre de signalements et
délai de modération.

### Supervision

La sonde `GET /api/health` renvoie l'état, la version applicative, l'uptime et
la latence de la base. Elle est délibérément non authentifiée — un
orchestrateur n'a pas de compte — et ne divulgue ni URL de connexion ni détail
d'erreur SQL.

| Fréquence | Seuil d'alerte | Destinataire |
|---|---|---|
| 60 s | 2 échecs consécutifs | Astreinte technique |

### Rapports

| Rapport | Fréquence | Destinataire |
|---|---|---|
| État des mises en production | Par itération | Équipe |
| Tableau de bord de service | Mensuel | Chef de projet ministère |
| Bilan sécurité et conformité | Trimestriel | DPO et ministère |
| Bilan annuel | Annuel | Comité de pilotage |

---

## 8. Étapes et ressources affectées

Rôles : **DEV** développeur · **LEAD** lead technique · **OPS** DevOps ·
**PO** product owner · **DPO** délégué à la protection des données.

### Mise en production courante

| # | Étape | Ressource | Outil | Durée | Automatisé |
|---|---|---|---|---|---|
| 1 | Qualification de l'issue | PO | GitHub Issues | 30 min | Non |
| 2 | Branche `feat/` ou `fix/` | DEV | Git | 5 min | Non |
| 3 | Développement et tests | DEV | Next.js, Vitest | Variable | Non |
| 4 | Pull request | DEV | GitHub | 15 min | Non |
| 5 | `lint` + `typecheck` | — | GitHub Actions | 2 min | **Oui** |
| 6 | `build` | — | GitHub Actions | 3 min | **Oui** |
| 7 | `test` (unitaires + API) | — | Vitest + Postgres 17 | 5 min | **Oui** |
| 8 | `e2e` | — | Playwright | 6 min | **Oui** |
| 9 | Revue de code | LEAD | GitHub | 30 min | Non |
| 10 | Fusion vers `dev` | LEAD | GitHub | 2 min | Non |
| 11 | Promotion vers `staging` et déploiement en préproduction | — | GitHub Actions + Dokploy | 5 min | **Oui** |
| 12 | Recette métier | PO | Navigateur | 1 h | Non |
| 13 | Fusion vers `master` | LEAD | GitHub | 2 min | Non |
| 14 | Tag SemVer + CHANGELOG | LEAD | Git | 10 min | Non |
| 15 | Webhook Dokploy de production, sans nouvelle CI | — | GitHub Actions | 10 s | **Oui** |
| 16 | Build Railpack | — | Railpack | 3 min | **Oui** |
| 17 | Migration du schéma | — | `db/migrate.ts` | 10 s | **Oui** |
| 18 | Démarrage | — | `next start` | 20 s | **Oui** |
| 19 | Vérification `/api/health` | OPS | curl / supervision | 2 min | Partiel |
| 20 | Surveillance renforcée (1 h) | OPS | Journaux Dokploy | 1 h | Non |

**Délai total** : environ 2 h 30 dont ~20 min automatisées, l'essentiel étant la
revue et la recette — les deux étapes humaines qu'il ne faut pas comprimer.

### Correction critique (S1)

| # | Étape | Ressource | Durée cumulée |
|---|---|---|---|
| 1 | Détection (alerte ou signalement) | OPS | T |
| 2 | Qualification, décision de retour arrière | LEAD | T + 15 min |
| 3 | *Si retour arrière* : redéploiement du tag précédent | OPS | T + 30 min |
| 4 | *Sinon* : branche `hotfix/` depuis `dev` | DEV | T + 30 min |
| 5 | Correction et test de non-régression | DEV | T + 2 h |
| 6 | CI complète et revue accélérée | LEAD | T + 2 h 30 |
| 7 | Mise en production et vérification | OPS | T + 3 h |
| 8 | Promotion `dev` → `staging` → `master`, *post mortem* | LEAD | T + 1 jour |
| 9 | *Si données personnelles* : notification CNIL | DPO | **T + 72 h maximum** |

### Mise en service initiale

| # | Étape | Ressource | Durée |
|---|---|---|---|
| 1 | Provisionnement serveur et Dokploy | OPS | 1 j |
| 2 | Postgres, sauvegardes, TLS | OPS | 1 j |
| 3 | Bucket S3 **privé**, URL signées | OPS | 0,5 j |
| 4 | Variables d'environnement et secrets | OPS + LEAD | 0,5 j |
| 5 | Baseline du schéma | OPS | 0,5 j |
| 6 | Supervision et alerting | OPS | 1 j |
| 7 | Tâche planifiée de purge | OPS | 0,5 j |
| 8 | Audit RGAA et corrections | DEV | 3 j |
| 9 | Test de charge | DEV + OPS | 2 j |
| 10 | Recette de bout en bout | PO + DPO | 2 j |
| 11 | Test de restauration réel | OPS | 1 j |
| 12 | Mise en service et surveillance | Équipe | 1 j |

**Total : 14 jours-homme.**

---

## 9. Continuité : sauvegarde, restauration, retour arrière

### Objectifs

| Objectif | Valeur |
|---|---|
| **RTO** (durée maximale d'interruption) | 4 h |
| **RPO** (perte de données maximale) | 24 h, ramené à 1 h avec l'archivage continu des journaux |

### Sauvegardes

| Élément | Méthode | Fréquence | Rétention | Emplacement |
|---|---|---|---|---|
| Base de données | `pg_dump` chiffré | Quotidienne | 30 j glissants + 12 mensuelles | Stockage objet distinct du serveur |
| Journaux de transaction | Archivage continu | Continu | 7 j | Idem |
| Fichiers utilisateurs | Versionnement du bucket | Continu | 30 j | Bucket |
| Configuration | Dépôt Git | À chaque évolution | Illimitée | GitHub |
| Secrets | Coffre-fort | À chaque rotation | — | Hors dépôt |

Deux règles non négociables : **les sauvegardes ne résident pas sur le serveur
qu'elles protègent**, et **une sauvegarde jamais restaurée n'est pas une
sauvegarde** — d'où le test de restauration trimestriel, chronométré et
consigné.

### Retour arrière applicatif

Le tag SemVer rend l'opération triviale : redéployer la version précédente
depuis Dokploy, puis vérifier que `/api/health` renvoie bien le numéro attendu.
Durée visée : moins de 15 minutes.

La limite est le schéma : une migration destructive déjà appliquée n'est pas
annulée par le retour arrière applicatif. C'est la raison de la règle en deux
temps énoncée au §4.

### Restauration complète

| # | Étape | Durée |
|---|---|---|
| 1 | Provisionner un serveur et Dokploy | 1 h |
| 2 | Restaurer la base (`pg_restore` + rejeu des journaux) | 1 h |
| 3 | Restaurer les variables d'environnement depuis le coffre | 15 min |
| 4 | Déployer le dernier tag de production | 30 min |
| 5 | Vérifier `/api/health` et les parcours critiques | 30 min |
| 6 | Rebasculer le DNS | 15 min |

**Total : 3 h 30**, dans l'enveloppe du RTO de 4 h.

---

## 10. Chiffrage

Budget plafond : **90 000 € sur 12 mois**, incluant les versions web et mobile.

### Infrastructure (annuel)

| Poste | Coût |
|---|---|
| Serveur de production (VPS 8 vCPU / 16 Go, UE) | 1 200 € |
| Serveur de préproduction (4 vCPU / 8 Go) | 600 € |
| Stockage objet (500 Go + trafic) | 400 € |
| Sauvegardes externalisées | 200 € |
| Nom de domaine et TLS | 50 € |
| Supervision | 300 € |
| GitHub Actions (au-delà du quota) | 200 € |
| **Sous-total** | **2 950 €** |

### Charge de déploiement et d'exploitation

| Poste | Jours | Coût (500 €/j) |
|---|---|---|
| Mise en service initiale (§8) | 14 | 7 000 € |
| Exploitation courante (2 j/mois) | 24 | 12 000 € |
| Maintenance corrective (provision) | 12 | 6 000 € |
| Audits (RGAA, sécurité, charge) | 8 | 4 000 € |
| **Sous-total** | **58** | **29 000 €** |

**Total déploiement et exploitation : 31 950 €**, soit environ 36 % du budget.
Les 58 000 € restants couvrent la conception, les développements web et mobile,
et la conduite de projet.

---

## Annexes

- [`PLAN_SECURISATION.md`](./PLAN_SECURISATION.md) — plan de sécurisation
- [`GESTION_VERSIONS_ET_EVOLUTIONS.md`](./GESTION_VERSIONS_ET_EVOLUTIONS.md) — outils de gestion des versions et des évolutions
- [`../SECURITY_AUDIT.md`](../SECURITY_AUDIT.md) — audit de sécurité (constats et corrections)
- [`../.env.example`](../.env.example) — variables d'environnement
- [`../.github/workflows/ci.yml`](../.github/workflows/ci.yml) — chaîne d'intégration et de déploiement
- [`../railpack.json`](../railpack.json) — configuration de build et de démarrage
