import { db } from "@/db";
import { resource } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/api-auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await requireApiAuth(req);
    const { id } = await params;

    const [existing] = await db
      .select({ authorId: resource.authorId, status: resource.status })
      .from(resource)
      .where(eq(resource.id, id))
      .limit(1);

    if (!existing) return apiError("NOT_FOUND", "Ressource introuvable", 404);
    if (existing.authorId !== currentUser.id) return apiError("FORBIDDEN", "Non autorisé", 403);
    if (existing.status !== "draft") {
      return apiError("INVALID_STATE", "Seuls les brouillons peuvent être soumis", 400);
    }

    await db
      .update(resource)
      .set({ status: "pending", updatedAt: new Date() })
      .where(and(eq(resource.id, id), eq(resource.status, "draft")));

    return apiSuccess({ id, status: "pending" });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
