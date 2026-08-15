# Audit de sécurité — (RE)Sources Relationnelles

> **État au 15 août 2026 — corrections appliquées.**
> Les 4 constats critiques, les 5 élevés, les 8 moyens et F-1 à F-3 ont été
> corrigés (branche `claude/security-audit-project-efk7gl`), chacun accompagné
> d'un test de non-régression. Le détail de chaque correction figure sous le
> constat concerné.
>
> **Mise à jour du 15 août 2026 —** F-4, F-5 et F-6 sont désormais corrigés :
> suppression de compte par anonymisation, export des données, purge de
> rétention du journal et pages légales. Le détail figure sous chaque constat.
>
> **Restent ouverts :** la décision produit sur le rôle `moderator` (F-3), le
> durcissement de la CSP par nonce, le stockage du jeton sur la cible
> mobile-web (M-6), et tout le volet infrastructure — **à commencer par le
> caractère public du bucket S3**.

**Date :** 15 août 2026
**Périmètre :** application Next.js 16 (`app/`, `lib/`, `db/`), API REST `/api/v1`, Server Actions, application mobile Expo (`mobile/`), configuration d'infrastructure applicative.
**Méthode :** revue manuelle de code (white-box) de l'intégralité des points d'entrée : 38 routes API, 5 fichiers de Server Actions, les layouts et pages à contrôle d'accès, la couche d'authentification, le stockage S3 et le client mobile. Pas de test d'intrusion dynamique (aucun environnement déployé disponible).

---

## Synthèse

L'architecture d'authentification est saine dans ses fondations : better-auth avec TOTP, sessions courtes (24 h), Drizzle en requêtes paramétrées (**aucune injection SQL trouvée**), `react-markdown` sans `rehype-raw` et **zéro `dangerouslySetInnerHTML`** (**aucune XSS stockée trouvée**), aucun secret dans l'historique Git.

Le problème central n'est pas la cryptographie ni l'injection : c'est **l'existence de deux couches d'autorisation divergentes**. L'API `/api/v1` valide l'état du compte via `lib/api-auth.ts`, alors que le site web (Server Actions + pages) passe par `lib/auth-server.ts`, qui ne fait aucune vérification métier. Trois des quatre vulnérabilités critiques découlent directement de cette asymétrie.

| Sévérité | Nombre | Ce qui est en jeu |
|---|---|---|
| 🔴 Critique | 4 | Prise de contrôle du rôle super-admin, bannissement inopérant, destruction de données |
| 🟠 Élevé | 5 | Fuite de contenu non modéré, absence de rate limiting, proxy ouvert |
| 🟡 Moyen | 8 | Validation d'entrée, aléa prédictible, en-têtes de sécurité |
| 🔵 Faible / RGPD | 6 | Traçabilité, politique de mot de passe, conformité |

**Les 4 vulnérabilités critiques sont exploitables sans outillage particulier** et deux d'entre elles ne nécessitent qu'un compte utilisateur standard.

---

## 🔴 Critiques

### C-1 — Escalade de privilèges : tout administrateur peut devenir super-administrateur  ✅ *corrigé*

**Fichier :** `app/[locale]/(admin)/admin/actions.ts:59-68`

```ts
export async function updateUserRole(
  userId: string,
  role: "citizen" | "moderator" | "admin"   // ⚠️ contrainte TypeScript = compilation uniquement
) {
  await requireAdmin();
  await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, userId));
```

Le type union `"citizen" | "moderator" | "admin"` n'existe **qu'à la compilation**. Une Server Action est un point d'entrée HTTP réel : le paramètre `role` arrive du réseau et n'est jamais validé à l'exécution. `super_admin` étant une valeur légitime de l'enum PostgreSQL `user_role`, l'écriture réussit.

**Exploitation :** un administrateur (ou toute personne ayant compromis un compte admin) invoque l'action avec son propre `userId` et `role: "super_admin"`. Il obtient le rôle le plus élevé de la plateforme — création de comptes admin, gestion de tous les comptes. La séparation admin / super-admin, matérialisée par `requireSuperAdmin()` et `updateUserRoleAsAdmin` (ligne 228), devient purement décorative.

