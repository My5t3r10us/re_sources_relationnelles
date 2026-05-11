import { db } from "@/db";
import { favorite, resource, category } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    const currentUser = await requireApiAuth(req);

    const rows = await db
      .select({
        favoriteId: favorite.id,
        favoritedAt: favorite.createdAt,
        id: resource.id,
        title: resource.title,
        summary: resource.summary,
        mediaType: resource.mediaType,
        imageUrl: resource.imageUrl,
        readingTime: resource.readingTime,
        categoryName: category.name,
        categorySlug: category.slug,
      })
      .from(favorite)
      .innerJoin(resource, eq(favorite.resourceId, resource.id))
      .leftJoin(category, eq(resource.categoryId, category.id))
      .where(eq(favorite.userId, currentUser.id))
      .orderBy(desc(favorite.createdAt));

    return apiSuccess(rows);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
