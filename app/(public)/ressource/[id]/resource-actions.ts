"use server";

import { db } from "@/db";
import { favorite, completion } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Non authentifié");
  return session.user;
}

export async function toggleFavorite(resourceId: string) {
  const user = await requireAuth();

  const [existing] = await db
    .select({ id: favorite.id })
    .from(favorite)
    .where(
      and(eq(favorite.userId, user.id), eq(favorite.resourceId, resourceId))
    )
    .limit(1);

  if (existing) {
    await db.delete(favorite).where(eq(favorite.id, existing.id));
  } else {
    await db.insert(favorite).values({
      id: crypto.randomUUID(),
      userId: user.id,
      resourceId,
    });
  }

  revalidatePath(`/ressource/${resourceId}`);
  return { success: true, isFavorite: !existing };
}

export async function markAsRead(resourceId: string) {
  const user = await requireAuth();

  const [existing] = await db
    .select({ id: completion.id })
    .from(completion)
    .where(
      and(
        eq(completion.userId, user.id),
        eq(completion.resourceId, resourceId)
      )
    )
    .limit(1);

  if (existing) return { success: true, alreadyRead: true };

  await db.insert(completion).values({
    id: crypto.randomUUID(),
    userId: user.id,
    resourceId,
  });

  revalidatePath(`/ressource/${resourceId}`);
  return { success: true, alreadyRead: false };
}
