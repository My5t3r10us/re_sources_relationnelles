"use server";

import { db } from "@/db";
import { comment, commentLike, resource } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth-server";
import { canViewResource } from "@/lib/resource-access";
import { commentInputSchema, parseOrThrow } from "@/lib/validation";
import { revalidatePath } from "next/cache";

const requireAuth = requireUser;

export async function addComment(resourceId: string, content: string, parentId?: string) {
  const user = await requireAuth();

  const parsed = parseOrThrow(commentInputSchema, { content, parentId });

  // La ressource doit être visible par l'auteur du commentaire : sans ce
  // contrôle, on pouvait commenter une ressource privée ou en brouillon.
  const [target] = await db
    .select({
      authorId: resource.authorId,
      status: resource.status,
      privacy: resource.privacy,
    })
    .from(resource)
    .where(eq(resource.id, resourceId))
    .limit(1);

  if (!target) throw new Error("Ressource introuvable");
  if (!canViewResource(target, user)) throw new Error("Accès refusé");

  // Le commentaire parent doit appartenir à la même ressource.
  if (parsed.parentId) {
    const [parent] = await db
      .select({ resourceId: comment.resourceId })
      .from(comment)
      .where(eq(comment.id, parsed.parentId))
      .limit(1);
    if (!parent || parent.resourceId !== resourceId) {
      throw new Error("Commentaire parent invalide");
    }
  }

  const id = crypto.randomUUID();

  await db.insert(comment).values({
    id,
    content: parsed.content,
    resourceId,
    authorId: user.id,
    parentId: parsed.parentId || null,
  });

  revalidatePath(`/ressource/${resourceId}`);
  return { success: true };
}

export async function deleteComment(commentId: string, resourceId: string) {
  const user = await requireAuth();

  const [target] = await db
    .select({ authorId: comment.authorId })
    .from(comment)
    .where(eq(comment.id, commentId))
    .limit(1);

  if (!target) throw new Error("Commentaire introuvable");
  if (target.authorId !== user.id) throw new Error("Non autorisé");

  await db.delete(comment).where(eq(comment.id, commentId));
  revalidatePath(`/ressource/${resourceId}`);
  return { success: true };
}

export async function likeComment(commentId: string, resourceId: string) {
  const user = await requireAuth();

  const [existing] = await db
    .select({ id: commentLike.id })
    .from(commentLike)
    .where(
      and(
        eq(commentLike.userId, user.id),
        eq(commentLike.commentId, commentId)
      )
    )
    .limit(1);

  if (existing) {
    await db.delete(commentLike).where(eq(commentLike.id, existing.id));
    await db
      .update(comment)
      .set({ likes: sql`GREATEST(${comment.likes} - 1, 0)` })
      .where(eq(comment.id, commentId));
  } else {
    await db.insert(commentLike).values({
      id: crypto.randomUUID(),
      userId: user.id,
      commentId,
    });
    await db
      .update(comment)
      .set({ likes: sql`${comment.likes} + 1` })
      .where(eq(comment.id, commentId));
  }

  revalidatePath(`/ressource/${resourceId}`);
  return { success: true, liked: !existing };
}
