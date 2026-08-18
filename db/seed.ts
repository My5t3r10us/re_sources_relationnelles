import "dotenv/config";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  account,
  authLog,
  category,
  comment,
  commentLike,
  completion,
  favorite,
  rateLimit,
  report,
  resource,
  resourceFile,
  resourceSession,
  savedResource,
  session,
  sessionMessage,
  sessionParticipant,
  twoFactor,
  user,
  verification,
} from "./schema";

/**
 * Le seed fonctionne dans deux modes, choisis automatiquement selon
 * l'environnement détecté.
 *
 * Hors production, mode « démonstration » : la base est vidée puis regarnie
 * d'un jeu complet et déterministe — douze comptes à mot de passe commun,
 * commentaires, favoris, signalements, sessions collaboratives.
 *
 * En production, mode « contenu seul ». Les comptes de démonstration
 * ouvriraient des accès triviaux et l'effacement des tables détruirait des
 * données réelles : le seed n'écrit donc que les catégories et les ressources
 * éditoriales, sans rien supprimer. Ces ressources ont besoin d'un auteur —
 * `resource.author_id` est NOT NULL — d'où la création d'un unique compte
 * administrateur porteur, dont le mot de passe aléatoire est affiché une seule
 * fois, à la fin de l'exécution.
 */

/**
 * `NODE_ENV` ne suffit pas : `npx tsx` ne le positionne pas, si bien qu'un seed
 * lancé à la main sur la base de production tomberait dans le mode
 * démonstration et effacerait tout. Les variables des plateformes d'hébergement
 * sont donc consultées en plus, et `SEED_MODE` permet de forcer le mode pour la
 * préproduction, que rien ne distingue automatiquement de la production.
 */
function detectProduction(): boolean {
  const forced = process.env.SEED_MODE;
  if (forced === "production") return true;
  if (forced === "demo") return false;
  if (forced) {
    throw new Error(
      `SEED_MODE doit valoir "production" ou "demo" (reçu : "${forced}").`,
    );
  }

  const candidates = [
    process.env.NODE_ENV,
    process.env.APP_ENV,
    process.env.VERCEL_ENV,
    process.env.RAILWAY_ENVIRONMENT_NAME,
  ];
  return candidates.some((value) => value === "production" || value === "prod");
}

const IS_PRODUCTION = detectProduction();

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "SeedPassword123!";

/** Compte porteur des ressources en production. */
const CONTENT_ADMIN = {
  email: process.env.SEED_ADMIN_EMAIL ?? "contenu@ressources.local",
  firstName: "Compte",
  lastName: "Éditorial",
} as const;

/**
 * Mot de passe imprimé une seule fois en fin d'exécution.
 *
 * `randomBytes` et non le PRNG à graine fixe du seed : celui-ci est
 * délibérément déterministe, donc reproductible par quiconque lit le fichier.
 * Base64url sur 24 octets dépasse largement `MIN_PASSWORD_LENGTH`.
 */
function generatePassword(): string {
  return randomBytes(24).toString("base64url");
}

const REFERENCE_DATE = new Date();
REFERENCE_DATE.setUTCHours(12, 0, 0, 0);

let randomState = 0x5f3759df;
function random() {
  randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
  return randomState / 0x100000000;
}

function integer(min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[]): T {
  return items[integer(0, items.length - 1)];
}

function daysAgo(days: number) {
  return new Date(REFERENCE_DATE.getTime() - days * 86_400_000);
}

function after(date: Date) {
  const start = date.getTime() + 3_600_000;
  const end = REFERENCE_DATE.getTime();
  return new Date(start + Math.floor(random() * Math.max(1, end - start)));
}

let idCounter = 0;
function seedId(prefix: string) {
  idCounter += 1;
  return `seed-${prefix}-${String(idCounter).padStart(4, "0")}`;
}

