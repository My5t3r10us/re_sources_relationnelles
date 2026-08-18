import { sql } from "drizzle-orm";
import { db } from "@/db";
import { apiSuccess, apiError } from "@/lib/api-response";
import { captureError } from "@/lib/telemetry";
import pkg from "@/package.json";

/**
 * Sonde de santé applicative.
 *
 * Sert trois usages décrits dans `docs/PLAN_DEPLOIEMENT.md` :
 * l'attente de disponibilité après un déploiement Dokploy, la supervision
 * externe, et la vérification qu'un rollback a bien remis la version attendue
 * en ligne (d'où l'exposition de `version`).
 *
 * La route est délibérément non authentifiée : une sonde qui exige un secret
 * ne peut pas être appelée par un orchestrateur. Elle ne divulgue donc que la
 * version applicative et l'état de la base — jamais l'URL de connexion ni le
 * détail d'une erreur SQL.
 *
 * `proxy.ts` exclut `/api` de son matcher : aucune redirection i18n ni contrôle
 * de session ne s'applique ici.
 */
export async function GET() {
  const startedAt = Date.now();

  try {
    await db.execute(sql`SELECT 1`);
  } catch (err) {
    // Le message d'erreur brut de `pg` contient l'hôte et l'utilisateur de la
    // base : on le journalise côté serveur, on ne le renvoie pas.
    captureError(err, { source: "health", path: "/api/health" });
    return apiError(
      "UNHEALTHY",
      "Base de données injoignable",
      503,
    );
  }

  return apiSuccess({
    status: "ok",
    version: pkg.version,
    uptime: Math.round(process.uptime()),
    database: { status: "ok", latencyMs: Date.now() - startedAt },
  });
}