**Correction :** valider `role` à l'exécution contre une liste blanche, avant l'écriture.

```ts
const ASSIGNABLE_BY_ADMIN = ["citizen", "moderator", "admin"] as const;
if (!ASSIGNABLE_BY_ADMIN.includes(role)) throw new Error("Rôle invalide");
```

> **Règle générale :** chaque Server Action exportée est une route HTTP publique. Aucun argument ne doit être considéré comme typé. Un schéma Zod en tête de chaque action est la correction structurelle (voir M-1).

---

### C-2 — Un administrateur peut rétrograder et désactiver le super-administrateur  ✅ *corrigé*

**Fichiers :** `app/[locale]/(admin)/admin/actions.ts:59, 71-87` · `app/api/v1/admin/users/[id]/role/route.ts:10-33` · `app/api/v1/admin/users/[id]/active/route.ts:10-18`

Aucun de ces quatre chemins ne vérifie **le rôle de la cible**. `requireApiAdmin` autorise l'appelant, puis l'écriture s'applique à n'importe quel `userId`, super-administrateur compris.

Dans la route API `role`, le contrôle porte sur le rôle *demandé*, jamais sur celui de la cible :

```ts
if (superAdminRoles.includes(role)) {
  await requireApiSuperAdmin(req);        // protège l'attribution de super_admin
} else if (adminRoles.includes(role)) {
  await requireApiAdmin(req);             // ⚠️ mais un admin peut viser un super_admin
}
```

**Exploitation :** `PUT /api/v1/admin/users/<id_du_super_admin>/role` avec `{"role":"citizen"}`, suivi de `PUT /api/v1/admin/users/<id>/active` pour désactiver le compte. Un simple administrateur destitue le super-administrateur et prend le contrôle exclusif de la plateforme. Combiné à C-1, la chaîne complète est : compte admin → super-admin → éviction de tous les autres administrateurs.

**Corrections :**
1. Interdire toute modification dont la cible est `super_admin`, sauf si l'appelant est lui-même `super_admin`.
2. Interdire à un utilisateur de modifier son propre rôle ou son propre statut d'activation (protection contre l'auto-verrouillage et l'auto-promotion).
3. Route `role` : déplacer `await requireApiAdmin(req)` **avant** `await req.json()` — le corps est actuellement parsé et validé pour un appelant non authentifié.

---

### C-3 — La désactivation d'un compte n'a aucun effet sur le site web  ✅ *corrigé*

**Fichiers :** `lib/auth-server.ts:4-9` (vs. `lib/api-auth.ts:25`)

Il existe deux fonctions de session, et une seule vérifie l'état du compte :

```ts
// lib/api-auth.ts:25 — API /api/v1 : correct
if (!dbUser || !dbUser.active) return null;

// lib/auth-server.ts:4-9 — web (Server Actions + pages) : aucun contrôle
export async function getServerSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;   // ⚠️ ni `active`, ni rôle rechargé depuis la base
}
```

`getServerSession()` est utilisé par **toutes** les Server Actions (`publish-actions.ts`, `comment-actions.ts`, `resource-actions.ts`, `report-actions.ts`), par le layout admin et par toutes les pages protégées. Le champ `active` étant un champ personnalisé, better-auth ne l'évalue pas lors de la validation de session.

**Exploitation :** un utilisateur désactivé par la modération (`toggleUserActive`) conserve, tant que son cookie de session est valide, la totalité de ses droits web : publier, commenter, signaler, modifier ses ressources. **Si le compte désactivé est un administrateur, il conserve l'accès complet au panneau `/admin`** — `AdminLayout` (`app/[locale]/(admin)/layout.tsx:22-26`) relit le rôle en base mais ignore `active`. La sanction ne s'applique qu'à l'API mobile.

