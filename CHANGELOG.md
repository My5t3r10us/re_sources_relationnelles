# Journal des versions

Toutes les évolutions notables de (RE)Sources Relationnelles sont consignées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
projet applique le [versionnement sémantique](https://semver.org/lang/fr/).
La convention et la procédure de release sont décrites dans
[`docs/GESTION_VERSIONS_ET_EVOLUTIONS.md`](./docs/GESTION_VERSIONS_ET_EVOLUTIONS.md).

## [Non publié]

## [1.0.0] — 2026-08-15

Première version formellement étiquetée. Elle clôt le volet « déployer et
sécuriser » : migrations appliquées automatiquement, droits RGPD des citoyens,
et documentation de déploiement, de sécurisation et de gestion des évolutions.

### Ajouté

- **Migrations appliquées au déploiement.** `db/migrate.ts` s'exécute au
  démarrage du conteneur via `railpack.json`, protégé par un `pg_advisory_lock`
  pour le cas multi-répliques. Railpack n'exposant pas de `preDeployCommand`, la
  migration est enchaînée dans `deploy.startCommand`.
- **`db/baseline.ts`** — marquage one-shot des bases créées avec `db:push`, qui
  n'ont pas de table de comptabilité des migrations. Refuse de s'exécuter sur
  une base vierge.
- **Sonde de santé `GET /api/health`** — état, version applicative, uptime et
  latence de la base. Support de l'attente post-déploiement, de la supervision
  et de la vérification de retour arrière.
- **Droit à l'effacement (art. 17 RGPD)** — suppression de compte depuis le
  profil, après revérification du mot de passe. Les ressources publiées et les
  commentaires visibles sont anonymisés sous « Utilisateur supprimé » ;
  identité, brouillons, fichiers du bucket, favoris, progression et
  signalements sont détruits.
- **Droit à la portabilité (art. 20)** — export JSON de l'ensemble des données
  personnelles depuis le profil.
- **Purge de rétention du journal (art. 5-1-e)** — 180 jours par défaut, via
  `POST /api/v1/maintenance/purge-auth-log` (protégée par `CRON_SECRET`) ou
  `bun run db:purge`.
- **Quatre pages légales** — mentions légales, politique de confidentialité,
  déclaration d'accessibilité RGAA et contact. Les liens du pied de page
  renvoyaient tous un 404.
- **Mention d'information RGPD** au parcours d'inscription (art. 13).
- **Documentation** — `docs/PLAN_DEPLOIEMENT.md`, `docs/PLAN_SECURISATION.md`,
  `docs/GESTION_VERSIONS_ET_EVOLUTIONS.md`, `CONTRIBUTING.md`, `CHANGELOG.md`,
  `.env.example`, modèles d'issues et de pull request, `CODEOWNERS`.
- **Index** sur `auth_log.created_at`.

### Modifié

- **Historique des migrations écrasé en une baseline unique.** Le dossier
  contenait trois paires de doublons (`0003`/`0004`, `0005`/`0006`,
  `0008`/`0009`) et un fichier absent du journal (`0007_add_region_to_resource`)
  : rejouer l'historique sur une base vierge échouait, ce qui rendait impossible
  la création d'un environnement de QA ou de préproduction.
- `packageManager: "bun@1.3.11"` déclaré dans `package.json` — Railpack n'avait
  aucun signal de version.
- `auth_log` ajoutée à l'ordre de troncature des tests : sans clé étrangère vers
  `user`, ses lignes fuyaient d'un test à l'autre.
- `SECURITY_AUDIT.md` mis à jour : F-4, F-5 et F-6 corrigés.

### Sécurité

- `getStoredObjectKey` ajouté à `lib/s3.ts` pour les URL relues depuis la base,
  dont la possession a déjà été vérifiée à l'écriture. Sans lui, les fichiers
  des ressources anonymisées deviendraient orphelins dans le bucket. Ne rouvre
  pas C-4, dont la barrière est posée en amont.
- L'effacement d'un compte met `auth_log.user_id` à `NULL`.

## [0.3.0] — 2026-08-15

### Sécurité

Audit de sécurité complet (revue boîte blanche des 38 routes API, des Server
Actions, de la couche d'authentification, du stockage S3 et du client mobile) et
correction de 17 constats, chacun accompagné d'un test de non-régression.

- **Critiques** — C-1 escalade de privilèges vers `super_admin` ; C-2
  rétrogradation du super-administrateur ; C-3 désactivation de compte sans
  effet sur le site web ; C-4 suppression arbitraire de fichiers du bucket.
- **Élevés** — E-1 contenu non publié lisible publiquement ; E-2 commentaires
  sans vérification de la ressource cible ; E-3 absence de limitation de débit ;
  E-4 proxy d'images ouvert (SSRF) ; E-5 absence d'en-têtes de sécurité HTTP.
- **Moyens** — M-1 validation d'entrée généralisée par schémas Zod ; M-2 codes
  de session via `crypto.getRandomValues()` ; M-3 vérification des octets
  d'en-tête à l'envoi de fichier ; M-4 incréments atomiques du compteur de
  vues ; M-5 `trustedOrigins` sans joker ; M-7 journalisation des actions
  d'administration ; M-8 authentification vérifiée avant le parsing du corps.
- **Faibles** — F-1 seed refusé en production ; F-2 mot de passe porté à 12
  caractères, imposé côté serveur ; F-3 rôle `moderator` clarifié.

**Cause structurelle traitée :** unification des deux couches d'autorisation
divergentes en une source de vérité unique (`lib/session-user.ts`,
`lib/authz.ts`, `lib/validation.ts`). Trois des quatre vulnérabilités critiques
en découlaient.

### Ajouté

- Chaîne d'intégration GitHub Actions : `lint`, `typecheck`, `build`, `test`
  (PostgreSQL 17), `e2e` (Playwright sur build de production), puis déploiement
  Dokploy conditionné à la réussite de l'ensemble.

## [0.2.0] — 2026-08

### Ajouté

- Double authentification TOTP avec codes de secours ; durcissement des
  sessions (24 h glissantes, cookies sécurisés en production).
- Signalement de contenus et page de traitement dédiée.
- Sessions collaboratives : invitation par code, participants, messagerie.
- Soumission d'un brouillon à modération ; création de comptes
  d'administration.
- API REST `/api/v1` et application mobile Expo.
- Internationalisation (8 langues) via next-intl.
- Éditeur de texte enrichi (Tiptap) et envoi de fichiers vers le stockage objet.
- Suite de tests initiale.

### Corrigé

- Suppression des fichiers orphelins du bucket lors de la suppression d'une
  ressource.
- Retrait du niveau de confidentialité « partagé », redondant avec « public ».

## [0.1.0] — 2026

### Ajouté

Socle initial : authentification, catalogue de ressources, fiche ressource,
commentaires et « j'aime », favoris, tableau de bord de progression, back-office
d'administration et de modération, tableau de bord statistique, système de
design « Civic Clarity ».

---

[Non publié]: https://github.com/My5t3r10us/re_sources_relationnelles/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/My5t3r10us/re_sources_relationnelles/releases/tag/v1.0.0
