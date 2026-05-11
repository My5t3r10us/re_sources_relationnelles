"use server";

import { db } from "@/db";
import { favorite, completion, savedResource } from "@/db/schema";
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

export async function toggleRead(resourceId: string) {
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

  if (existing) {
    await db.delete(completion).where(eq(completion.id, existing.id));
  } else {
    await db.insert(completion).values({
      id: crypto.randomUUID(),
      userId: user.id,
      resourceId,
    });
  }

  revalidatePath(`/ressource/${resourceId}`);
  revalidatePath("/tableau-de-bord");
  return { success: true, isRead: !existing };
}

export async function toggleSaved(resourceId: string) {
  const user = await requireAuth();

  const [existing] = await db
    .select({ id: savedResource.id })
    .from(savedResource)
    .where(
      and(
        eq(savedResource.userId, user.id),
        eq(savedResource.resourceId, resourceId)
      )
    )
    .limit(1);

  if (existing) {
    await db.delete(savedResource).where(eq(savedResource.id, existing.id));
  } else {
    await db.insert(savedResource).values({
      id: crypto.randomUUID(),
      userId: user.id,
      resourceId,
    });
  }

  revalidatePath(`/ressource/${resourceId}`);
  revalidatePath("/tableau-de-bord");
  return { success: true, isSaved: !existing };
}