**Correction :** faire de `lib/auth-server.ts` l'équivalent strict de `lib/api-auth.ts` — recharger l'utilisateur en base, rejeter si `!active`, et retourner le rôle issu de la base plutôt que celui du cookie. Une seule fonction de session partagée par les deux surfaces éliminerait cette classe entière de bugs.

---

### C-4 — Suppression arbitraire de fichiers dans le bucket S3  ✅ *corrigé*

**Fichiers :** `lib/s3.ts:30-41` · `app/api/v1/resources/[id]/route.ts:196-211` · `app/[locale]/(public)/publier/publish-actions.ts:150-160` · `app/[locale]/(admin)/admin/actions.ts:129-142`

`imageUrl` et `attachments[].url` sont fournis par le client et stockés **sans aucune validation** (aucun contrôle de préfixe, de domaine, ni d'appartenance). À la suppression, la clé est reconstruite par découpage de chaîne et supprimée sans vérifier son propriétaire :

```ts
export function getObjectKeyFromUrl(url: string): string | null {
  const publicPrefix = `${PUBLIC_URL_BASE}/`;
  if (url.startsWith(publicPrefix)) return url.slice(publicPrefix.length);  // ⚠️ clé arbitraire
```

L'upload isole pourtant correctement les utilisateurs (`app/api/upload/route.ts:53` → `${session.user.id}/${uuid}.ext`), mais cette isolation n'est jamais revérifiée au moment de la suppression.

**Exploitation :** les clés S3 des victimes sont **publiquement lisibles** — ce sont les `imageUrl` affichées sur chaque ressource publiée du catalogue. Un attaquant crée une ressource avec `imageUrl` pointant sur l'objet d'une victime, puis supprime sa propre ressource : l'objet de la victime est détruit. Le procédé est scriptable sur l'ensemble du catalogue → **destruction de toutes les images du site**. La variante via `attachments[]` dans `updateResource` permet la même chose sans même supprimer la ressource.

**Correction :** dans `getObjectKeyFromUrl`, exiger que la clé extraite commence par l'identifiant du propriétaire de la ressource, et refuser toute clé contenant `..` ou `/` en tête. Idéalement, ne jamais stocker d'URL fournie par le client : stocker la clé S3 renvoyée par la route d'upload et reconstruire l'URL à l'affichage.

> **Note (15 août 2026) — `getStoredObjectKey`.** L'anonymisation RGPD (F-4) réattribue les ressources publiées au compte réceptacle, alors que leurs clés conservent le préfixe du propriétaire d'origine : `getObjectKeyFromUrl(url, nouvelAuteur)` ne les reconnaîtrait plus, et une suppression admin ultérieure laisserait les objets orphelins dans le bucket.
>
> `lib/s3.ts` expose donc `getStoredObjectKey(url)`, sans contrôle de propriétaire. **Cela ne rouvre pas C-4** : la fonction ne s'applique qu'à des URL relues depuis la base, lesquelles ont déjà franchi `assertOwnedObjectUrl` à l'écriture — la barrière posée par la correction de C-4 est en amont, au moment où l'URL devient une donnée. La faille venait de la confiance accordée à une URL *entrante* ; il ne faut jamais appeler `getStoredObjectKey` sur une valeur issue directement d'une requête. Les durcissements sur `..` et le `/` en tête sont conservés.

---

## 🟠 Élevés

### E-1 — Le contenu non publié est lisible publiquement sur le web  ✅ *corrigé*

**Fichier :** `app/[locale]/(public)/ressource/[id]/page.tsx:79-86`

La page vérifie `privacy` mais **jamais `status`** :

```ts
if (!res) notFound();
const session = await getServerSession();
if (res.privacy === "private" && session?.user?.id !== res.authorId) notFound();
// ⚠️ aucun contrôle sur res.status
```

L'API équivalente est correcte (`app/api/v1/resources/[id]/route.ts:56-58` bloque les statuts non publiés pour les non-auteurs / non-admins) : le web est en retrait de l'API.

**Impact :** toute personne connaissant ou devinant un UUID accède aux ressources `draft`, `pending`, `rejected` et `flagged`. Le contenu **rejeté ou signalé par la modération reste servi publiquement**, ce qui vide de son sens le circuit de validation. Le catalogue (`catalogue/page.tsx:28`) et la page d'accueil filtrent bien, mais l'accès direct par URL contourne tout.

**Correction :** aligner la page sur l'API — `if (res.status !== "published" && !isAuthor && !isAdmin) notFound();`

---

### E-2 — Commentaires : aucune vérification de la ressource cible  ✅ *corrigé*

**Fichiers :** `app/api/v1/resources/[id]/comments/route.ts:10-27, 30-45` · `app/[locale]/(public)/ressource/[id]/comment-actions.ts:16-35`

Ni la lecture ni l'écriture ne vérifient que la ressource existe, est publiée, ou est accessible à l'appelant. Trois conséquences :

- **Fuite** : `GET /api/v1/resources/<id_privé>/comments` retourne les commentaires de ressources privées ou en brouillon, alors que la ressource elle-même est protégée.
- **Écriture non sollicitée** : un utilisateur peut commenter une ressource privée dont il n'a pas la lecture (le commentaire devient visible pour l'auteur).
- **`parentId` non validé** : rien n'impose que le commentaire parent appartienne à la même ressource — un fil peut être rattaché à un commentaire d'une autre ressource, corrompant l'arborescence d'affichage.

