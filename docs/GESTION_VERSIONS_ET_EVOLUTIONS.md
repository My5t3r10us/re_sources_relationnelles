# Gestion des versions et des évolutions — (RE)Sources Relationnelles

**Bloc INFCDAAL3 — Déployer et sécuriser les applications informatiques**
Version 1.0 · 15 août 2026 · Document du prestataire à destination du Ministère des Solidarités et de la Santé

---

## Sommaire

1. [Outil de gestion des versions](#1-outil-de-gestion-des-versions)
2. [Stratégie de branches](#2-stratégie-de-branches)
3. [Convention de commits](#3-convention-de-commits)
4. [Versionnement sémantique](#4-versionnement-sémantique)
5. [Outil de gestion des évolutions](#5-outil-de-gestion-des-évolutions)
6. [Cycle de vie d'une demande](#6-cycle-de-vie-dune-demande)
7. [Gestion des incidents](#7-gestion-des-incidents)
8. [Pilotage](#8-pilotage)

---

## 1. Outil de gestion des versions

### Choix retenu : Git + GitHub

### Comparaison

| Critère | **Git + GitHub** | GitLab (auto-hébergé) | Subversion |
|---|---|---|---|
| Modèle | Distribué | Distribué | Centralisé |
| Travail hors ligne | ✅ Complet | ✅ Complet | ❌ Serveur requis |
| Coût de branche | Quasi nul | Quasi nul | Élevé |
| Intégration continue | ✅ Actions, intégré | ✅ CI intégrée | ❌ Externe |
| Gestion des demandes | ✅ Issues + Projects | ✅ Issues + Boards | ❌ Externe |
| Revue de code | ✅ Pull requests | ✅ Merge requests | ❌ Externe |
| Charge d'exploitation | Nulle (SaaS) | **Serveur à administrer** | Serveur à administrer |
| Maîtrise des données | Hébergement tiers | ✅ Totale | ✅ Totale |
| Compétence de l'équipe | ✅ Acquise | Partielle | Rare |

### Justification

**Git** s'impose sur le modèle distribué : chaque poste possède l'historique
complet, ce qui constitue une réplique de fait et autorise le travail hors
ligne. Le coût dérisoire d'une branche est ce qui rend praticable la règle
« une évolution = une branche = une revue », fondement du contrôle qualité.
Subversion, centralisé et coûteux en branches, décourage exactement la pratique
que l'on veut installer.

**GitHub** est retenu contre GitLab auto-hébergé pour une raison de charge, non
de fonctionnalité : GitLab imposerait d'administrer, sauvegarder et sécuriser un
serveur supplémentaire — sur un projet de 12 mois avec une équipe de 3 à 5
personnes, cette charge est disproportionnée. GitHub réunit versionnement,
intégration continue (Actions), gestion des demandes (Issues) et revue (Pull
requests) dans un seul outil : **une évolution y est traçable de la demande au
déploiement sans quitter la plateforme**.

**La réserve, énoncée franchement.** Le code est hébergé chez un tiers hors
Union européenne. Elle est acceptable ici parce que **le dépôt ne contient
aucune donnée personnelle de citoyen** : ni base, ni sauvegarde, ni secret
(`.gitignore` couvre `.env*` et `*.pem`, et l'audit a vérifié l'absence de tout
secret dans l'historique). Les données des citoyens résident exclusivement sur
l'infrastructure Dokploy située dans l'UE.

> **Point de bascule.** Si le ministère exigeait la souveraineté du code
> source, la migration vers un GitLab auto-hébergé serait directe : même
> modèle Git, mêmes concepts, portage des workflows CI à prévoir.

### Mise en œuvre

| Élément | État |
|---|---|
| Dépôt | `My5t3r10us/re_sources_relationnelles` — web, API et mobile |
| Branche de production | `master`, **protégée** |
| Protection | Pas de push direct, promotion depuis `staging`, ≥ 1 revue approuvée |
| Étiquettes de version | Tags annotés `vX.Y.Z` |
| Journal des évolutions | `CHANGELOG.md` |

---

## 2. Stratégie de branches

Flux de promotion à trois branches permanentes : développement, préproduction
et production.

```
master   ───────────────●──────────────●────  production
                       /              /
staging  ─────────●───●──────────●───●─────  préproduction
                 /              /
dev      ───●───●──────●──●────●───────────  intégration
            \         /    \  /
feat/…       ●──●────┘      ●┘               une évolution = une branche
```

| Branche | Rôle | Origine | Destination |
|---|---|---|---|
| `master` | Production | `staging` | — |
| `staging` | Préproduction et recette | `dev` | `master` |
| `dev` | Intégration des développements | Branches de travail | `staging` |
| `feat/<sujet>` | Nouvelle fonctionnalité | `dev` | `dev` |
| `fix/<sujet>` | Correction non urgente | `dev` | `dev` |
| `hotfix/<sujet>` | Correction critique prioritaire | `dev` | `dev` |
| `docs/<sujet>` | Documentation seule | `dev` | `dev` |

Le workflow `branch-flow.yml` refuse une promotion vers `staging` qui ne vient
pas de `dev`, ainsi qu'une promotion vers `master` qui ne vient pas de
`staging`. Un correctif urgent suit le même chemin, avec une revue et une
recette accélérées.

Une branche est supprimée après fusion. Une branche de plus de deux semaines est
un signal : le lot est trop gros et doit être découpé.

---

## 3. Convention de commits

**Conventional Commits**, sujets **en français avec accents**.

```
<type>(<portée>): <sujet à l'impératif, sans majuscule initiale, sans point final>

<corps : le POURQUOI — le diff dit déjà le QUOI>

<pied : références d'issues, BREAKING CHANGE>
```

| Type | Usage | Incidence SemVer |
|---|---|---|
| `feat` | Nouvelle fonctionnalité | MINEUR |
| `fix` | Correction | CORRECTIF |
| `docs` | Documentation seule | — |
| `test` | Tests seuls | — |
| `refactor` | Restructuration sans changement de comportement | — |
| `perf` | Amélioration de performance | CORRECTIF |
| `ci` | Chaîne d'intégration | — |
| `chore` | Outillage, dépendances | — |
| `BREAKING CHANGE:` en pied | Rupture de compatibilité | **MAJEUR** |

Portées usuelles : `auth`, `rgpd`, `securite`, `deploiement`, `catalogue`,
`moderation`, `mobile`, `api`, `db`.

**État de l'historique.** La convention n'est suivie que depuis une dizaine de
commits ; les premiers sont libres (`update`, `add fav button`) et la langue
alterne entre français et anglais. **La règle s'applique à partir de la version
1.0** ; l'historique antérieur n'est pas réécrit — une réécriture invaliderait
les empreintes et casserait les clones existants, pour un bénéfice cosmétique.

---

## 4. Versionnement sémantique

**SemVer 2.0.0** — `MAJEUR.MINEUR.CORRECTIF`

| Segment | Incrémenté quand | Exemple |
|---|---|---|
| **MAJEUR** | Rupture de compatibilité de l'API `/api/v1`, migration irréversible, refonte d'un parcours | 1.0.0 → 2.0.0 |
| **MINEUR** | Fonctionnalité rétrocompatible | 1.0.0 → 1.1.0 |
| **CORRECTIF** | Correction rétrocompatible | 1.0.0 → 1.0.1 |

L'API publique versionnée est `/api/v1` : l'application mobile en dépend, et
elle ne se met pas à jour au même rythme que le serveur. Une rupture de contrat
casserait les installations déployées — d'où l'incrément MAJEUR.

### Procédure de release

```bash
# 1. Depuis staging, à jour, CI verte et recette validée
git checkout staging && git pull origin staging

# 2. La version et le CHANGELOG ont déjà suivi dev → staging
# 3. Ouvrir puis fusionner la PR staging → master

# 4. Revenir sur le commit de production effectivement fusionné
git checkout master && git pull origin master

# 5. Tag annoté — c'est LE point de retour arrière
git tag -a v1.1.0 -m "Version 1.1.0 — <résumé>"

# 6. Publier uniquement le tag ; master a déjà été fusionnée par PR
git push origin v1.1.0
```

Le push sur `master` déclenche uniquement le déploiement de production. La
chaîne complète a déjà validé le commit sur `dev` puis `staging`.

> **Le tag n'est pas décoratif.** C'est lui qui rend exécutable la procédure de
> retour arrière du plan de déploiement : redéployer la version précédente
> suppose de pouvoir la désigner. `GET /api/health` expose la version en ligne,
> ce qui permet de vérifier après coup *ce qui tourne réellement*.

### Version 1.0.0

Première version formellement étiquetée. Les développements antérieurs étaient
suivis sous `0.1.0` sans tag ni journal.

**Le tag `v1.0.0` sera posé lors de la fusion sur `master`** — un tag doit
désigner un commit de production, non un commit de branche de travail.

---

## 5. Outil de gestion des évolutions

### Choix retenu : GitHub Issues + GitHub Projects

### Comparaison

| Critère | **GitHub Issues + Projects** | Jira | Redmine | Trello |
|---|---|---|---|---|
| Lien code ↔ demande | ✅ Natif (`closes #12`) | Via connecteur | Via connecteur | ❌ |
| Gestion d'incidents | ✅ Étiquettes + modèles | ✅ Avancée | ✅ Avancée | ⚠️ Sommaire |
| Modèles de saisie | ✅ Formulaires YAML | ✅ | ✅ | ❌ |
| Tableau de suivi | ✅ Projects | ✅ | ✅ | ✅ |
| Automatisation | ✅ Actions | ✅ | ⚠️ | ⚠️ |
| Coût | **Inclus** | Payant | Gratuit + serveur | Freemium |
| Exploitation | Nulle | Nulle (cloud) | **Serveur** | Nulle |
| Courbe d'apprentissage | Faible | **Élevée** | Moyenne | Très faible |

### Justification

L'argument décisif est le **lien natif entre la demande et le code**. Une pull
request contenant `closes #42` ferme l'issue automatiquement à la fusion, et
l'issue affiche en retour les commits, la pull request et les vérifications
associées. La traçabilité « demande → développement → revue → déploiement »
existe alors **sans qu'aucun membre de l'équipe n'ait à la maintenir à la
main** — donc sans qu'elle se dégrade sous la pression du calendrier.

**Jira** est plus riche, notamment pour la gestion de portefeuille, mais sa mise
en place et son coût ne se justifient pas pour une équipe de 3 à 5 personnes ; sa
courbe d'apprentissage consommerait un temps de projet précieux. **Redmine**
imposerait un serveur de plus. **Trello** est trop pauvre : ni modèle de saisie,
ni gestion d'incident, ni lien avec le code.

Le point faible de GitHub Issues est le reporting, moins avancé que celui de
Jira ; les indicateurs du §8 se calculent depuis l'API GitHub, ce qui reste
acceptable au volume du projet.

### Mise en œuvre

| Élément | Fichier |
|---|---|
| Signalement d'anomalie | `.github/ISSUE_TEMPLATE/bug_report.yml` |
| Demande d'évolution | `.github/ISSUE_TEMPLATE/feature_request.yml` |
| Incident de production | `.github/ISSUE_TEMPLATE/incident.yml` |
| Liens de contact | `.github/ISSUE_TEMPLATE/config.yml` |
| Modèle de pull request | `.github/PULL_REQUEST_TEMPLATE.md` |
| Responsables de revue | `.github/CODEOWNERS` |

Les modèles sont des **formulaires structurés** (YAML) et non du texte libre :
les champs obligatoires — version, environnement, étapes de reproduction —
garantissent qu'une demande arrive qualifiée. Une anomalie sans étapes de
reproduction coûte plus cher à instruire qu'à corriger.

> **La faille de sécurité fait exception.** Elle ne se déclare **jamais** dans
> une issue publique : `config.yml` redirige vers un canal privé. Publier une
> vulnérabilité non corrigée revient à en publier le mode d'emploi.

### Étiquettes

| Famille | Valeurs |
|---|---|
| Type | `bug`, `feature`, `incident`, `documentation`, `securite`, `rgpd`, `dette-technique` |
| Sévérité | `S1-critique`, `S2-majeure`, `S3-mineure`, `S4-cosmetique` |
| Priorité | `P0-immediat`, `P1-haute`, `P2-normale`, `P3-basse` |
| État | `triage`, `pret`, `en-cours`, `en-revue`, `en-recette`, `bloque` |
| Domaine | `front`, `api`, `mobile`, `base-de-donnees`, `infra`, `ci` |

---

## 6. Cycle de vie d'une demande

```
Création ──► Triage ──► Prêt ──► En cours ──► En revue ──► Recette ──► Production ──► Clôturé
   │           │                                              │
   │           └──► Refusé / Doublon                          └──► Retour en cours
   └──► Signalement citoyen (support ou bouton de signalement)
```

| Étape | Responsable | Sortie attendue |
|---|---|---|
| **Création** | Tout membre, support, citoyen | Issue au bon modèle |
| **Triage** (hebdomadaire) | PO + LEAD | Type, sévérité, priorité, domaine, jalon |
| **Prêt** | PO | Critères d'acceptation explicites |
| **En cours** | DEV | Branche `feat/` ou `fix/` |
| **En revue** | LEAD | Pull request, CI verte, revue approuvée |
| **Recette** | PO | Validation en préproduction |
| **Production** | LEAD | Fusion sur `master`, tag |
| **Clôturé** | — | Fermeture automatique par `closes #n` |

**Critères d'acceptation.** Une issue ne passe pas en « Prêt » sans eux :
c'est ce qui permet de savoir quand elle est terminée, et ce qui empêche la
dérive du périmètre en cours de développement.

**Grille de revue** — autorisation, validation d'entrée, journalisation,
absence de secret, tests, lisibilité, commentaires expliquant le *pourquoi*.

---

## 7. Gestion des incidents

Sévérités, délais de prise en charge et de correction : voir
[`PLAN_DEPLOIEMENT.md` §6](./PLAN_DEPLOIEMENT.md#6-prise-en-compte-des-maintenances-correctives-et-évolutives).

### Circuit d'un incident critique (S1)

1. **Ouverture immédiate** d'une issue `incident` + `S1-critique` — même en
   pleine résolution : elle sert de main courante horodatée.
2. **Décision** : retour arrière sur le tag précédent, ou correctif.
3. **Branche `hotfix/` depuis `dev`**, limitée au correctif.
4. **CI complète** — un incident ne justifie pas de court-circuiter les
   contrôles ; c'est précisément le moment où une seconde erreur coûte le plus
   cher.
5. **Mise en production et vérification** via `/api/health`.
6. **Promotion accélérée `dev` → `staging` → `master`.**
7. **Si données personnelles : notification CNIL sous 72 h** (DPO).
8. **Analyse *post mortem*** sous une semaine, conclue par un **test de
   non-régression**.

> **Règle.** Un incident n'est clos qu'accompagné d'un test qui échouerait si
> le défaut réapparaissait. Sans cela, la correction n'est qu'une réparation.

---

## 8. Pilotage

| Indicateur | Cible | Source |
|---|---|---|
| Délai de triage | < 2 jours ouvrés | Issues |
| Délai de correction S1 | < 4 h | Issues `incident` |
| Délai de correction S2 | < 2 jours ouvrés | Issues |
| Issues fermées par itération | ≥ 8 | Projects |
| Taux de réouverture | < 10 % | Issues |
| Âge moyen des issues ouvertes | < 30 jours | Issues |
| Couverture de tests | ≥ 70 % | Vitest |
| Délai de revue | < 1 jour ouvré | Pull requests |

Revue mensuelle en comité de projet. Une dérive durable d'un indicateur
déclenche un point dédié en rétrospective — l'indicateur sert à ouvrir une
discussion, pas à évaluer des personnes.

---

## Annexes

- [`PLAN_DEPLOIEMENT.md`](./PLAN_DEPLOIEMENT.md) — plan de déploiement
- [`PLAN_SECURISATION.md`](./PLAN_SECURISATION.md) — plan de sécurisation
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — guide de contribution
- [`../CHANGELOG.md`](../CHANGELOG.md) — journal des versions