const seedUsers = [
  ["superadmin@ressources.local", "Sofia", "Bernard", "super_admin", true],
  ["admin@ressources.local", "Antoine", "Leroy", "admin", true],
  ["moderation1@ressources.local", "Mélanie", "Robert", "moderator", true],
  ["moderation2@ressources.local", "Nicolas", "Petit", "moderator", true],
  ["alice@ressources.local", "Alice", "Moreau", "citizen", true],
  ["bilal@ressources.local", "Bilal", "Simon", "citizen", true],
  ["claire@ressources.local", "Claire", "Michel", "citizen", true],
  ["david@ressources.local", "David", "Garcia", "citizen", true],
  ["emma@ressources.local", "Emma", "Roux", "citizen", true],
  ["farid@ressources.local", "Farid", "Vincent", "citizen", true],
  ["gabrielle@ressources.local", "Gabrielle", "Fournier", "citizen", true],
  ["hugo@ressources.local", "Hugo", "Lambert", "citizen", false],
] as const;

const seedCategories = [
  ["Anxiété & Stress", "anxiete-stress", "Ressources pour gérer l'anxiété et le stress au quotidien", "psychology"],
  ["Équilibre vie pro/perso", "equilibre-vie", "Trouver un équilibre durable entre vie professionnelle et personnelle", "work_history"],
  ["Parentalité", "parentalite", "Accompagnement et ressources pour les parents et les familles", "family_restroom"],
  ["Soutien de crise", "soutien-crise", "Repères et contacts utiles face à une situation de crise", "emergency"],
  ["Santé mentale", "sante-mentale", "Préserver son bien-être psychologique au quotidien", "self_improvement"],
  ["Vie de couple", "vie-de-couple", "Communiquer, traverser les désaccords et prendre soin du lien", "favorite"],
  ["Amitié et lien social", "amitie-lien-social", "Créer et entretenir des relations sociales soutenantes", "diversity_3"],
  ["Relations au travail", "relations-travail", "Coopérer, poser ses limites et prévenir les conflits professionnels", "groups"],
] as const;

const resourceTitles = [
  "Apaiser une montée d'anxiété en dix minutes",
  "Identifier ses déclencheurs de stress",
  "Carnet pratique de respiration consciente",
  "Comprendre le cercle de l'évitement",
  "Podcast : retrouver un rythme après l'épuisement",
  "Poser une frontière entre travail et vie privée",
  "Organiser une semaine qui laisse de la place au repos",
  "Déconnexion numérique : un protocole progressif",
  "Dire non sans culpabiliser au travail",
  "Guide PDF de prévention de la surcharge",
  "Écouter son enfant sans chercher immédiatement une solution",
  "Rituel familial pour parler des émotions",
  "Traverser les conflits entre frères et sœurs",
  "Exercice : préparer une discussion difficile avec un adolescent",
  "Repérer les signes d'une détresse urgente",
  "Que faire lorsqu'un proche parle de suicide ?",
  "Numéros et relais d'aide en situation de crise",
  "Protocole d'ancrage 5-4-3-2-1",
  "Cultiver une estime de soi réaliste",
  "Podcast : demander de l'aide psychologique",
  "Journal de gratitude sans injonction positive",
  "Comprendre la différence entre émotion et trouble",
  "Préparer un premier rendez-vous avec un professionnel",
  "Faire une pause face aux ruminations",
  "Formuler un besoin dans le couple",
  "Réparer après une dispute",
  "Partager la charge mentale au quotidien",
  "Préserver l'intimité dans les périodes chargées",
  "Reprendre contact après une longue absence",
  "Créer du lien lorsqu'on arrive dans une nouvelle ville",
  "Écouter un ami qui traverse une période difficile",
  "Sortir de l'isolement par petites étapes",
  "Conduire une réunion où chacun peut parler",
  "Recevoir une critique professionnelle sans se fermer",
  "Prévenir les tensions dans une équipe hybride",
  "Médiation : préparer les faits et les besoins",
  "Reconnaître une relation déséquilibrée",
  "Exercice privé : cartographier son réseau de soutien",
  "Document partagé pour préparer une médiation",
  "Ressource signalée : informations à vérifier",
] as const;

