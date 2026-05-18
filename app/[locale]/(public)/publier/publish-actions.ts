"use server";

import { db } from "@/db";
import { resource, category, resourceFile } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { deleteObject, getObjectKeyFromUrl } from "@/lib/s3";
import { getServerSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface AttachmentInput {
  url: string;
  name: string;
  contentType: string;
}

interface PublishParams {
  title: string;
  content: string;
  summary: string;
  mediaType: string;
  categoryId: string | null;
  privacy: "public" | "private";
  isDraft: boolean;
  imageUrl: string | null;
  attachments?: AttachmentInput[];
}

async function resolveCategoryId(categoryId: string | null): Promise<string | null> {
  if (!categoryId) return null;
  // If it looks like a UUID, use it directly
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId)) {
    return categoryId;
  }
  // Otherwise try to find by slug
  const [cat] = await db
    .select({ id: category.id })
    .from(category)
    .where(eq(category.slug, categoryId))
    .limit(1);
  return cat?.id ?? null;
}

export async function publishResource(params: PublishParams) {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Non authentifié");

  const { title, content, summary, mediaType, categoryId, privacy, isDraft, imageUrl, attachments } = params;

  if (!title?.trim() || !content?.trim()) {
    throw new Error("Le titre et le contenu sont requis");
  }

  const id = crypto.randomUUID();
  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const resolvedCategoryId = await resolveCategoryId(categoryId);

  await db.insert(resource).values({
    id,
    title: title.trim(),
    content,
    summary: summary?.trim() || title.trim().substring(0, 160),
    mediaType: (mediaType || "article") as
      | "article"
      | "video"
      | "pdf"
      | "exercise"
      | "audio"
      | "protocol",
    privacy: privacy || "public",
    status: isDraft ? "draft" : "pending",
    categoryId: resolvedCategoryId,
    authorId: session.user.id,
    imageUrl: imageUrl || null,
    readingTime,
  });

  if (attachments && attachments.length > 0) {
    await db.insert(resourceFile).values(
      attachments.map((a) => ({
        id: crypto.randomUUID(),
        resourceId: id,
        url: a.url,
        name: a.name,
        contentType: a.contentType,
      }))
    );
  }

  revalidatePath("/catalogue");
  redirect(`/ressource/${id}`);
}

export async function updateResource(resourceId: string, params: PublishParams) {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Non authentifié");

  const { title, content, summary, mediaType, categoryId, privacy, isDraft, imageUrl, attachments } = params;

  if (!title?.trim() || !content?.trim()) {
    throw new Error("Le titre et le contenu sont requis");
  }

  // Verify ownership
  const [existing] = await db
    .select({ authorId: resource.authorId, status: resource.status })
    .from(resource)
    .where(eq(resource.id, resourceId))
    .limit(1);

  if (!existing) throw new Error("Ressource introuvable");
  if (existing.authorId !== session.user.id) throw new Error("Non autorisé");

  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const resolvedCategoryId = await resolveCategoryId(categoryId);

  await db
    .update(resource)
    .set({
      title: title.trim(),
      content,
      summary: summary?.trim() || title.trim().substring(0, 160),
      mediaType: (mediaType || "article") as
        | "article"
        | "video"
        | "pdf"
        | "exercise"
        | "audio"
        | "protocol",
      privacy: privacy || "public",
      status: isDraft ? "draft" : "pending",
      categoryId: resolvedCategoryId,
      imageUrl: imageUrl || null,
      readingTime,
      updatedAt: new Date(),
    })
    .where(eq(resource.id, resourceId));

  if (attachments && attachments.length > 0) {
    const oldFiles = await db
      .select({ url: resourceFile.url })
      .from(resourceFile)
      .where(eq(resourceFile.resourceId, resourceId));

    await db.delete(resourceFile).where(eq(resourceFile.resourceId, resourceId));

    await Promise.allSettled(
      oldFiles.map(({ url }) => {
        const key = getObjectKeyFromUrl(url);
        return key ? deleteObject(key) : Promise.resolve();
      })
    );

    await db.insert(resourceFile).values(
      attachments.map((a) => ({
        id: crypto.randomUUID(),
        resourceId,
        url: a.url,
        name: a.name,
        contentType: a.contentType,
      }))
    );
  }

  revalidatePath(`/ressource/${resourceId}`);
  revalidatePath("/catalogue");
  redirect(`/ressource/${resourceId}`);
}

export async function submitDraftForReview(resourceId: string) {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Non authentifié");

  const [existing] = await db
    .select({ authorId: resource.authorId, status: resource.status })
    .from(resource)
    .where(eq(resource.id, resourceId))
    .limit(1);

  if (!existing) throw new Error("Ressource introuvable");
  if (existing.authorId !== session.user.id) throw new Error("Non autorisé");
  if (existing.status !== "draft") throw new Error("Seuls les brouillons peuvent être soumis");

  await db
    .update(resource)
    .set({ status: "pending", updatedAt: new Date() })
    .where(and(eq(resource.id, resourceId), eq(resource.status, "draft")));

  revalidatePath("/mes-ressources");
  revalidatePath(`/ressource/${resourceId}`);
}
