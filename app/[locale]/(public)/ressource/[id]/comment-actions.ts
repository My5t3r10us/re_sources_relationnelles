"use server";

import { db } from "@/db";
import { comment, commentLike } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getServerSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Non authentifié");
  return session.user;
}

export async function addComment(resourceId: string, content: string, parentId?: string) {
  const user = await requireAuth();

  if (!content?.trim()) throw new Error("Le commentaire ne peut pas être vide");
  if (content.length > 2000) throw new Error("Le commentaire est trop long (max 2000 caractères)");

  const id = crypto.randomUUID();

  await db.insert(comment).values({
    id,
    content: content.trim(),
    resourceId,
    authorId: user.id,
    parentId: parentId || null,
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
