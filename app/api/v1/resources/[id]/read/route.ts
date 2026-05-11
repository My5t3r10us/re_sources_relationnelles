import { db } from "@/db";
import { completion } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { id: resourceId } = await params;
    const currentUser = await requireApiAuth(req);

    const [existing] = await db
      .select({ id: completion.id })
      .from(completion)
      .where(and(eq(completion.userId, currentUser.id), eq(completion.resourceId, resourceId)))
      .limit(1);

    if (existing) {
      await db.delete(completion).where(eq(completion.id, existing.id));
    } else {
      await db.insert(completion).values({ id: crypto.randomUUID(), userId: currentUser.id, resourceId });
    }

    return apiSuccess({ isRead: !existing });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
