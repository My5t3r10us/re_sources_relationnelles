# Plan de sécurisation — (RE)Sources Relationnelles

**Bloc INFCDAAL3 — Déployer et sécuriser les applications informatiques**
Version 1.0 · 15 août 2026 · Document du prestataire à destination du Ministère des Solidarités et de la Santé

---

## Sommaire

1. [Périmètre et biens à protéger](#1-périmètre-et-biens-à-protéger)
2. [Identification des vulnérabilités](#2-identification-des-vulnérabilités)
3. [Risques et criticité](#3-risques-et-criticité)
4. [Solutions de chiffrement](#4-solutions-de-chiffrement)
5. [Structuration des développements et bonnes pratiques](#5-structuration-des-développements-et-bonnes-pratiques)
6. [Méthodologie de continuité et de reprise d'activité](#6-méthodologie-de-continuité-et-de-reprise-dactivité)
7. [Conformité RGPD](#7-conformité-rgpd)
8. [Risques résiduels acceptés](#8-risques-résiduels-acceptés)

> **Positionnement.** Ce document est le **plan** : ce que l'on protège,
> contre quoi, par quels moyens, et comment on réagit. L'audit
> [`SECURITY_AUDIT.md`](../SECURITY_AUDIT.md) en est l'**annexe factuelle** :
> le relevé des vulnérabilités constatées et de leurs corrections. Les
> références `C-n`, `E-n`, `M-n`, `F-n` renvoient à ses constats.

---

## 1. Périmètre et biens à protéger

### Périmètre

Application Next.js 16 (`app/`, `lib/`, `db/`), API REST `/api/v1` (38 routes),
Server Actions, application mobile Expo (`mobile/`), base PostgreSQL, stockage
objet compatible S3, chaîne d'intégration et infrastructure Dokploy.

### Biens essentiels

| Bien | Sensibilité | Ce qui est en jeu |
|---|---|---|
| **Identités des citoyens** | Élevée | Adresse électronique, nom, empreinte de mot de passe, secret TOTP |
| **Ressources privées** | Élevée | Contenus personnels sur la vie relationnelle — vie privée |
| **Messages des sessions collaboratives** | Élevée | Échanges entre citoyens dans un cadre de confiance |
| **Journal d'authentification** | Moyenne | Adresses IP et user-agents : données personnelles |
| **Catalogue public** | Moyenne | Intégrité de l'information de santé publique |
| **Comptes d'administration** | Critique | Compromission = contrôle de la plateforme entière |

> Le sujet traité — la qualité des relations familiales, conjugales,
> amicales — n'est pas juridiquement une donnée de santé, mais une ressource
> privée peut en révéler autant. Le niveau de protection retenu est celui des
> données sensibles, sans attendre la qualification juridique.

### Critères de sécurité

| Critère | Exigence |
|---|---|
| **Confidentialité** | Aucune donnée privée accessible hors de son propriétaire et des personnes habilitées |
| **Intégrité** | Aucune modification non autorisée d'un contenu ou d'un rôle |
| **Disponibilité** | 99,5 % mensuel |
| **Traçabilité** | Toute action d'administration journalisée et imputable |

---

## 2. Identification des vulnérabilités

### Méthode

| Aspect | Choix |
|---|---|
| Approche | Revue de code **boîte blanche** — accès intégral au code source |
| Couverture | 100 % des points d'entrée : 38 routes API, 5 fichiers de Server Actions, layouts et pages à contrôle d'accès, couche d'authentification, stockage S3, client mobile |
| Référentiel | OWASP Top 10 (2021), guides d'hygiène ANSSI, recommandations CNIL |
| Non couvert | Test d'intrusion dynamique et configuration d'infrastructure ; l'audit des dépendances est désormais automatisé (§5.7) |

**Principe retenu.** La revue statique exhaustive a été préférée à un test
d'intrusion ponctuel : elle trouve les défauts *structurels*, là qu'un
test dynamique révèle surtout les défauts exploitables au moment du test. Les
deux sont complémentaires ; le test d'intrusion reste à programmer avant la
mise en service réelle.

### Résultat

| Sévérité | Nombre | Corrigées |
|---|---|---|
| 🔴 Critique | 4 | 4 |
| 🟠 Élevée | 5 | 5 |
| 🟡 Moyenne | 8 | 8 |
| 🔵 Faible / RGPD | 6 | 5 |

### La cause structurelle

Trois des quatre vulnérabilités critiques découlaient d'une **même cause** :
l'existence de **deux couches d'autorisation divergentes**. L'API `/api/v1`
validait l'état du compte via `lib/api-auth.ts`, tandis que le site web
(Server Actions et pages) passait par `lib/auth-server.ts`, qui ne faisait
aucune vérification métier. Un compte désactivé restait pleinement fonctionnel
sur le site web (C-3).

S'y ajoutait une confiance mal placée dans le typage : `updateUserRole` acceptait
`role: "citizen" | "moderator" | "admin"`, contrainte qui **n'existe qu'à la
compilation**. Une Server Action étant une route HTTP réelle, tout administrateur
pouvait s'attribuer `super_admin` (C-1).

**Correction structurelle plutôt que cas par cas :**

- `lib/session-user.ts` — source de vérité unique : rôle et état du compte relus
  en base, jamais issus du cookie.
- `lib/authz.ts` — règles d'autorisation centralisées.
- `lib/validation.ts` — schémas Zod à l'exécution sur chaque point d'entrée.

### Correspondance OWASP Top 10

| Catégorie | Constats | État |
|---|---|---|
| A01 Contrôle d'accès défaillant | C-1, C-2, C-3, C-4, E-1, E-2 | ✅ |
| A02 Défaillance cryptographique | M-2 (aléa prédictible) | ✅ |
| A03 Injection | *Aucune* | ✅ Vérifié |
| A04 Conception non sécurisée | C-1 (typage compile-time) | ✅ |
| A05 Mauvaise configuration | E-5, M-5 | ✅ (CSP à durcir) |
| A06 Composants vulnérables | Audit Bun et npm tous les deux jours | ✅ Automatisé |
| A07 Défaillance d'authentification | E-3 (pas de limitation de débit) | ✅ |
| A08 Intégrité logicielle | M-3, M-4 | ✅ |
| A09 Journalisation insuffisante | M-7 | ✅ |
| A10 SSRF | E-4 (proxy d'images ouvert) | ✅ |

**Absences confirmées après vérification explicite** — aucune injection SQL
(Drizzle en requêtes paramétrées partout), aucune XSS (zéro
`dangerouslySetInnerHTML`, `react-markdown` sans `rehype-raw`), aucun secret
dans l'historique Git.

---

## 3. Risques et criticité

### Échelle

**Vraisemblance** — 1 improbable · 2 possible · 3 probable · 4 quasi certain
**Impact** — 1 négligeable · 2 modéré · 3 grave · 4 critique
**Criticité** = Vraisemblance × Impact

| Criticité | Niveau | Traitement |
|---|---|---|
| 12–16 | 🔴 Inacceptable | Correction avant toute mise en service |
| 6–9 | 🟠 Élevé | Correction sous deux semaines |
| 3–4 | 🟡 Modéré | Correction planifiée |
| 1–2 | 🟢 Faible | Accepté et surveillé |

### Matrice

| # | Scénario redouté | V | I | C | Traitement | État |
|---|---|:-:|:-:|:-:|---|---|
| R1 | Un administrateur s'octroie `super_admin` (C-1) | 3 | 4 | **12** 🔴 | Liste blanche des rôles validée à l'exécution | ✅ |
| R2 | Un compte banni continue d'agir sur le web (C-3) | 4 | 3 | **12** 🔴 | Session unifiée, `active` relu en base | ✅ |
| R3 | Destruction massive des fichiers du bucket (C-4) | 3 | 4 | **12** 🔴 | Clé S3 contrainte au préfixe du propriétaire | ✅ |
| R4 | Rétrogradation du super-administrateur (C-2) | 2 | 4 | **8** 🟠 | Cible protégée, auto-modification interdite | ✅ |
| R5 | Fuite de ressources privées ou non modérées (E-1) | 3 | 3 | **9** 🟠 | Contrôle de statut et de confidentialité en lecture | ✅ |
| R6 | Force brute sur les mots de passe (E-3) | 3 | 3 | **9** 🟠 | Limitation de débit persistée en base | ✅ |
| R7 | SSRF via l'optimiseur d'images (E-4) | 2 | 3 | **6** 🟠 | `remotePatterns` restreint au bucket | ✅ |
| R8 | Détournement de session par XSS | 1 | 4 | 4 🟡 | En-têtes de sécurité, cookies `HttpOnly` + `Secure` | ✅ |
| R9 | Vol de fichier via URL forgée (M-3) | 2 | 2 | 4 🟡 | Vérification des octets d'en-tête | ✅ |
| R10 | Intrusion dans une session collaborative (M-2) | 2 | 2 | 4 🟡 | Codes via `crypto.getRandomValues()` | ✅ |
| R11 | Action d'administration non imputable (M-7) | 3 | 2 | **6** 🟠 | Journalisation dans `auth_log` | ✅ |
| R12 | Conservation illimitée des adresses IP (F-5) | 4 | 2 | **8** 🟠 | Purge automatisée à 180 jours | ✅ |
| R13 | Impossibilité d'exercer ses droits (F-4, F-6) | 4 | 2 | **8** 🟠 | Export et suppression depuis le profil | ✅ |
| R14 | Dépendance vulnérable exploitée | 3 | 3 | **9** 🟠 | Analyse automatique et issue de suivi | ✅ **Traité** |
| R15 | Bucket S3 public : lecture de fichiers privés | 3 | 4 | **12** 🔴 | Bucket privé + URL signées | ⚠️ **Ouvert** |
| R16 | Perte de la base sans restauration possible | 2 | 4 | **8** 🟠 | Sauvegardes externalisées et testées | Voir §6 |
| R17 | Fuite de secrets d'exploitation | 2 | 4 | **8** 🟠 | Secrets hors dépôt, rotation | ✅ |
| R18 | Déni de service | 2 | 3 | **6** 🟠 | Limitation de débit, WAF de la façade | Partiel |

### Priorités restantes

1. **R15 — Bucket S3 public.** C'est le risque ouvert le plus grave : il
   conditionne la gravité réelle de C-4 et de M-3. Un objet privé déposé par un
   citoyen est lisible de quiconque connaît ou devine son URL. **Passer le
   bucket en privé et servir les fichiers par URL signées à durée limitée.**
2. **R18 — Déni de service.** La limitation de débit applicative ne remplace
   pas une protection en façade.

---

## 4. Solutions de chiffrement

### 4.1 Chiffrement en transit

| Flux | Protocole | Mise en œuvre |
|---|---|---|
| Navigateur → application | **TLS 1.3** (repli 1.2) | Terminaison sur la façade Dokploy, certificat Let's Encrypt renouvelé automatiquement |
| Application mobile → API | TLS 1.3 | Même façade |
| Application → PostgreSQL | TLS | `sslmode=require` dans `DATABASE_URL` |
| Application → stockage objet | TLS | Point d'accès S3 en HTTPS exclusivement |
| Sauvegardes → stockage distant | TLS + chiffrement au repos | Transfert chiffré |

**HSTS** — `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`,
appliqué **uniquement en production** (`next.config.ts`) : en développement,
l'application est servie en clair sur `localhost`, où cet en-tête serait un
piège. La directive CSP `upgrade-insecure-requests` complète le dispositif.

Suites autorisées : uniquement AEAD (AES-GCM, ChaCha20-Poly1305), avec
confidentialité persistante (ECDHE). SSL v3, TLS 1.0 et 1.1 désactivés, de même
que RC4, 3DES et l'export.

### 4.2 Chiffrement des mots de passe

Les mots de passe ne sont **jamais** chiffrés — ils sont **hachés**, opération
irréversible par construction. La distinction est structurante : un mot de passe
chiffré peut être déchiffré si la clé fuit.

| Aspect | Choix |
|---|---|
| Algorithme | **scrypt**, via `better-auth/crypto` |
| Pourquoi scrypt | Fonction *à coût mémoire* : elle résiste au calcul massivement parallèle sur GPU, contrairement à SHA-256 ou MD5 |
| Sel | Unique par mot de passe, généré aléatoirement — interdit les tables arc-en-ciel |
| Implémentation | **Déléguée**, jamais réécrite. Une cryptographie maison est une vulnérabilité en attente |
| Longueur minimale | **12 caractères**, imposée côté serveur (F-2) — l'attribut `minLength` du formulaire ne contraint que le navigateur |

**À construire :** vérification contre les corpus de mots de passe compromis
(protocole *k-anonymity* de HaveIBeenPwned, qui ne transmet que les cinq
premiers caractères de l'empreinte SHA-1 — le mot de passe ne quitte jamais le
serveur).

### 4.3 Chiffrement au repos

| Donnée | Protection |
|---|---|
| Base de données | Chiffrement du volume au niveau de l'hébergeur (LUKS / chiffrement de disque) |
| Sauvegardes | Chiffrement avant transfert, clé conservée hors du serveur sauvegardé |
| Fichiers du bucket | Chiffrement côté serveur (SSE) par le fournisseur |
| Secret TOTP et codes de secours | Stockés en base, protégés par le chiffrement du volume |
| Journaux | Chiffrement du volume |

> **Limite assumée.** Le chiffrement de volume protège contre le vol du support
> physique, **pas** contre un accès applicatif compromis : pour l'application,
> les données sont en clair. C'est pourquoi le contrôle d'accès (§5) reste la
> défense principale, et le chiffrement au repos une défense en profondeur.

### 4.4 Aléa cryptographique

Toute valeur à valeur de secret utilise un générateur **cryptographiquement
sûr** :

| Usage | Source |
|---|---|
| Codes de session collaborative | `crypto.getRandomValues()` |
| Jetons de session | better-auth (générateur sûr) |
| Identifiants d'objets | `crypto.randomUUID()` |
| Sels de hachage | `better-auth/crypto` |

Le constat M-2 portait précisément sur ce point : les codes de session
utilisaient `Math.random()`, prédictible, ce qui permettait de deviner un code
et de s'inviter dans une session privée.

### 4.5 Gestion et rotation des secrets

| Secret | Emplacement | Rotation |
|---|---|---|
| `BETTER_AUTH_SECRET` | Variable Dokploy | Annuelle ou sur incident — **invalide toutes les sessions** |
| `DATABASE_URL` | Variable Dokploy | Sur incident |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Variable Dokploy | Semestrielle |
| `CRON_SECRET` | Variable Dokploy | Annuelle |
| `DOKPLOY_WEBHOOK_URL` | Secret GitHub | Sur incident |

**Règles.** Aucun secret dans le dépôt (`.gitignore` couvre `.env*` et
`*.pem`) ; `.env.example` documente les variables sans valeur ; les secrets ne
transitent jamais par les journaux — le job de déploiement passe l'URL du
webhook par `env:` et non en argument de ligne de commande, précisément pour
qu'elle n'apparaisse pas dans les traces d'exécution. L'audit a vérifié
l'absence de tout secret dans les 26 commits de l'historique.

**Procédure de rotation** : générer (`openssl rand -base64 32`) → mettre à jour
la variable → redéployer → vérifier `/api/health` → consigner la date.

### 4.6 Double authentification

TOTP (RFC 6238) disponible sur tous les comptes, **fortement recommandé pour les
administrateurs**. `skipVerificationOnEnable` est laissé à `false` : un QR code
mal enregistré ne verrouille pas le compte. Des codes de secours à usage unique
sont fournis à l'activation.

---

## 5. Structuration des développements et bonnes pratiques

### 5.1 Principes d'architecture

| Principe | Mise en œuvre |
|---|---|
| **Défense en profondeur** | Contrôle en proxy, en page, en Server Action et en route API — aucune couche n'est seule |
| **Moindre privilège** | Quatre rôles (`citizen`, `moderator`, `admin`, `super_admin`) ; toute action vérifie le rôle **relu en base** |
| **Sécurité par défaut** | Une ressource est privée et en brouillon tant qu'elle n'a pas été publiée et modérée |
| **Source de vérité unique** | `lib/session-user.ts` — c'est l'absence de ce principe qui a produit C-1, C-2 et C-3 |
| **Ne jamais faire confiance au client** | Toute entrée est validée à l'exécution par un schéma Zod |

### 5.2 La règle centrale

> **Toute fonction exportée d'un fichier `"use server"` est une route HTTP
> publique.** Ses arguments arrivent du réseau. Le type TypeScript disparaît à
> la compilation et ne protège rien à l'exécution.

C'est l'énoncé qui résume C-1 : un type union en signature ne validait rien, et
`super_admin` — valeur légitime de l'énumération PostgreSQL — passait sans
obstacle. Chaque Server Action commence désormais par `parseOrThrow(schéma, entrée)`.

### 5.3 Contrôles en place

| Contrôle | Mise en œuvre |
|---|---|
| Validation d'entrée | Zod sur les 38 routes et toutes les Server Actions (`lib/validation.ts`) |
| Autorisation | `lib/authz.ts` — `canManageUser`, `canAssignRole`, cibles protégées |
| Injection SQL | Drizzle en requêtes paramétrées ; les rares fragments `sql\`\`` n'interpolent que des références de colonnes |
| XSS | Échappement React par défaut ; `react-markdown` sans `rehype-raw` ; zéro `dangerouslySetInnerHTML` |
| CSRF | Cookies `SameSite`, `trustedOrigins` sans joker (M-5) |
| Limitation de débit | Compteurs persistés en base — survivent au redémarrage, fonctionnent en multi-instance |
| Envoi de fichiers | Vérification des **octets d'en-tête** et non du type MIME déclaré (M-3), isolation par préfixe utilisateur |
| Journalisation | `lib/audit-log.ts` — toute action d'administration tracée |
| Concurrence | Incréments atomiques en SQL plutôt que lecture-modification-écriture (M-4) |

### 5.4 En-têtes de sécurité HTTP

Définis dans `next.config.ts` :

| En-tête | Valeur | Rôle |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'` | Limite les origines de chargement |
| `X-Frame-Options` | `DENY` | Anti-*clickjacking*, pour les navigateurs ignorant `frame-ancestors` |
| `X-Content-Type-Options` | `nosniff` | Empêche la réinterprétation de type |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limite la fuite d'URL |
| `Permissions-Policy` | caméra, micro, géolocalisation désactivés | Réduit la surface |
| `Strict-Transport-Security` | 2 ans, production uniquement | Impose HTTPS |
| `X-Powered-By` | *supprimé* | N'annonce pas la version du framework |

**Limite connue et assumée (E-5).** `script-src` et `style-src` conservent
`'unsafe-inline'` : Next.js injecte scripts et styles en ligne, et les durcir
sans *nonce* casserait le rendu. **Prochaine étape** : *nonce* par requête
généré dans `proxy.ts`, puis `script-src 'self' 'nonce-<...>' 'strict-dynamic'`.

### 5.5 Qualité du code

| Pratique | Outil | Contrôle |
|---|---|---|
| Typage strict | TypeScript `strict: true` | Job `typecheck` |
| Analyse statique | ESLint | Job `lint` — 0 erreur |
| Tests | Vitest + Playwright | **616 tests au vert** |
| Non-régression de sécurité | Un test par faille corrigée | Job `test` |
| Revue obligatoire | Pull request | Branche `master` protégée |
| Commentaires | Le **pourquoi**, pas le **quoi** | Revue |

**Convention de commentaire.** Un commentaire explique une décision, une
contrainte ou un piège — jamais ce que le code dit déjà. Les corrections de
sécurité portent en commentaire la vulnérabilité qu'elles ferment, pour qu'une
refactorisation ultérieure ne la rouvre pas par inadvertance.

### 5.6 Cycle de développement sécurisé

| Phase | Contrôle |
|---|---|
| Conception | Analyse de risque des fonctionnalités touchant aux données personnelles |
| Développement | Validation Zod systématique, revue des contrôles d'accès |
| Revue | Grille : autorisation, validation, journalisation, secrets |
| Intégration | `lint`, `typecheck`, `build`, `test`, `e2e` bloquants |
| Recette | Parcours de sécurité en préproduction |
| Exploitation | Supervision, journalisation, revue trimestrielle |

### 5.7 Audit de dépendances planifié

Le workflow `.github/workflows/audit-dependances.yml` s'exécute à minuit UTC
tous les deux jours et peut aussi être lancé manuellement. Il analyse le
lockfile Bun de l'application web avec `bun audit` et le lockfile npm de
l'application mobile avec `npm audit`.

Le seuil de traitement est fixé à la sévérité **modérée**. Chaque exécution
publie un résumé par sévérité et conserve les rapports JSON pendant 30 jours.
La détection d'une vulnérabilité ne fait pas échouer le run : une issue portant
le label `securite-dependances` est créée ou complétée afin d'organiser le
triage. Lorsque les audits reviennent propres, le workflow commente puis ferme
l'issue ouverte. Seul un défaut d'exécution ou de production du rapport rend le
workflow rouge.

---

## 6. Méthodologie de continuité et de reprise d'activité

### 6.1 Objectifs

| Objectif | Valeur | Justification |
|---|---|---|
| **RTO** | 4 h | Service d'information et de soutien, non vital en temps réel — la page d'urgence renvoie vers les numéros nationaux, qui ne dépendent pas de la plateforme |
| **RPO** | 24 h, ramené à 1 h par l'archivage continu | Une journée de contributions perdue est acceptable ; une semaine ne l'est pas |
| **Disponibilité** | 99,5 %/mois | ~3 h 40 d'indisponibilité tolérée |

### 6.2 Sinistres envisagés

| Sinistre | Vraisemblance | Réponse | Délai visé |
|---|---|---|---|
| Panne applicative | Probable | Redémarrage automatique du conteneur | < 5 min |
| Régression après mise en production | Possible | Retour arrière sur le tag précédent | < 15 min |
| Corruption de données | Possible | Restauration + rejeu des journaux | < 2 h |
| Perte du serveur | Improbable | Reconstruction complète | < 4 h |
| Compromission | Improbable | Procédure d'incident (§6.4) | Variable |
| Perte du bucket | Improbable | Versionnement + réplication | < 4 h |
| Rançongiciel | Improbable | Restauration depuis sauvegarde **hors ligne** | < 4 h |

### 6.3 Sauvegardes

Détail opérationnel dans [`PLAN_DEPLOIEMENT.md` §9](./PLAN_DEPLOIEMENT.md#9-continuité-sauvegarde-restauration-retour-arrière).

Trois règles :

1. **Externalisation** — les sauvegardes ne résident jamais sur le serveur
   qu'elles protègent. Une sauvegarde locale ne survit ni au rançongiciel ni à
   la perte du serveur.
2. **Chiffrement** — chiffrées avant transfert, clé conservée séparément.
3. **Vérification** — *une sauvegarde jamais restaurée n'est pas une
   sauvegarde*. Test de restauration **trimestriel**, chronométré et consigné.

### 6.4 Procédure d'incident de sécurité

| Phase | Actions | Responsable | Délai |
|---|---|---|---|
| **1. Détection** | Alerte, signalement, anomalie dans `auth_log` | OPS | — |
| **2. Qualification** | Nature, périmètre, données touchées, gravité | LEAD + DPO | 1 h |
| **3. Confinement** | Révoquer les sessions, rotation des secrets, désactiver les comptes compromis, isoler si nécessaire | OPS | 4 h |
| **4. Éradication** | Corriger la faille, `hotfix/` depuis le tag de production | DEV | 24 h |
| **5. Rétablissement** | Redéployer, vérifier, surveillance renforcée | OPS | 48 h |
| **6. Notification** | **CNIL sous 72 h** si données personnelles ; personnes concernées si risque élevé | DPO | **72 h** |
| **7. Retour d'expérience** | *Post mortem* écrit, sans recherche de responsabilité individuelle, conclu par un test de non-régression | LEAD | 1 semaine |

> **Le délai de 72 h de l'article 33 du RGPD court à partir de la
> *connaissance* de la violation, pas de sa résolution.** La notification n'attend
> donc pas la correction : elle peut être initiale puis complétée.

**Registre des violations** — tenu par le DPO, y compris pour les incidents non
notifiables (art. 33 §5) : nature, catégories et volume de données et de
personnes, conséquences probables, mesures prises.

### 6.5 Journalisation et détection

| Événement | Table | Rétention |
|---|---|---|
| Connexions (IP, user-agent) | `auth_log` | 180 j |
| Actions d'administration | `auth_log` | 180 j |
| Purges de rétention | `auth_log` | 180 j |
| Erreurs applicatives | Journaux Dokploy | 30 j |
| Accès HTTP | Journaux de façade | 30 j |

Signaux à surveiller : pic d'échecs d'authentification, changement de rôle hors
plage horaire habituelle, suppression massive de contenus, pic de 5xx,
dégradation de la latence de `/api/health`.

---

## 7. Conformité RGPD

### Registre des traitements (extrait)

| Traitement | Finalité | Base légale | Données | Conservation |
|---|---|---|---|---|
| Gestion des comptes | Fournir le service | Contrat (6-1-b) | Identité, courriel, empreinte | Jusqu'à suppression |
| Publication de ressources | Partage entre citoyens | Contrat (6-1-b) | Contenus, métadonnées | Anonymisé après suppression |
| Modération | Prévenir les contenus illicites | Intérêt légitime (6-1-f) + obligation légale (6-1-c) | Signalements, décisions | 180 j après résolution |
| Journalisation | Sécurité et imputabilité | Intérêt légitime (6-1-f) | IP, user-agent, événement | **180 j** |
| Statistiques | Piloter le service | Intérêt légitime (6-1-f) | Compteurs agrégés | Sans limite (anonymes) |

### Droits des personnes

| Droit | Article | Mise en œuvre |
|---|---|---|
| Information | 13 | Politique de confidentialité + mention à l'inscription |
| Accès | 15 | Profil + export |
| Rectification | 16 | Édition du profil |
| **Effacement** | **17** | **Suppression depuis le profil** (F-4) |
| Limitation | 18 | Sur demande au DPO |
| **Portabilité** | **20** | **Export JSON depuis le profil** (F-6) |
| Opposition | 21 | Sur demande au DPO |

### Effacement : la décision de conception

Toutes les clés étrangères vers `user` sont en `ON DELETE cascade`. Un `DELETE`
brut aurait donc détruit les ressources publiées et les commentaires visibles —
c'est-à-dire le patrimoine de la plateforme **et les fils de discussion
auxquels d'autres citoyens ont participé**.

La solution retenue est l'**anonymisation du contenu public** : ressources
publiées et commentaires visibles sont réattribués à un compte réceptacle
« Utilisateur supprimé », inactif et dépourvu d'identifiants, donc non
connectable. Tout le reste est détruit : identité, brouillons et leurs fichiers,
favoris, progression, signalements, sessions et jetons.

**Fondement.** L'article 17 §1 porte sur les *données à caractère personnel*.
Une contribution détachée de toute donnée permettant d'identifier son auteur
n'en est plus une et sort du champ du règlement (considérant 26).

L'identifiant est également retiré de `auth_log` : la table n'a délibérément pas
de clé étrangère vers `user` — pour que l'historique de connexion survive à la
suppression, comme l'exige l'obligation de journalisation — donc rien ne
nettoyait cet identifiant, encore personnel dès lors qu'il est recoupable.

### Principes appliqués

| Principe | Article | Mise en œuvre |
|---|---|---|
| Minimisation | 5-1-c | Aucune donnée de santé demandée ; seuls le nom et le courriel sont obligatoires |
| Limitation de conservation | 5-1-e | Purge automatisée du journal à 180 j |
| Intégrité et confidentialité | 5-1-f | Chiffrement (§4), contrôle d'accès (§5) |
| Protection dès la conception | 25 | Ressource privée par défaut, validation systématique |
| Sécurité du traitement | 32 | Le présent plan |
| Notification de violation | 33 | Procédure §6.4, 72 h |

**Cookies.** Aucun traceur publicitaire ni mesure d'audience tierce. Seuls sont
déposés les cookies strictement nécessaires — session et langue — dispensés de
consentement au titre de l'article 82 de la loi Informatique et Libertés. C'est
la raison pour laquelle aucune bannière de consentement n'est affichée : en
poser une là où elle n'est pas requise entretient la confusion.

---

## 8. Risques résiduels acceptés

| # | Risque | Criticité | Pourquoi accepté temporairement | Échéance |
|---|---|---|---|---|
| R15 | **Bucket S3 public** | 🔴 12 | Passer en privé impose de basculer tout l'affichage sur des URL signées — chantier à part entière. **Priorité n° 1.** | Avant mise en service |
| — | CSP avec `'unsafe-inline'` | 🟡 4 | Le durcissement exige un *nonce* par requête ; le risque réel est faible, aucune XSS n'ayant été trouvée | Version 1.1 |
| F-3 | Rôle `moderator` sans privilèges | 🟡 3 | Décision produit en attente : le rôle existe mais n'ouvre aucun droit | À arbitrer |
| — | Absence de test d'intrusion | 🟠 6 | La revue boîte blanche exhaustive a été privilégiée ; complémentaire, non substituable | Avant mise en service |
| — | RGAA non audité | 🟠 6 | Déclaré « non conforme » en toute transparence plutôt qu'annoncé à tort | Avant mise en service |

**Ces risques sont portés à la connaissance du ministère et font l'objet d'une
revue trimestrielle.**

---

## Annexes

- [`../SECURITY_AUDIT.md`](../SECURITY_AUDIT.md) — audit détaillé : 23 constats et leurs corrections
- [`PLAN_DEPLOIEMENT.md`](./PLAN_DEPLOIEMENT.md) — plan de déploiement
- [`GESTION_VERSIONS_ET_EVOLUTIONS.md`](./GESTION_VERSIONS_ET_EVOLUTIONS.md) — gestion des versions et des évolutions
- [`../.env.example`](../.env.example) — variables d'environnement et secrets attendus