**Correction :** charger la ressource et appliquer les mêmes règles de visibilité que `GET /api/v1/resources/[id]` ; vérifier que `parentId`, s'il est fourni, référence un commentaire du même `resourceId`.

---

### E-3 — Aucune limitation de débit sur l'ensemble de l'application  ✅ *corrigé*

Aucun `rateLimit` n'est configuré dans `lib/auth.ts`, et **aucune des 38 routes `/api/v1` ni aucune Server Action** n'implémente de limitation. Surfaces exposées :

| Cible | Conséquence |
|---|---|
| `/api/auth/sign-in/email` | Force brute sur les mots de passe (politique à 8 caractères, voir F-2) |
| `/login/2fa` — `verifyTotp` | Force brute sur 6 chiffres ; sans limitation, l'espace 10⁶ est parcourable |
| `POST /api/upload` | 50 Mo par requête, sans quota ni compteur → saturation du bucket et coûts de stockage |
| `POST /api/v1/reports` | Inondation de la file de modération (aucune déduplication signaleur/cible) |
| `POST .../comments`, `/join` | Spam applicatif |

better-auth applique des protections par défaut sur `/api/auth/*` en production, mais elles sont en mémoire (perdues à chaque redémarrage, inefficaces en multi-instance) et **ne couvrent pas `/api/v1`**.

**Correction :** activer explicitement `rateLimit` dans `betterAuth({...})` avec un stockage partagé (base ou Redis), durcir les endpoints de connexion et de vérification 2FA, et ajouter une limitation par utilisateur sur upload, signalement et commentaire.

---

### E-4 — Proxy d'images ouvert (SSRF)  ✅ *corrigé*

**Fichier :** `next.config.ts:7-10`

```ts
remotePatterns: [
  { protocol: "https", hostname: "**" },
  { protocol: "http", hostname: "**" },   // ⚠️ HTTP + joker total
]
```

L'optimiseur d'images de Next.js accepte alors **n'importe quelle URL distante**. `/_next/image?url=<cible>&w=640&q=75` devient un proxy ouvert opéré par votre serveur : dissimulation d'origine pour du trafic tiers, et surtout requêtes HTTP sortantes vers des adresses internes depuis l'intérieur de votre réseau (métadonnées cloud, services non exposés). L'autorisation de `http` supprime en plus toute garantie de transport.

Le risque est aggravé par le fait qu'`imageUrl` est entièrement contrôlé par l'utilisateur (voir C-4) : une ressource peut pointer vers un hôte arbitraire.

