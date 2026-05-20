import { db } from "@/db";
import { resource, category, user, resourceFile, favorite, completion, savedResource } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getApiSession, requireApiAuth } from "@/lib/api-auth";
import { deleteObject, getObjectKeyFromUrl } from "@/lib/s3";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getApiSession(req);

  const [row] = await db
    .select({
      id: resource.id,
      title: resource.title,
      content: resource.content,
      summary: resource.summary,
      mediaType: resource.mediaType,
      privacy: resource.privacy,
      status: resource.status,
      imageUrl: resource.imageUrl,
      readingTime: resource.readingTime,
      featured: resource.featured,
      viewCount: resource.viewCount,
      region: resource.region,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      categoryId: resource.categoryId,
      categoryName: category.name,
      categorySlug: category.slug,
      authorId: resource.authorId,
      authorName: user.name,
    })
    .from(resource)
    .leftJoin(category, eq(resource.categoryId, category.id))
    .leftJoin(user, eq(resource.authorId, user.id))
    .where(eq(resource.id, id))
    .limit(1);

  if (!row) return apiError("NOT_FOUND", "Ressource introuvable", 404);

  const isAdmin = session?.role === "admin" || session?.role === "super_admin";
  const isAuthor = session?.id === row.authorId;

  if (row.status !== "published" && !isAdmin && !isAuthor) {
    return apiError("NOT_FOUND", "Ressource introuvable", 404);
  }
  if (row.privacy === "private" && !isAuthor && !isAdmin) {
    return apiError("FORBIDDEN", "Accès refusé", 403);
  }

  const files = await db
    .select({ id: resourceFile.id, url: resourceFile.url, name: resourceFile.name, contentType: resourceFile.contentType })
    .from(resourceFile)
    .where(eq(resourceFile.resourceId, id));

  let isFavorite = false;
  let isRead = false;
  let isSaved = false;

  if (session) {
    const [fav] = await db.select({ id: favorite.id }).from(favorite)
      .where(and(eq(favorite.userId, session.id), eq(favorite.resourceId, id)))
      .limit(1);
    isFavorite = !!fav;

    const [comp] = await db.select({ id: completion.id }).from(completion)
      .where(and(eq(completion.userId, session.id), eq(completion.resourceId, id)))
      .limit(1);
    isRead = !!comp;

    const [saved] = await db.select({ id: savedResource.id }).from(savedResource)
      .where(and(eq(savedResource.userId, session.id), eq(savedResource.resourceId, id)))
      .limit(1);
    isSaved = !!saved;
  }

  await db.update(resource).set({ viewCount: (row.viewCount ?? 0) + 1 }).where(eq(resource.id, id));

  return apiSuccess({ ...row, files, isFavorite, isRead, isSaved });
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const currentUser = await requireApiAuth(req);
    const body = await req.json();
    const { title, content, summary, mediaType, categoryId, privacy, isDraft, imageUrl, attachments } = body;

    if (!title?.trim() || !content?.trim()) {
      return apiError("VALIDATION_ERROR", "Le titre et le contenu sont requis", 400);
    }

    const [existing] = await db
      .select({ authorId: resource.authorId })
      .from(resource)
      .where(eq(resource.id, id))
      .limit(1);

    if (!existing) return apiError("NOT_FOUND", "Ressource introuvable", 404);
    if (existing.authorId !== currentUser.id) return apiError("FORBIDDEN", "Non autorisé", 403);

    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    let resolvedCategoryId: string | null = null;
    if (categoryId) {
      const [cat] = await db
        .select({ id: category.id })
        .from(category)
        .where(or(eq(category.id, categoryId), eq(category.slug, categoryId)))
        .limit(1);
      resolvedCategoryId = cat?.id ?? null;
    }

    await db.update(resource).set({
      title: title.trim(),
      content,
      summary: summary?.trim() || title.trim().substring(0, 160),
      mediaType: (mediaType || "article") as never,
      privacy: privacy || "public",
      status: isDraft ? "draft" : "pending",
      categoryId: resolvedCategoryId,
      imageUrl: imageUrl || null,
      readingTime,
      updatedAt: new Date(),
    }).where(eq(resource.id, id));

    if (Array.isArray(attachments) && attachments.length > 0) {
      await db.delete(resourceFile).where(eq(resourceFile.resourceId, id));
      await db.insert(resourceFile).values(
        attachments.map((a: { url: string; name: string; contentType: string }) => ({
          id: crypto.randomUUID(),
          resourceId: id,
          url: a.url,
          name: a.name,
          contentType: a.contentType,
        }))
      );
    }

    const [updated] = await db.select().from(resource).where(eq(resource.id, id)).limit(1);
    return apiSuccess(updated);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const currentUser = await requireApiAuth(req);

    const [existing] = await db
      .select({ authorId: resource.authorId, imageUrl: resource.imageUrl })
      .from(resource)
      .where(eq(resource.id, id))
      .limit(1);

    if (!existing) return apiError("NOT_FOUND", "Ressource introuvable", 404);

    const isAdmin = currentUser.role === "admin" || currentUser.role === "super_admin";
    if (existing.authorId !== currentUser.id && !isAdmin) {
      return apiError("FORBIDDEN", "Non autorisé", 403);
    }

    const files = await db
      .select({ url: resourceFile.url })
      .from(resourceFile)
      .where(eq(resourceFile.resourceId, id));

    await db.delete(resource).where(eq(resource.id, id));

    const urlsToDelete = [
      ...(existing.imageUrl ? [existing.imageUrl] : []),
      ...files.map((f) => f.url),
    ];
    await Promise.allSettled(
      urlsToDelete.map((url) => {
        const key = getObjectKeyFromUrl(url);
        return key ? deleteObject(key) : Promise.resolve();
      })
    );

    return apiSuccess({ deleted: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
