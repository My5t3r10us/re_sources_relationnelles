import { timingSafeEqual } from "node:crypto";
import { and, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  authLog,
  comment,
  commentLike,
  completion,
  favorite,
  report,
  resource,
  resourceFile,
  savedResource,
  sessionMessage,
  sessionParticipant,
  user,
} from "@/db/schema";
import { deleteObject, getStoredObjectKey } from "@/lib/s3";

/**
 * Mise en œuvre des droits RGPD des citoyens.
 *
 * Couvre les constats F-4 (droit à l'effacement, art. 17), F-5 (durée de
 * conservation du journal) et F-6 (droit à la portabilité, art. 20) de
 * `SECURITY_AUDIT.md`.
 */

/**
 * Compte réceptacle des contenus publics d'un citoyen supprimé.
 *
 * Toutes les clés étrangères pointant vers `user` sont en `ON DELETE cascade` :
 * un simple `DELETE` détruirait aussi les ressources publiées et les
 * commentaires visibles, c'est-à-dire le patrimoine de la plateforme et les fils
 * de discussion auxquels d'autres citoyens ont participé. L'article 17 §1 porte
 * sur les *données à caractère personnel* ; une contribution détachée de toute
 * identité n'en est plus une. On réattribue donc le contenu public à ce compte
 * avant de supprimer la personne.
 */
export const DELETED_USER_ID = "00000000-0000-0000-0000-000000000000";
export const DELETED_USER_NAME = "Utilisateur supprimé";
const DELETED_USER_EMAIL = "utilisateur-supprime@invalid.local";

/** Durée de conservation par défaut du journal d'authentification, en jours. */
export const DEFAULT_AUTH_LOG_RETENTION_DAYS = 180;

/**
 * Crée le compte réceptacle s'il n'existe pas encore.
 *
 * Création paresseuse plutôt que via une migration de données ou le seed : le
 * schéma des bases de test est appliqué par `drizzle-kit push`, qui ne charge
 * aucune donnée. Un compte créé à la demande existe donc partout — production,
 * préproduction, CI — sans couplage à l'ordonnancement des migrations.
 *
 * Le compte est inactif et n'a aucune ligne `account` : il est donc dépourvu de
 * mot de passe, et `loadVerifiedUser` renvoie `null` pour tout compte inactif.
 * Il n'est connectable par aucun moyen.
 */
export async function ensureDeletedUserPlaceholder(): Promise<string> {
  await db
    .insert(user)
    .values({
      id: DELETED_USER_ID,
      name: DELETED_USER_NAME,
      email: DELETED_USER_EMAIL,
      emailVerified: false,
      role: "citizen",
      active: false,
    })
    .onConflictDoNothing({ target: user.id });

  return DELETED_USER_ID;
}

export interface UserDataExport {
  exportedAt: string;
  compte: Record<string, unknown>;
  ressources: unknown[];
  commentaires: unknown[];
  favoris: unknown[];
  ressourcesTerminees: unknown[];
  ressourcesMisesDeCote: unknown[];
  signalements: unknown[];
  participationsSessions: unknown[];
  messagesSessions: unknown[];
}

/**
 * Rassemble les données personnelles d'un citoyen (art. 20 — portabilité).
 *
 * Format JSON, « structuré, couramment utilisé et lisible par machine » comme
 * l'exige l'article. Le journal d'authentification n'y figure pas : il relève
 * de l'obligation de sécurité et sa communication exposerait les adresses IP
 * associées à d'autres traitements.
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  const [compte] = await db
    .select({
      id: user.id,
      nom: user.name,
      email: user.email,
      emailVerifie: user.emailVerified,
      prenom: user.firstName,
      nomDeFamille: user.lastName,
      image: user.image,
      role: user.role,
      actif: user.active,
      doubleAuthentification: user.twoFactorEnabled,
      creeLe: user.createdAt,
      misAJourLe: user.updatedAt,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!compte) throw new Error("Compte introuvable");

  const [
    ressources,
    commentaires,
    favoris,
    ressourcesTerminees,
    ressourcesMisesDeCote,
    signalements,
    participationsSessions,
    messagesSessions,
  ] = await Promise.all([
    db.select().from(resource).where(eq(resource.authorId, userId)),
    db.select().from(comment).where(eq(comment.authorId, userId)),
    db.select().from(favorite).where(eq(favorite.userId, userId)),
    db.select().from(completion).where(eq(completion.userId, userId)),
    db.select().from(savedResource).where(eq(savedResource.userId, userId)),
    db.select().from(report).where(eq(report.reporterId, userId)),
    db
      .select()
      .from(sessionParticipant)
      .where(eq(sessionParticipant.userId, userId)),
    db.select().from(sessionMessage).where(eq(sessionMessage.authorId, userId)),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    compte,
    ressources,
    commentaires,
    favoris,
    ressourcesTerminees,
    ressourcesMisesDeCote,
    signalements,
    participationsSessions,
    messagesSessions,
  };
}

export interface AccountDeletionReport {
  ressourcesAnonymisees: number;
  commentairesAnonymises: number;
  fichiersSupprimes: number;
}

/**
 * Efface un compte citoyen (art. 17), en préservant ses contributions publiques
 * sous une identité anonyme.
 *
 * Sont **conservées et réattribuées** au compte réceptacle : les ressources
 * publiées et les commentaires visibles.
 *
 * Sont **détruites** : l'identité, les brouillons et ressources non publiées,
 * leurs fichiers dans le bucket, les favoris, les ressources terminées ou mises
 * de côté, les signalements émis, les sessions collaboratives et les jetons
 * d'authentification — par cascade sur la suppression de la ligne `user`.
 *
 * `auth_log.user_id` est mis à `NULL` : la table n'a délibérément pas de clé
 * étrangère vers `user` (l'historique de connexion doit survivre à la
 * suppression pour l'obligation de journalisation), donc rien ne nettoierait
 * l'identifiant sans cette étape — et un identifiant qui pend est encore une
 * donnée personnelle si on peut le recouper.
 */
