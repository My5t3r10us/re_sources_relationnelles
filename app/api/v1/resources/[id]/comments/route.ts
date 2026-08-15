import { db } from "@/db";
import { comment, resource, user } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getApiSession, requireApiAuth, type ApiUser } from "@/lib/api-auth";
import { resourceViewDenial } from "@/lib/resource-access";
import { commentInputSchema, firstIssueMessage } from "@/lib/validation";
import { enforceRateLimit, requestIdentity, RATE_LIMITS } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

/**
 * Charge la ressource et applique la règle de visibilité.
 *
 * Les commentaires n'étaient auparavant rattachés à aucun contrôle : ceux
 * d'une ressource privée ou en brouillon étaient lisibles, et n'importe qui
 * pouvait commenter une ressource qu'il n'avait pas le droit de lire.
 */
async function loadVisibleResource(resourceId: string, viewer: ApiUser | null) {
  const [row] = await db
    .select({
      id: resource.id,
      authorId: resource.authorId,
      status: resource.status,
      privacy: resource.privacy,
    })
    .from(resource)
    .where(eq(resource.id, resourceId))
    .limit(1);

  if (!row) return { error: apiError("NOT_FOUND", "Ressource introuvable", 404) };

  const denial = resourceViewDenial(row, viewer);
  if (denial === "not_found") {
    return { error: apiError("NOT_FOUND", "Ressource introuvable", 404) };
  }
  if (denial === "forbidden") {
    return { error: apiError("FORBIDDEN", "Accès refusé", 403) };
  }

  return { resource: row };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { id: resourceId } = await params;
    const session = await getApiSession(req);

    const loaded = await loadVisibleResource(resourceId, session);
    if (loaded.error) return loaded.error;

    const comments = await db
      .select({
        id: comment.id,
        content: comment.content,
        parentId: comment.parentId,
        status: comment.status,
        likes: comment.likes,
        createdAt: comment.createdAt,
        authorId: comment.authorId,
        authorName: user.name,
      })
      .from(comment)
      .leftJoin(user, eq(comment.authorId, user.id))
      .where(and(eq(comment.resourceId, resourceId), eq(comment.status, "visible")))
      .orderBy(asc(comment.createdAt));

    return apiSuccess(comments);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { id: resourceId } = await params;
    const currentUser = await requireApiAuth(req);

    const limited = await enforceRateLimit(
      "comment",
      requestIdentity(req, currentUser.id),
      RATE_LIMITS.comment
    );
    if (limited) return limited;

    const loaded = await loadVisibleResource(resourceId, currentUser);
    if (loaded.error) return loaded.error;

    const parsed = commentInputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", firstIssueMessage(parsed.error), 400);
    }
    const { content, parentId } = parsed.data;

    // Un fil de discussion ne peut pas enjamber deux ressources : sans ce
    // contrôle, une réponse pouvait être rattachée au commentaire d'une autre
    // ressource et corrompre l'arborescence d'affichage.
    if (parentId) {
      const [parent] = await db
        .select({ id: comment.id, resourceId: comment.resourceId })
        .from(comment)
        .where(eq(comment.id, parentId))
        .limit(1);
      if (!parent || parent.resourceId !== resourceId) {
        return apiError("VALIDATION_ERROR", "Commentaire parent invalide", 400);
      }
    }

    const id = crypto.randomUUID();
    await db.insert(comment).values({
      id,
      content,
      resourceId,
      authorId: currentUser.id,
      parentId: parentId || null,
    });

    const [created] = await db
      .select({
        id: comment.id,
        content: comment.content,
        parentId: comment.parentId,
        status: comment.status,
        likes: comment.likes,
        createdAt: comment.createdAt,
        authorId: comment.authorId,
        authorName: user.name,
      })
      .from(comment)
      .leftJoin(user, eq(comment.authorId, user.id))
      .where(eq(comment.id, id))
      .limit(1);

    return apiSuccess(created, undefined, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
