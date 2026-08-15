import "dotenv/config";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";

/**
 * Applique les migrations Drizzle. Exécuté au démarrage du conteneur, avant
 * `next start` (voir `railpack.json`).
 *
 * On passe par `migrate()` de `drizzle-orm` plutôt que par `drizzle-kit migrate`
 * parce que `drizzle-kit` est une devDependency : rien ne garantit qu'elle soit
 * encore présente dans l'image après le build. `drizzle-orm` est une dépendance
 * de production, donc toujours disponible à l'exécution.
 */

/**
 * Identifiant du verrou consultatif PostgreSQL.
 *
 * `migrate()` ne prend aucun verrou : si Dokploy démarre plusieurs répliques
 * simultanément, chacune lit un `__drizzle_migrations` encore vide et tente
 * d'appliquer le même DDL. La seconde échoue sur un « already exists » et le
 * conteneur ne démarre pas. Le verrou sérialise les démarrages ; les répliques
 * qui arrivent ensuite constatent que tout est déjà appliqué et passent.
 *
 * Valeur arbitraire mais stable — elle doit seulement être la même pour toutes
 * les instances de cette application.
 */
const MIGRATION_LOCK_ID = 4_120_250_815;

export async function runMigrations(): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(${MIGRATION_LOCK_ID})`);
  try {
    await migrate(db, { migrationsFolder: "./migrations" });
  } finally {
    // `finally` et non après le `migrate` : un échec de migration doit relâcher
    // le verrou, sinon les redémarrages suivants se bloquent indéfiniment.
    await db.execute(sql`SELECT pg_advisory_unlock(${MIGRATION_LOCK_ID})`);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL est requis pour appliquer les migrations. " +
        "En déploiement, la variable est fournie par Dokploy.",
    );
  }

  const startedAt = Date.now();
  console.log("[migrate] application des migrations…");
  await runMigrations();
  console.log(`[migrate] terminé en ${Date.now() - startedAt} ms.`);
}

main()
  .then(async () => {
    await db.$client.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("[migrate] échec :", error);
    // Sortie non nulle : le `&&` du startCommand interrompt le démarrage plutôt
    // que de lancer l'application sur un schéma incohérent.
    await db.$client.end().catch(() => {});
    process.exit(1);
  });
