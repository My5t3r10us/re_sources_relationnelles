import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin } from "@/lib/api-auth";
import { canManageUser, manageDenialMessage } from "@/lib/authz";
import type { UserRole } from "@/lib/session-user";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    const actor = await requireApiAdmin(req);
    const { id } = await params;

    const [target] = await db
      .select({ id: user.id, role: user.role, active: user.active })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (!target) return apiError("NOT_FOUND", "Utilisateur introuvable", 404);

    // Protège le super-administrateur de la désactivation par un simple
    // administrateur, et empêche quiconque de se désactiver soi-même.
    const verdict = canManageUser(actor, { id: target.id, role: target.role as UserRole });
    if (!verdict.allowed) {
      return apiError("FORBIDDEN", manageDenialMessage(verdict.reason), 403);
    }

    await db.update(user).set({ active: !target.active, updatedAt: new Date() }).where(eq(user.id, id));
    return apiSuccess({ id, active: !target.active });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