**Correction :** restreindre `remotePatterns` au seul domaine du bucket, en `https` uniquement.

```ts
remotePatterns: [{ protocol: "https", hostname: "t3.storage.dev" }]
```

---

### E-5 — Aucun en-tête de sécurité HTTP  ✅ *corrigé (CSP à durcir par nonce)*

`next.config.ts` ne définit aucun `headers()`. Sont absents :

| En-tête | Absence exploitable pour |
|---|---|
| `Content-Security-Policy` | Aucune défense en profondeur si une XSS apparaît ; aucune restriction sur les origines de scripts |
| `X-Frame-Options` / `frame-ancestors` | **Clickjacking sur `/admin`** : les actions de modération et de gestion de comptes sont déclenchables depuis une iframe piégée |
| `Strict-Transport-Security` | Rétrogradation vers HTTP au premier accès |
| `X-Content-Type-Options: nosniff` | Interprétation par reniflage des fichiers du bucket public |
| `Referrer-Policy` | Fuite d'URL (identifiants de ressources, codes de session) vers les domaines tiers |

**Correction :** ajouter un bloc `async headers()` dans `next.config.ts` couvrant ces cinq en-têtes, avec une CSP démarrée en `report-only` pour calibrage.

---

## 🟡 Moyens

### M-1 — Absence de validation des entrées sur l'ensemble des points d'entrée  ✅ *corrigé*

Aucune bibliothèque de validation de schéma (Zod, Valibot) n'est présente. Les corps de requête sont déstructurés directement, et les valeurs invalides sont forcées via `as never` :

```ts
// app/api/v1/resources/route.ts:141-144
mediaType: (mediaType || "article") as never,
privacy: privacy || "public",     // toute chaîne → erreur d'enum PostgreSQL non gérée → 500
status: isDraft ? "draft" : "pending",
```

Conséquences : erreurs 500 non maîtrisées, `content` sans limite de taille (insertion de plusieurs Mo par requête), `me.image` et `me.name` acceptés sans contrainte de longueur ni de format (`app/api/v1/me/route.ts:39-46`). C'est la cause racine commune de C-1 et de plusieurs autres constats.

**Correction :** un schéma Zod par point d'entrée — routes API **et** Server Actions —, appliqué avant toute écriture.

### M-2 — Codes de session collaborative prédictibles  ✅ *corrigé*

**Fichier :** `lib/sessions.ts:10`

```ts
code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
```

`Math.random()` n'est pas cryptographiquement sûr : son état interne est reconstructible à partir de quelques sorties observées, permettant de prédire les codes suivants. Combiné à l'absence de rate limiting (E-3) et au fait que rejoindre une session ne requiert que le code (`/api/v1/sessions/[code]/join`), un attaquant peut s'introduire dans des sessions privées et lire l'intégralité de la messagerie (`/messages`).

**Correction :** `crypto.getRandomValues()` (ou `crypto.randomInt`) sur le même alphabet.

### M-3 — Upload : type MIME déclaré par le client, jamais vérifié  ✅ *corrigé*

**Fichier :** `app/api/upload/route.ts:38-58`

Le `contentType` provient de `file.type`, valeur entièrement contrôlée par le client, et sert à la fois de filtre d'autorisation et de `ContentType` S3 — donc d'en-tête `Content-Type` au moment où le bucket public sert le fichier. Aucune vérification des octets d'en-tête (magic bytes). Un contenu arbitraire peut être hébergé sur votre infrastructure sous une étiquette d'image ; l'allowlist limite le risque d'exécution directe, mais l'hébergement de contenu malveillant sous votre domaine reste possible.

**Correction :** vérifier les magic bytes et dériver le `ContentType` du résultat, jamais de la déclaration client. Ajouter `nosniff` côté bucket.

### M-4 — Compteur de vues : lecture-modification-écriture concurrente  ✅ *corrigé*

**Fichiers :** `app/api/v1/resources/[id]/route.ts:88` · `app/[locale]/(public)/ressource/[id]/page.tsx:89-92`

