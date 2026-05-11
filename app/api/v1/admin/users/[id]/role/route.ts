import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin, requireApiSuperAdmin } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { role } = body;

    const superAdminRoles = ["super_admin"];
    const adminRoles = ["citizen", "moderator", "admin"];

    if (superAdminRoles.includes(role)) {
      await requireApiSuperAdmin(req);
    } else if (adminRoles.includes(role)) {
      await requireApiAdmin(req);
    } else {
      return apiError("VALIDATION_ERROR", "Rôle invalide", 400);
    }

    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.id, id)).limit(1);
    if (!existing) return apiError("NOT_FOUND", "Utilisateur introuvable", 404);

    await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, id));
    return apiSuccess({ id, role });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