const richContents = [
  `# Revenir au moment présent

Une montée d'anxiété est impressionnante, mais elle finit par redescendre. L'objectif n'est pas de la combattre : il s'agit de retrouver assez de stabilité pour choisir la suite.

## Exercice en trois temps

1. Posez les deux pieds au sol et nommez cinq éléments visibles.
2. Allongez doucement l'expiration, sans chercher une respiration parfaite.
3. Répétez : **« Cette sensation est pénible, mais temporaire. »**

> Si la douleur est inhabituelle ou inquiétante, contactez un professionnel de santé.

Notez ensuite ce qui vous a aidé afin de constituer votre propre trousse de premiers gestes.`,
  `# Observer avant de changer

Pendant une semaine, notez les situations qui précèdent une hausse du stress. Un relevé court et régulier est plus utile qu'un long récit rédigé une seule fois.

| Situation | Pensée automatique | Intensité sur 10 |
| --- | --- | --- |
| Réunion imprévue | Je ne serai pas prêt | 7 |
| Message tardif | Je dois répondre maintenant | 6 |

## Questions utiles

- Que s'est-il réellement passé ?
- Quel besoin n'était pas respecté ?
- Quelle petite action est sous mon contrôle ?

Le but n'est pas de supprimer tous les déclencheurs, mais de repérer les répétitions.`,
  `# Une respiration simple

Installez-vous dans une position confortable. Inspirez sans forcer, puis laissez l'expiration durer légèrement plus longtemps.

## Séquence

1. Inspirez pendant quatre temps.
2. Expirez pendant six temps.
3. Recommencez six fois.

Si compter augmente votre tension, abandonnez le compte et observez seulement l'air qui sort. **Il n'y a rien à réussir.**

Après l'exercice, choisissez un mot pour décrire votre état. Cette trace aide à constater les effets sans les exagérer.`,
  `# Le cercle de l'évitement

Éviter une situation apporte souvent un soulagement immédiat. Ce soulagement apprend pourtant au cerveau que la situation était dangereuse, ce qui renforce l'appréhension suivante.

## Construire une échelle graduée

- Lister dix situations, de la plus accessible à la plus difficile.
- Commencer par une étape notée autour de 3 sur 10.
- Répéter cette étape avant de progresser.

Une progression utile reste **graduelle, choisie et réversible**. En cas de souffrance importante, réalisez ce travail avec un professionnel.`,
  `# Retrouver un rythme soutenable

Cet épisode audio rassemble des témoignages et des repères pour reprendre après une période d'épuisement.

## À retenir

- Le repos n'est pas une récompense.
- Une reprise durable peut être plus lente que prévu.
- Les signes physiques méritent une consultation médicale.

Préparez une feuille avant l'écoute et notez une seule décision réaliste pour la semaine. Le contenu ne remplace ni un diagnostic ni un suivi professionnel.`,
  `# Fermer réellement la journée

Le cerveau conserve les tâches inachevées. Un rituel bref permet de les déposer sans prétendre qu'elles ont disparu.

## Rituel de dix minutes

1. Écrire les trois priorités du lendemain.
2. Fermer les outils professionnels et couper leurs notifications.
3. Marquer le passage par une activité courte : marche, musique ou douche.

Si une urgence est possible, définissez explicitement le canal et les horaires d'astreinte. Une disponibilité vague devient facilement une disponibilité permanente.`,
  `# Une semaine avec des marges

Planifier uniquement les obligations crée un agenda impossible au premier imprévu. Réservez des marges visibles, au même titre qu'un rendez-vous.

## Méthode

- Estimer la durée réaliste, puis ajouter 20 %.
- Regrouper les tâches courtes.
- Garder au moins une soirée sans objectif productif.
- Réexaminer chaque engagement récurrent une fois par mois.

Une semaine équilibrée ne contient pas nécessairement autant de travail que de loisirs : elle laisse assez de récupération pour que le rythme puisse durer.`,
  `# Déconnexion progressive

Couper brutalement tous les usages numériques est rarement tenable. Ce protocole propose trois paliers d'une semaine.

## Les trois paliers

1. Désactiver les notifications non humaines.
2. Sortir les applications professionnelles de l'écran d'accueil.
3. Définir deux plages quotidiennes sans téléphone.

Mesurez le résultat par votre disponibilité mentale, pas seulement par le temps d'écran. Gardez les outils d'accessibilité ou de sécurité dont vous avez besoin.`,
] as const;