```ts
await db.update(resource).set({ viewCount: (row.viewCount ?? 0) + 1 })
```

Valeur relue en mémoire puis réécrite : les incréments concurrents s'écrasent. Chaque affichage déclenche par ailleurs une écriture non limitée (amplification d'écriture exploitable en déni de service léger), y compris sur les brouillons. Sur la page web, la promesse n'est même pas attendue (`.then(() => {})`).

**Correction :** incrément atomique côté SQL — `set({ viewCount: sql\`${resource.viewCount} + 1\` })` — comme cela est déjà correctement fait pour les likes.

### M-5 — `trustedOrigins` avec joker  ✅ *corrigé*

**Fichier :** `lib/auth.ts:29-30` — `"exp://*"` et `"re-sources://"`. Le joker élargit les origines acceptées au-delà du nécessaire. Acceptable en développement, à restreindre en production via une configuration dépendante de `NODE_ENV`.

### M-6 — Jetons stockés en `localStorage` sur mobile-web  ⏳ *documenté, non corrigé*

**Fichier :** `mobile/lib/storage.ts:14-21`. `expo-secure-store` est correctement utilisé sur iOS/Android, mais le repli web écrit le jeton en `localStorage`, accessible à tout script de la page. Sur la cible web d'Expo, une XSS permettrait l'exfiltration du jeton. Préférer un cookie `httpOnly` sur cette cible.

### M-7 — Aucune journalisation des actions d'administration  ✅ *corrigé*

