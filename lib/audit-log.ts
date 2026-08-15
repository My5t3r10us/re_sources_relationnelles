import { db } from "@/db";
import { authLog } from "@/db/schema";

export type AuditTargetType = "user" | "resource" | "comment" | "report" | "category";

export type AuditEvent =
  | "user.role_changed"
  | "user.active_toggled"
  | "user.created"
  | "resource.status_changed"
  | "resource.deleted"
  | "resource.featured_toggled"
  | "comment.status_changed"
  | "comment.deleted"
  | "report.resolved"
  | "category.created"
  | "category.updated"
  | "category.deleted";

/**
 * Trace une action d'administration dans `auth_log`.
 *
 * Écriture best-effort, sur le modèle de la journalisation des connexions
 * (`lib/auth.ts`) : une panne du journal ne doit jamais faire échouer l'action
 * de modération elle-même.
 */
export async function logAdminAction(params: {
  actorId: string;
  event: AuditEvent;
  targetType: AuditTargetType;
  targetId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(authLog).values({
      id: crypto.randomUUID(),
      userId: params.actorId,
      event: params.event,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });
  } catch (err) {
    console.error("[audit_log] échec de journalisation de l'action d'administration", err);
  }
}