const shortContents = [
  "Cette ressource propose des repères concrets, un exercice guidé et des questions pour avancer à son rythme.",
  "Un contenu pratique fondé sur l'écoute, la formulation des besoins et la recherche d'une prochaine étape réaliste.",
  "Ce support rassemble des exemples du quotidien et une méthode progressive à adapter à sa situation.",
] as const;

const regions = [
  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Bretagne",
  "Centre-Val de Loire",
  "Grand Est",
  "Hauts-de-France",
  "Île-de-France",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d'Azur",
] as const;

const mediaTypes = ["article", "video", "pdf", "exercise", "audio", "protocol"] as const;

async function cleanDatabase() {
  await db.delete(sessionMessage);
  await db.delete(sessionParticipant);
  await db.delete(resourceSession);
  await db.delete(commentLike);
  await db.delete(report);
  await db.delete(savedResource);
  await db.delete(completion);
  await db.delete(favorite);
  await db.delete(resourceFile);
  await db.delete(comment);
  await db.delete(resource);
  await db.delete(category);
  await db.delete(twoFactor);
  await db.delete(verification);
  await db.delete(session);
  await db.delete(account);
  await db.delete(authLog);
  await db.delete(rateLimit);
  await db.delete(user);
}

/** Lignes de catégories, identiques dans les deux modes. */
function buildCategories() {
  return seedCategories.map(([name, slug, description, icon]) => ({
    id: seedId("category"),
    name,
    slug,
    description,
    icon,
  }));
}

/**
 * Lignes de ressources éditoriales.
 *
 * `categoryIds` et `authorIds` sont fournis par l'appelant : en démonstration
 * les ressources se répartissent entre les citoyens du jeu de test, en
 * production elles appartiennent toutes au compte éditorial.
 */
function buildResources(categoryIds: readonly string[], authorIds: readonly string[]) {
  return resourceTitles.map((title, index) => {
    const createdAt = daysAgo(2 + (resourceTitles.length - 1 - index) * 2);
    const status = index < 28
      ? "published" as const
      : index < 34
        ? "pending" as const
        : index < 37
          ? "draft" as const
          : index < 39
            ? "rejected" as const
            : "flagged" as const;
    return {
      id: seedId("resource"),
      title,
      content: index < richContents.length
        ? richContents[index]
        : `${shortContents[index % shortContents.length]}\n\n## Pour aller plus loin\n\nPrenez quelques minutes pour noter ce que vous souhaitez essayer et la personne que vous pourriez solliciter.`,
      summary: `${title} : conseils, repères et mise en pratique.`,
      mediaType: mediaTypes[index % mediaTypes.length],
      privacy: index % 6 === 0 || index === 37 ? "private" as const : "public" as const,
      status,
      categoryId: categoryIds[index % categoryIds.length],
      authorId: authorIds[index % authorIds.length],
      readingTime: 4 + (index * 3) % 24,
      featured: index < 5,
      viewCount: status === "published" ? 90 + integer(0, 3_800) : integer(0, 45),
      region: index % 7 === 0 ? null : regions[index % regions.length],
      createdAt,
      updatedAt: after(createdAt),
    };
  });
}

/**
 * Mode production : contenu éditorial seul, sans suppression.
 *
 * Chaque écriture est conditionnelle, de sorte qu'une seconde exécution
 * n'insère rien et ne duplique pas le catalogue.
 */