`lib/auth.ts:44-60` journalise les connexions dans `auth_log`, mais **aucune action de modération ou de gestion de comptes n'est tracée** : changement de rôle, désactivation, suppression de ressource ou de commentaire, résolution de signalement. En cas d'incident (par exemple l'exploitation de C-1 ou C-2), il n'existe aucune piste d'audit. La page `/admin/journal` n'affiche donc que les connexions.

### M-8 — Authentification vérifiée après le parsing du corps  ✅ *corrigé*

`app/api/v1/admin/users/[id]/role/route.ts:12-24` : `req.json()` est exécuté et la validation du rôle est effectuée **avant** tout contrôle d'authentification. Un appelant anonyme obtient un 400 discriminant, ce qui expose la sémantique de l'endpoint. Vérifier l'identité en premier, systématiquement.

---

## 🔵 Faibles et conformité RGPD

**F-1 — Comptes de démonstration à mot de passe faible.** `db/seed.ts:22-36` utilise `password123`. Aucun garde-fou n'empêche l'exécution du seed en production. Ajouter un refus explicite si `NODE_ENV === "production"`.

**F-2 — Politique de mot de passe minimale.** 8 caractères, sans contrainte de complexité ni vérification contre les corpus de fuites (`app/[locale]/(auth)/register/page.tsx:135`, `lib/admin-user.ts:37`). Pour une plateforme publique traitant des données de santé relationnelle, relever le minimum à 12 caractères et intégrer un contrôle type HIBP.

**F-3 — Rôle `moderator` non fonctionnel.** L'enum le définit, mais `requireApiAdmin` et `requireAdmin` n'acceptent que `admin` et `super_admin` : un modérateur n'a accès à aucun outil de modération. Écart fonctionnel, à clarifier — un rôle inutilisé qui semble accorder des droits est une source d'erreur d'exploitation.

**F-4 — Absence de suppression de compte (droit à l'effacement, art. 17 RGPD).** ✅ *corrigé* — Aucun point d'entrée ne permettait à un utilisateur de supprimer son compte et ses données ; `toggleUserActive` est une désactivation, pas un effacement.

> **Correction.** `deleteUserAccount` (`lib/rgpd.ts`), exposée par la Server Action `deleteMyAccount` depuis le profil. Le mot de passe est revérifié avant l'opération : un cookie de session volé ne suffit pas à effacer un compte.
>
> Toutes les clés étrangères vers `user` étant en `ON DELETE cascade`, un `DELETE` brut aurait aussi détruit les ressources publiées et les commentaires visibles — donc les fils de discussion d'autres citoyens. Les contenus publics sont donc réattribués au compte réceptacle « Utilisateur supprimé » (inactif, sans ligne `account`, donc non connectable), tout le reste étant détruit : identité, brouillons et leurs fichiers dans le bucket, favoris, progression, signalements, sessions et jetons. L'article 17 §1 porte sur les données à caractère personnel ; une contribution détachée de toute identité n'en est plus une.

**F-5 — Aucune politique de rétention.** ✅ *corrigé* — `auth_log` conservait adresses IP et user-agents sans durée définie ni purge.

> **Correction.** `purgeAuthLog` (`lib/rgpd.ts`), 180 jours par défaut (recommandation CNIL sur les journaux de connexion), surchargeable par `AUTH_LOG_RETENTION_DAYS`. Déclenchable par `POST /api/v1/maintenance/purge-auth-log` (secret partagé `CRON_SECRET`, comparaison à temps constant) ou par `bun run db:purge`. L'ordonnancement est décrit dans `docs/PLAN_DEPLOIEMENT.md`. Index ajouté sur `auth_log.created_at`.
>
> L'effacement d'un compte met par ailleurs `auth_log.user_id` à `NULL` : la table n'a délibérément pas de clé étrangère vers `user`, donc rien ne nettoyait cet identifiant, encore personnel dès lors qu'il est recoupable.

**F-6 — Absence de portabilité et d'information.** ✅ *corrigé* — Aucun export des données personnelles (art. 20), aucune politique de confidentialité ni mention de traitement à l'inscription.

> **Correction.** `exportUserData` (`lib/rgpd.ts`) via la Server Action `exportMyData`, export JSON téléchargeable depuis le profil. Les quatre pages légales référencées par le pied de page — qui renvoyaient toutes un **404** — sont créées : mentions légales, politique de confidentialité, déclaration d'accessibilité RGAA et contact. Mention d'information ajoutée au parcours d'inscription (art. 13).
>
> Les durées annoncées dans la politique de confidentialité sont alignées sur ce que le code applique réellement, et un test le vérifie (`tests/unit/pages/legal-pages.test.tsx`) : une politique qui promet autre chose que le comportement du système est un manquement en soi.

---

## Points positifs confirmés

Ces éléments ont été explicitement vérifiés et ne présentent pas de défaut :

- **Injections SQL** — aucune. Drizzle est utilisé partout en requêtes paramétrées ; les rares fragments `sql\`\`` (`comment-actions.ts:70,80`, `home-data.ts:103`) n'interpolent que des références de colonnes, jamais d'entrée utilisateur.
- **XSS** — aucune occurrence de `dangerouslySetInnerHTML`, `innerHTML`, `eval` ou `new Function` dans l'ensemble du code applicatif et mobile. `react-markdown` est utilisé sans `rehype-raw`, ce qui neutralise le HTML brut par défaut : le rendu du contenu Markdown utilisateur est sûr.
- **Secrets** — aucun fichier `.env`, clé privée ou identifiant dans les 26 commits de l'historique. `.gitignore` couvre correctement `.env*` et `*.pem`. `.env.test.example` ne contient que des valeurs factices explicitement documentées comme telles.
- **Hachage des mots de passe** — délégué à `better-auth/crypto` (`lib/admin-user.ts:44`), aucune implémentation maison.
- **Sessions** — durée courte (24 h) avec renouvellement glissant, `useSecureCookies` activé en production (`lib/auth.ts:34-42`).
- **2FA** — TOTP avec `skipVerificationOnEnable` laissé à `false`, ce qui évite le verrouillage sur un QR mal enregistré ; codes de secours implémentés.
- **Isolation des uploads** — le préfixe de clé par identifiant utilisateur et l'assainissement de l'extension (`app/api/upload/route.ts:52-54`) sont corrects ; c'est la suppression qui ne revérifie pas cette isolation (C-4).
- **Contrôles d'accès corrects** — `AdminLayout` relit le rôle en base plutôt que de faire confiance au cookie ; la messagerie de session vérifie l'appartenance active (`isActiveParticipant`) en lecture comme en écriture ; la page d'édition de ressource vérifie la propriété.

---

## Plan de remédiation

**Immédiat — avant toute mise en production**

1. C-1 : valider `role` à l'exécution dans `updateUserRole` *(une ligne)*
2. C-2 : protéger les cibles `super_admin` et interdire l'auto-modification *(4 fichiers)*
3. C-3 : aligner `getServerSession()` sur `getApiSession()` — contrôle de `active` et rôle relu en base
4. C-4 : contraindre la clé S3 au préfixe du propriétaire dans `getObjectKeyFromUrl`
5. E-4 : restreindre `remotePatterns` au domaine du bucket *(une ligne)*

**Court terme — sous deux semaines**

6. E-1 : contrôle de `status` sur la page ressource
7. E-2 : contrôles de visibilité et de cohérence de `parentId` sur les commentaires
8. E-3 : `rateLimit` better-auth avec stockage partagé + limitation sur `/api/v1`
9. E-5 : bloc `headers()` — CSP en report-only, HSTS, frame-ancestors, nosniff, Referrer-Policy
10. M-2 : `crypto.getRandomValues()` pour les codes de session

**Moyen terme**

11. M-1 : schémas Zod sur les 38 routes et les Server Actions — supprime la classe de bugs à l'origine de C-1
12. M-7 : journalisation des actions d'administration dans `auth_log`
13. M-3, M-4, M-5, M-6 : vérification des magic bytes, incréments atomiques, restriction des origines, stockage du jeton mobile-web
14. F-4 à F-6 : suppression de compte, export des données, politique de rétention de `auth_log`

### Ce qui a été livré

Cinq commits sur `claude/security-audit-project-efk7gl`, un par phase :

| Commit | Contenu |
|---|---|
| Fondations | `lib/session-user.ts` (source de vérité unique de session), `lib/authz.ts`, `lib/validation.ts` (Zod), `lib/rate-limit.ts` + table `rate_limit` |
| Critiques | C-1, C-2, C-3, C-4 |
| Élevés | E-1 à E-5 (+ M-3, M-4) |
| Moyens / faibles | M-2, M-5, M-7, M-8, F-1, F-2, F-3 |
| Tests | un test de non-régression par faille corrigée |

**Vérifications :** 579 tests au vert sur 580 — le seul échec (`login > submits form and calls signIn`) est antérieur à ces travaux et sans rapport ; build de production réussi ; en-têtes de sécurité constatés sur les réponses ; proxy d'images vérifié fermé (hôte arbitraire et `169.254.169.254` → 400).

**Deux migrations à appliquer :** `0011` (table `rate_limit`) et `0012` (colonnes d'audit sur `auth_log`).

**Recommandation structurelle.** Les vulnérabilités C-1 et C-3 partagent une même cause : la confiance accordée à des garanties qui n'existent qu'à la compilation, et l'existence de deux chemins d'autorisation dont un seul est complet. Unifier `lib/auth-server.ts` et `lib/api-auth.ts` en une fonction unique, et valider tout point d'entrée par un schéma à l'exécution, supprimerait ces deux classes de défauts de façon durable plutôt que cas par cas.

---

## Limites de l'audit

Revue de code statique uniquement : aucune exploitation n'a été validée dynamiquement, faute d'environnement déployé. Les dépendances n'ont pas pu être auditées (`node_modules` absent du conteneur, `npm audit` non exécutable) — un scan de vulnérabilités connues sur `package-lock.json` et `bun.lock` reste à réaliser. La configuration d'infrastructure hors application (politique du bucket S3, TLS, WAF, variables d'environnement de production) sort du périmètre de cette revue et mérite un examen distinct — en particulier **le caractère public du bucket S3**, qui conditionne la gravité réelle de C-4 et M-3.
