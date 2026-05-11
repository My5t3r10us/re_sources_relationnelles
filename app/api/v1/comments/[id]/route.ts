import { db } from "@/db";
import { comment } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const currentUser = await requireApiAuth(req);

    const [target] = await db
      .select({ authorId: comment.authorId })
      .from(comment)
      .where(eq(comment.id, id))
      .limit(1);

    if (!target) return apiError("NOT_FOUND", "Commentaire introuvable", 404);
    if (target.authorId !== currentUser.id) return apiError("FORBIDDEN", "Non autorisé", 403);

    await db.delete(comment).where(eq(comment.id, id));
    return apiSuccess({ deleted: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
