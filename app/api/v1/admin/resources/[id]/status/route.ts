import { db } from "@/db";
import { resource } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin } from "@/lib/api-auth";
import { logAdminAction } from "@/lib/audit-log";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    const actor = await requireApiAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const validStatuses = ["draft", "pending", "published", "rejected", "flagged"];
    if (!validStatuses.includes(status)) {
      return apiError("VALIDATION_ERROR", "Statut invalide", 400);
    }

    const [existing] = await db.select({ id: resource.id }).from(resource).where(eq(resource.id, id)).limit(1);
    if (!existing) return apiError("NOT_FOUND", "Ressource introuvable", 404);

    await db.update(resource).set({ status, updatedAt: new Date() }).where(eq(resource.id, id));
    await logAdminAction({
      actorId: actor.id,
      event: "resource.status_changed",
      targetType: "resource",
      targetId: id,
      metadata: { status },
    });
    return apiSuccess({ id, status });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
