import { db } from "@/db";
import { savedResource } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { id: resourceId } = await params;
    const currentUser = await requireApiAuth(req);

    const [existing] = await db
      .select({ id: savedResource.id })
      .from(savedResource)
      .where(and(eq(savedResource.userId, currentUser.id), eq(savedResource.resourceId, resourceId)))
      .limit(1);

    if (existing) {
      await db.delete(savedResource).where(eq(savedResource.id, existing.id));
    } else {
      await db.insert(savedResource).values({ id: crypto.randomUUID(), userId: currentUser.id, resourceId });
    }

    return apiSuccess({ isSaved: !existing });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