export async function deleteUserAccount(
  userId: string,
): Promise<AccountDeletionReport> {
  if (userId === DELETED_USER_ID) {
    throw new Error("Le compte réceptacle ne peut pas être supprimé");
  }

  const placeholderId = await ensureDeletedUserPlaceholder();

  // Les fichiers doivent être recensés AVANT la suppression : la cascade efface
  // les lignes `resource` et `resource_file`, et leurs URL avec elles.
  const perissables = await db
    .select({ id: resource.id, imageUrl: resource.imageUrl })
    .from(resource)
    .where(and(eq(resource.authorId, userId), ne(resource.status, "published")));

  const perissableIds = perissables.map((r) => r.id);
  const fichiers = perissableIds.length
    ? await db
        .select({ url: resourceFile.url })
        .from(resourceFile)
        .where(inArray(resourceFile.resourceId, perissableIds))
    : [];

  const urlsASupprimer = [
    ...perissables.flatMap((r) => (r.imageUrl ? [r.imageUrl] : [])),
    ...fichiers.map((f) => f.url),
  ];

  const ressourcesAnonymisees = await db
    .update(resource)
    .set({ authorId: placeholderId, updatedAt: new Date() })
    .where(and(eq(resource.authorId, userId), eq(resource.status, "published")))
    .returning({ id: resource.id });

  const commentairesAnonymises = await db
    .update(comment)
    .set({ authorId: placeholderId, updatedAt: new Date() })
    .where(and(eq(comment.authorId, userId), eq(comment.status, "visible")))
    .returning({ id: comment.id });

  // Les « j'aime » posés par le partant sont des données personnelles et
  // partent avec lui ; ceux posés par autrui sur ses commentaires conservés
  // restent, la cascade ne les touche pas.
  await db.delete(commentLike).where(eq(commentLike.userId, userId));

  await db
    .update(authLog)
    .set({ userId: null })
    .where(eq(authLog.userId, userId));

  await db.delete(user).where(eq(user.id, userId));

  // Après la suppression : un échec S3 laisse des fichiers orphelins (coût de
  // stockage), alors qu'un échec en base laisserait des données personnelles
  // en place (manquement RGPD). `allSettled` pour qu'un objet déjà absent
  // n'interrompe pas les suivants.
  const suppressions = await Promise.allSettled(
    urlsASupprimer.map((url) => {
      const key = getStoredObjectKey(url);
      return key ? deleteObject(key) : Promise.resolve();
    }),
  );
  const echecs = suppressions.filter((r) => r.status === "rejected").length;
  if (echecs > 0) {
    console.error(
      `[rgpd] ${echecs} fichier(s) non supprimé(s) du bucket pour le compte ${userId}.`,
    );
  }

  return {
    ressourcesAnonymisees: ressourcesAnonymisees.length,
    commentairesAnonymises: commentairesAnonymises.length,
    fichiersSupprimes: urlsASupprimer.length - echecs,
  };
}

/**
 * Supprime les entrées du journal plus anciennes que la durée de conservation.
 *
 * `auth_log` conserve adresses IP et user-agents, qui sont des données
 * personnelles : les garder sans limite contrevient au principe de limitation
 * de conservation (art. 5-1-e). 180 jours reprend la recommandation de la CNIL
 * sur les journaux de connexion ; `AUTH_LOG_RETENTION_DAYS` permet d'ajuster
 * sans redéploiement.
 */
export async function purgeAuthLog(
  retentionDays: number = authLogRetentionDays(),
): Promise<number> {
  if (!Number.isFinite(retentionDays) || retentionDays < 1) {
    throw new Error("La durée de conservation doit être d'au moins 1 jour");
  }

  const seuil = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const supprimees = await db
    .delete(authLog)
    .where(lt(authLog.createdAt, seuil))
    .returning({ id: authLog.id });

  return supprimees.length;
}

export function authLogRetentionDays(): number {
  const brut = Number(process.env.AUTH_LOG_RETENTION_DAYS);
  return Number.isFinite(brut) && brut >= 1
    ? brut
    : DEFAULT_AUTH_LOG_RETENTION_DAYS;
}

/**
 * Comparaison à temps constant du secret d'ordonnancement.
 *
 * Une comparaison `===` s'arrête au premier octet différent : le temps de
 * réponse laisse alors deviner le secret octet par octet.
 */
export function secretMatches(fourni: string, attendu: string): boolean {
  const a = Buffer.from(fourni);
  const b = Buffer.from(attendu);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Nombre d'entrées du journal antérieures au seuil (diagnostic). */
export async function countExpiredAuthLogEntries(
  retentionDays: number = authLogRetentionDays(),
): Promise<number> {
  const seuil = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(authLog)
    .where(lt(authLog.createdAt, seuil));
  return row?.count ?? 0;
}
