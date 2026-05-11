import { db } from "@/db";
import { resource, category, user } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    await requireApiAdmin(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const statusParam = searchParams.get("status") ?? "";
    const featuredParam = searchParams.get("featured") ?? "";
    const offset = (page - 1) * limit;

    const filters = [];
    if (statusParam) filters.push(eq(resource.status, statusParam as never));
    if (featuredParam === "true") filters.push(eq(resource.featured, true));
    const where = filters.length ? and(...filters) : undefined;

    const [{ total }] = await db.select({ total: count() }).from(resource).where(where);

    const rows = await db
      .select({
        id: resource.id,
        title: resource.title,
        status: resource.status,
        privacy: resource.privacy,
        mediaType: resource.mediaType,
        featured: resource.featured,
        viewCount: resource.viewCount,
        createdAt: resource.createdAt,
        categoryName: category.name,
        authorName: user.name,
        authorEmail: user.email,
      })
      .from(resource)
      .leftJoin(category, eq(resource.categoryId, category.id))
      .leftJoin(user, eq(resource.authorId, user.id))
      .where(where)
      .orderBy(desc(resource.createdAt))
      .limit(limit)
      .offset(offset);

    return apiSuccess(rows, { page, limit, total: Number(total) });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
