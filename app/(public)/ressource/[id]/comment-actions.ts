"use server";

import { db } from "@/db";
import { comment } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
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
  await requireAuth();

  await db
    .update(comment)
    .set({ likes: sql`${comment.likes} + 1` })
    .where(eq(comment.id, commentId));

  revalidatePath(`/ressource/${resourceId}`);
  return { success: true };
}
