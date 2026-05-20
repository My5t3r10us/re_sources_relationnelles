import { db } from "@/db";
import { resource, category, user, resourceFile, favorite, completion, savedResource } from "@/db/schema";
import { eq, and, or, ilike, desc, count, sql, inArray } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getApiSession, requireApiAuth } from "@/lib/api-auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const search = searchParams.get("search") ?? "";
  const categoryParam = searchParams.get("category") ?? "";
  const mediaType = searchParams.get("mediaType") ?? "";
  const offset = (page - 1) * limit;

  const session = await getApiSession(req);
  const isAdmin = session?.role === "admin" || session?.role === "super_admin";
  const statusParam = searchParams.get("status") ?? "";

  const filters = [];

  if (!isAdmin) {
    filters.push(eq(resource.status, "published"));
    filters.push(eq(resource.privacy, "public"));
  } else if (statusParam) {
    filters.push(eq(resource.status, statusParam as never));
  }

  if (search) {
    filters.push(or(ilike(resource.title, `%${search}%`), ilike(resource.summary, `%${search}%`)));
  }

  if (categoryParam) {
    const [cat] = await db
      .select({ id: category.id })
      .from(category)
      .where(or(eq(category.id, categoryParam), eq(category.slug, categoryParam)))
      .limit(1);
    if (cat) filters.push(eq(resource.categoryId, cat.id));
  }

  if (mediaType) {
    filters.push(eq(resource.mediaType, mediaType as never));
  }

  const where = filters.length ? and(...filters) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(resource)
    .where(where);

  const rows = await db
    .select({
      id: resource.id,
      title: resource.title,
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
    .where(where)
    .orderBy(desc(resource.createdAt))
    .limit(limit)
    .offset(offset);

  let enriched: Array<(typeof rows)[number] & { isFavorite: boolean; isSaved: boolean; isRead: boolean }> = rows.map((r) => ({
    ...r,
    isFavorite: false,
    isSaved: false,
    isRead: false,
  }));

  if (session && rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const [favs, saves, comps] = await Promise.all([
      db.select({ resourceId: favorite.resourceId }).from(favorite)
        .where(and(eq(favorite.userId, session.id), inArray(favorite.resourceId, ids))),
      db.select({ resourceId: savedResource.resourceId }).from(savedResource)
        .where(and(eq(savedResource.userId, session.id), inArray(savedResource.resourceId, ids))),
      db.select({ resourceId: completion.resourceId }).from(completion)
        .where(and(eq(completion.userId, session.id), inArray(completion.resourceId, ids))),
    ]);
    const favSet = new Set(favs.map((f) => f.resourceId));
    const saveSet = new Set(saves.map((s) => s.resourceId));
    const compSet = new Set(comps.map((c) => c.resourceId));
    enriched = enriched.map((r) => ({
      ...r,
      isFavorite: favSet.has(r.id),
      isSaved: saveSet.has(r.id),
      isRead: compSet.has(r.id),
    }));
  }

  return apiSuccess(enriched, { page, limit, total: Number(total) });
}

export async function POST(req: Request) {
  try {
    const currentUser = await requireApiAuth(req);
    const body = await req.json();
    const { title, content, summary, mediaType, categoryId, privacy, isDraft, imageUrl, attachments } = body;

    if (!title?.trim() || !content?.trim()) {
      return apiError("VALIDATION_ERROR", "Le titre et le contenu sont requis", 400);
    }

    const id = crypto.randomUUID();
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

    await db.insert(resource).values({
      id,
      title: title.trim(),
      content,
      summary: summary?.trim() || title.trim().substring(0, 160),
      mediaType: (mediaType || "article") as never,
      privacy: privacy || "public",
      status: isDraft ? "draft" : "pending",
      categoryId: resolvedCategoryId,
      authorId: currentUser.id,
      imageUrl: imageUrl || null,
      readingTime,
    });

    if (Array.isArray(attachments) && attachments.length > 0) {
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

    const [created] = await db.select().from(resource).where(eq(resource.id, id)).limit(1);
    return apiSuccess(created, undefined, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
