import { db } from "@/db";
import { resource } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    await requireApiAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const { featured } = body;

    if (typeof featured !== "boolean") {
      return apiError("VALIDATION_ERROR", "Le champ featured doit être un booléen", 400);
    }

    const [existing] = await db.select({ id: resource.id }).from(resource).where(eq(resource.id, id)).limit(1);
    if (!existing) return apiError("NOT_FOUND", "Ressource introuvable", 404);

    await db.update(resource).set({ featured, updatedAt: new Date() }).where(eq(resource.id, id));
    return apiSuccess({ id, featured });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
