import { db } from "@/db";
import { resource, category } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    const currentUser = await requireApiAuth(req);

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
        createdAt: resource.createdAt,
        updatedAt: resource.updatedAt,
        categoryName: category.name,
        categorySlug: category.slug,
      })
      .from(resource)
      .leftJoin(category, eq(resource.categoryId, category.id))
      .where(eq(resource.authorId, currentUser.id))
      .orderBy(desc(resource.createdAt));

    return apiSuccess(rows);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
