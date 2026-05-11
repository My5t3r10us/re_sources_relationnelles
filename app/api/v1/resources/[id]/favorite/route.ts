import { db } from "@/db";
import { favorite } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { id: resourceId } = await params;
    const currentUser = await requireApiAuth(req);

    const [existing] = await db
      .select({ id: favorite.id })
      .from(favorite)
      .where(and(eq(favorite.userId, currentUser.id), eq(favorite.resourceId, resourceId)))
      .limit(1);

    if (existing) {
      await db.delete(favorite).where(eq(favorite.id, existing.id));
    } else {
      await db.insert(favorite).values({ id: crypto.randomUUID(), userId: currentUser.id, resourceId });
    }

    return apiSuccess({ isFavorite: !existing });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
