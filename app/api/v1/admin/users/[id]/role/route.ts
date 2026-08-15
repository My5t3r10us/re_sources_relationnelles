import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireApiAdmin } from "@/lib/api-auth";
import { logAdminAction } from "@/lib/audit-log";
import { canAssignRole, canManageUser, manageDenialMessage } from "@/lib/authz";
import { roleSchema } from "@/lib/validation";
import type { UserRole } from "@/lib/session-user";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    // L'authentification passe AVANT la lecture du corps : un appelant anonyme
    // ne doit pas obtenir de réponse discriminante sur la validité du payload.
    const actor = await requireApiAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const { role } = body ?? {};

    const [target] = await db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (!target) return apiError("NOT_FOUND", "Utilisateur introuvable", 404);

    // Contrôle sur la CIBLE : auparavant seul le rôle demandé était examiné,
    // si bien qu'un administrateur pouvait rétrograder un super-administrateur.
    const verdict = canManageUser(actor, { id: target.id, role: target.role as UserRole });
    if (!verdict.allowed) {
      return apiError("FORBIDDEN", manageDenialMessage(verdict.reason), 403);
    }

    // Un rôle inconnu est une entrée malformée (400) ; un rôle valide que
    // l'acteur n'a pas le droit d'attribuer est un refus d'autorisation (403).
    const parsedRole = roleSchema.safeParse(role);
    if (!parsedRole.success) {
      return apiError("VALIDATION_ERROR", "Rôle invalide", 400);
    }

    // Liste blanche selon le rôle de l'acteur : seul un super-administrateur
    // peut attribuer `super_admin`.
    if (!canAssignRole(actor.role, parsedRole.data)) {
      return apiError("FORBIDDEN", "Vous ne pouvez pas attribuer ce rôle", 403);
    }

    await db
      .update(user)
      .set({ role: parsedRole.data, updatedAt: new Date() })
      .where(eq(user.id, id));
    await logAdminAction({
      actorId: actor.id,
      event: "user.role_changed",
      targetType: "user",
      targetId: id,
      metadata: { role: parsedRole.data },
    });
    return apiSuccess({ id, role: parsedRole.data });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
