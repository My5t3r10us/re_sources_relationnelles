import { db } from "@/db";
import { comment } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    await requireApiAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const validStatuses = ["visible", "hidden", "flagged"];
    if (!validStatuses.includes(status)) {
      return apiError("VALIDATION_ERROR", "Statut invalide", 400);
    }

    const [existing] = await db.select({ id: comment.id }).from(comment).where(eq(comment.id, id)).limit(1);
    if (!existing) return apiError("NOT_FOUND", "Commentaire introuvable", 404);

    await db.update(comment).set({ status, updatedAt: new Date() }).where(eq(comment.id, id));
    return apiSuccess({ id, status });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