async function seedProductionContent() {
  console.log("[seed] environnement de production détecté : contenu éditorial seul.");

  const { auth } = await import("../lib/auth");
  const [existingAdmin] = await db
    .select()
    .from(user)
    .where(eq(user.email, CONTENT_ADMIN.email));

  let adminId: string;
  let generatedPassword: string | null = null;

  if (existingAdmin) {
    adminId = existingAdmin.id;
    console.log(`[seed] compte éditorial déjà présent : ${CONTENT_ADMIN.email} (mot de passe inchangé).`);
  } else {
    generatedPassword = generatePassword();
    await auth.api.signUpEmail({
      body: {
        email: CONTENT_ADMIN.email,
        password: generatedPassword,
        name: `${CONTENT_ADMIN.firstName} ${CONTENT_ADMIN.lastName}`,
        firstName: CONTENT_ADMIN.firstName,
        lastName: CONTENT_ADMIN.lastName,
      },
    });
    const [created] = await db
      .select()
      .from(user)
      .where(eq(user.email, CONTENT_ADMIN.email));
    if (!created) throw new Error(`Création du compte éditorial impossible : ${CONTENT_ADMIN.email}`);
    adminId = created.id;
    await db.update(user).set({ role: "admin", active: true }).where(eq(user.id, adminId));
  }

  // Les catégories existantes sont réutilisées par slug : `category.slug` est
  // unique, une insertion aveugle échouerait sur une base déjà garnie.
  const wanted = buildCategories();
  const existingCategories = await db.select().from(category);
  const idBySlug = new Map(existingCategories.map((row) => [row.slug, row.id]));
  const missingCategories = wanted.filter((row) => !idBySlug.has(row.slug));
  if (missingCategories.length > 0) {
    await db.insert(category).values(missingCategories);
    for (const row of missingCategories) idBySlug.set(row.slug, row.id);
  }
  const categoryIds = wanted.map((row) => idBySlug.get(row.slug)!);

  const resources = buildResources(categoryIds, [adminId]);
  const existingResources = await db.select({ id: resource.id }).from(resource);
  const knownResourceIds = new Set(existingResources.map((row) => row.id));
  const missingResources = resources.filter((row) => !knownResourceIds.has(row.id));
  if (missingResources.length > 0) {
    await db.insert(resource).values(missingResources);
  }

  console.table({
    compte_editorial: existingAdmin ? "déjà existant" : "créé",
    categories_ajoutees: missingCategories.length,
    ressources_ajoutees: missingResources.length,
  });

  if (generatedPassword) {
    // Seule occasion de lire ce mot de passe : il n'est stocké que haché.
    console.log("");
    console.log("──────────────────────────────────────────────────────────────");
    console.log("  Compte administrateur créé pour porter les ressources");
    console.log(`  Adresse       : ${CONTENT_ADMIN.email}`);
    console.log(`  Mot de passe  : ${generatedPassword}`);
    console.log("  Ce mot de passe n'est affiché qu'une fois : conservez-le,");
    console.log("  puis changez-le après la première connexion.");
    console.log("──────────────────────────────────────────────────────────────");
    console.log("");
  }

  console.log("Seed de contenu terminé avec succès.");
}

