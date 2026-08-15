import { apiError, apiSuccess } from "@/lib/api-response";
import { logMaintenanceEvent } from "@/lib/audit-log";
import { authLogRetentionDays, purgeAuthLog, secretMatches } from "@/lib/rgpd";

/**
 * Purge de rétention du journal d'authentification (F-5 / art. 5-1-e RGPD).
 *
 * Destinée à un ordonnanceur externe — la tâche planifiée de Dokploy, décrite
 * dans `docs/PLAN_DEPLOIEMENT.md` :
 *
 *   curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" \
 *        https://<hôte>/api/v1/maintenance/purge-auth-log
 *
 * Protégée par un secret partagé plutôt que par une session : un ordonnanceur
 * n'a pas de compte utilisateur. Sans `CRON_SECRET` configuré, la route refuse
 * tout appel — une purge ouverte à tous permettrait d'effacer les traces
 * d'audit sur demande.
 */
export async function POST(req: Request) {
  try {
    const attendu = process.env.CRON_SECRET;
    if (!attendu) {
      console.error("[maintenance] CRON_SECRET n'est pas configuré.");
      return apiError("NOT_CONFIGURED", "Tâche de maintenance indisponible", 503);
    }

    const entete = req.headers.get("authorization") ?? "";
    const fourni = entete.startsWith("Bearer ") ? entete.slice(7) : "";
    if (!secretMatches(fourni, attendu)) {
      return apiError("UNAUTHORIZED", "Secret de maintenance invalide", 401);
    }

    const retentionDays = authLogRetentionDays();
    const supprimees = await purgeAuthLog(retentionDays);

    await logMaintenanceEvent({
      event: "authlog.purged",
      metadata: { supprimees, retentionDays },
    });

    return apiSuccess({ supprimees, retentionDays });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("[maintenance] échec de la purge", e);
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
