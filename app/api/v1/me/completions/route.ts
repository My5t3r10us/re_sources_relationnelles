import { db } from "@/db";
import { completion, resource, category } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    const currentUser = await requireApiAuth(req);

    const rows = await db
      .select({
        completionId: completion.id,
        completedAt: completion.createdAt,
        id: resource.id,
        title: resource.title,
        summary: resource.summary,
        mediaType: resource.mediaType,
        imageUrl: resource.imageUrl,
        readingTime: resource.readingTime,
        categoryName: category.name,
        categorySlug: category.slug,
      })
      .from(completion)
      .innerJoin(resource, eq(completion.resourceId, resource.id))
      .leftJoin(category, eq(resource.categoryId, category.id))
      .where(eq(completion.userId, currentUser.id))
      .orderBy(desc(completion.createdAt));

    return apiSuccess(rows);
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
