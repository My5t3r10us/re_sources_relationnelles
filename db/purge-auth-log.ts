import "dotenv/config";
import { db } from "./index";
import { authLogRetentionDays, purgeAuthLog } from "../lib/rgpd";

/**
 * Purge de rétention du journal, en ligne de commande.
 *
 * Même traitement que `POST /api/v1/maintenance/purge-auth-log`, pour les
 * environnements où l'ordonnanceur exécute une commande dans le conteneur
 * plutôt qu'un appel HTTP, et pour une exécution manuelle d'exploitation.
 *
 *   bun run db:purge
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL est requis.");
  }

  const retentionDays = authLogRetentionDays();
  const supprimees = await purgeAuthLog(retentionDays);
  console.log(
    `[purge] ${supprimees} entrée(s) de journal supprimée(s) ` +
      `(rétention : ${retentionDays} jours).`,
  );
}

main()
  .then(async () => {
    await db.$client.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("[purge] échec :", error);
    await db.$client.end().catch(() => {});
    process.exit(1);
  });