async function seed() {
  if (IS_PRODUCTION) {
    await seedProductionContent();
    return;
  }

  console.log("Démarrage du seed déterministe...");
  await cleanDatabase();

  const { auth } = await import("../lib/auth");
  for (const [email, firstName, lastName] of seedUsers) {
    await auth.api.signUpEmail({
      body: {
        email,
        password: SEED_PASSWORD,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
      },
    });
    // Évite que la protection de l'inscription bloque le jeu de démonstration.
    await db.delete(rateLimit);
  }

  const createdUsers = await db.select().from(user);
  for (const [index, definition] of seedUsers.entries()) {
    const [email, , , role, active] = definition;
    const existing = createdUsers.find((item) => item.email === email);
    if (!existing) throw new Error(`Compte de seed introuvable : ${email}`);
    await db
      .update(user)
      .set({ role, active, createdAt: daysAgo(119 - index * 2), updatedAt: daysAgo(90 - index) })
      .where(eq(user.id, existing.id));
  }

  const usersByEmail = new Map(createdUsers.map((item) => [item.email, item]));
  const activeCitizens = seedUsers
    .filter((item) => item[3] === "citizen" && item[4])
    .map((item) => usersByEmail.get(item[0])!)
    .filter(Boolean);

  const categories = buildCategories();
  await db.insert(category).values(categories);

  const resources = buildResources(
    categories.map((item) => item.id),
    activeCitizens.map((item) => item.id),
  );
  await db.insert(resource).values(resources);

  const comments = Array.from({ length: 60 }, (_, index) => {
    const target = resources[index % 28];
    const createdAt = after(target.createdAt);
    const phrases = [
      "Merci, l'exercice est facile à reprendre dans une journée chargée.",
      "Le rappel sur la progression graduelle m'a particulièrement aidé.",
      "J'aimerais essayer cette méthode avec mon groupe de parole.",
      "Le tableau permet de mettre des mots précis sur la situation.",
      "Cette ressource ouvre une discussion utile sans donner de leçon.",
      "Je garde la dernière question pour mon prochain rendez-vous.",
    ];
    return {
      id: seedId("comment"),
      content: phrases[index % phrases.length],
      resourceId: target.id,
      authorId: activeCitizens[(index + 2) % activeCitizens.length].id,
      parentId: index > 0 && index % 9 === 0 ? `seed-comment-${String(idCounter - 1).padStart(4, "0")}` : null,
      status: index === 13 || index === 44 ? "hidden" as const : "visible" as const,
      likes: 0,
      createdAt,
      updatedAt: createdAt,
    };
  });
  await db.insert(comment).values(comments);

  const commentLikes = Array.from({ length: 36 }, (_, index) => ({
    id: seedId("comment-like"),
    userId: activeCitizens[index % activeCitizens.length].id,
    commentId: comments[(index * 7) % comments.length].id,
    createdAt: after(comments[(index * 7) % comments.length].createdAt),
  }));
  await db.insert(commentLike).values(commentLikes);
  const likeCounts = new Map<string, number>();
  for (const like of commentLikes) likeCounts.set(like.commentId, (likeCounts.get(like.commentId) ?? 0) + 1);
  for (const [commentId, likes] of likeCounts) {
    await db.update(comment).set({ likes }).where(eq(comment.id, commentId));
  }

  function interactionRows(count: number, prefix: string) {
    const pairs = new Set<string>();
    const rows: Array<{ id: string; userId: string; resourceId: string; createdAt: Date }> = [];
    while (rows.length < count) {
      const citizen = pick(activeCitizens);
      const target = pick(resources.slice(0, 28));
      const key = `${citizen.id}:${target.id}`;
      if (pairs.has(key)) continue;
      pairs.add(key);
      rows.push({ id: seedId(prefix), userId: citizen.id, resourceId: target.id, createdAt: after(target.createdAt) });
    }
    return rows;
  }

  const favorites = interactionRows(50, "favorite");
  const completions = interactionRows(40, "completion");
  const savedResources = interactionRows(25, "saved");
  await db.insert(favorite).values(favorites);
  await db.insert(completion).values(completions);
  await db.insert(savedResource).values(savedResources);

  const reports = [
    { reason: "misinformation" as const, description: "Une source citée semble obsolète.", resourceId: resources[39].id, commentId: null, resolved: false },
    { reason: "inappropriate" as const, description: "Le ton de ce commentaire est déplacé.", resourceId: null, commentId: comments[13].id, resolved: true },
    { reason: "spam" as const, description: "Message répété sur plusieurs publications.", resourceId: null, commentId: comments[44].id, resolved: false },
    { reason: "other" as const, description: "Le lien externe ne fonctionne plus.", resourceId: resources[9].id, commentId: null, resolved: true },
    { reason: "harassment" as const, description: "Formulation visant personnellement un participant.", resourceId: null, commentId: comments[31].id, resolved: false },
  ].map((item, index) => ({
    id: seedId("report"),
    ...item,
    reporterId: activeCitizens[(index + 1) % activeCitizens.length].id,
    createdAt: after(item.commentId ? comments.find((entry) => entry.id === item.commentId)!.createdAt : resources.find((entry) => entry.id === item.resourceId)!.createdAt),
  }));
  await db.insert(report).values(reports);

  const files = [9, 15, 19, 22].map((resourceIndex, index) => ({
    id: seedId("file"),
    resourceId: resources[resourceIndex].id,
    url: `https://example.invalid/seed/document-${index + 1}.pdf`,
    name: `support-demonstration-${index + 1}.pdf`,
    contentType: "application/pdf",
    createdAt: after(resources[resourceIndex].createdAt),
  }));
  await db.insert(resourceFile).values(files);

  const collaborativeSessions = [
    {
      id: seedId("session"), resourceId: resources[24].id, hostId: activeCitizens[0].id,
      shareCode: "DEMO-ACTIVE", status: "active" as const, startedAt: daysAgo(1), endedAt: null,
    },
    {
      id: seedId("session"), resourceId: resources[0].id, hostId: activeCitizens[2].id,
      shareCode: "DEMO-ENDED", status: "ended" as const, startedAt: daysAgo(8), endedAt: daysAgo(8 - 0.08),
    },
  ];
  await db.insert(resourceSession).values(collaborativeSessions);

  const participants = [
    [0, 0], [0, 1], [0, 3], [1, 2], [1, 4], [1, 5],
  ].map(([sessionIndex, citizenIndex]) => ({
    id: seedId("participant"),
    sessionId: collaborativeSessions[sessionIndex].id,
    userId: activeCitizens[citizenIndex].id,
    joinedAt: new Date(collaborativeSessions[sessionIndex].startedAt.getTime() + citizenIndex * 180_000),
    leftAt: sessionIndex === 1 ? collaborativeSessions[sessionIndex].endedAt : null,
  }));
  await db.insert(sessionParticipant).values(participants);

  const conversation = [
    [0, 0, "Bonjour, je propose qu'on commence par la première question."],
    [0, 1, "D'accord. Pour moi, le besoin le plus important est d'être écouté."],
    [0, 3, "Je partage ce besoin. Je vais noter les formulations qui nous conviennent."],
    [0, 0, "Prenons cinq minutes chacun, puis nous comparerons nos réponses."],
    [0, 1, "C'est bon pour moi. La distinction entre besoin et solution est utile."],
    [0, 3, "Je termine ma note et je vous rejoins sur la synthèse."],
    [1, 2, "Merci d'être là. On peut avancer sans chercher à tout résoudre aujourd'hui."],
    [1, 4, "L'exercice d'ancrage m'aide à rester dans la discussion."],
    [1, 5, "Je peux lire les étapes à voix haute si vous le souhaitez."],
    [1, 2, "Oui, puis chacun choisira celle qui lui semble accessible."],
    [1, 4, "Je choisis l'observation des cinq éléments autour de moi."],
    [1, 5, "Parfait, terminons par une action concrète pour la semaine."],
  ] as const;
  const messages = conversation.map(([sessionIndex, citizenIndex, content], index) => ({
    id: seedId("message"),
    sessionId: collaborativeSessions[sessionIndex].id,
    authorId: activeCitizens[citizenIndex].id,
    content,
    createdAt: new Date(collaborativeSessions[sessionIndex].startedAt.getTime() + index * 240_000),
  }));
  await db.insert(sessionMessage).values(messages);

  const volumes = {
    utilisateurs: seedUsers.length,
    catégories: categories.length,
    ressources: resources.length,
    commentaires: comments.length,
    mentions_aime: commentLikes.length,
    favoris: favorites.length,
    exploitées: completions.length,
    mises_de_côté: savedResources.length,
    signalements: reports.length,
    fichiers: files.length,
    sessions: collaborativeSessions.length,
    participants: participants.length,
    messages: messages.length,
  };
  console.table(volumes);
  console.log("Seed terminé avec succès.");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Échec du seed :", error);
    process.exit(1);
  });
