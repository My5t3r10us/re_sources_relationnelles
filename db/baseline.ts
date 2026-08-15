import "dotenv/config";
import { sql } from "drizzle-orm";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { db } from "./index";

/**
 * Marque une base existante comme « déjà migrée », sans rejouer le moindre DDL.
 *
 * Contexte : le schéma a longtemps été appliqué avec `drizzle-kit push`, qui ne
 * tient aucune comptabilité. La table `drizzle.__drizzle_migrations` n'existe
 * donc pas sur les bases créées ainsi, et le premier `db:migrate` tenterait de
 * rejouer la baseline depuis zéro — pour échouer immédiatement sur un
 * `CREATE TABLE "account"` qui existe déjà.
 *
 * Ce script écrit la comptabilité qui manque. Il est à lancer **une seule fois**
 * par base préexistante (production, développement local d'avant la bascule),
 * avant le premier déploiement embarquant `railpack.json`.
 *
 *   bun run db:baseline
 *
 * Sur une base vierge, ne rien lancer : `db:migrate` fait tout le travail.
 */

async function tableExists(name: string): Promise<boolean> {
  const result = await db.execute<{ exists: boolean }>(
    sql`SELECT to_regclass(${`public.${name}`}) IS NOT NULL AS exists`,
  );
  return result.rows[0]?.exists === true;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL est requis.");
  }

  // Garde-fou : sur une base vierge, insérer la comptabilité sans le DDL
  // laisserait une base vide que `db:migrate` croirait à jour — le pire des
  // deux mondes, et un incident difficile à diagnostiquer.
  if (!(await tableExists("user"))) {
    throw new Error(
      "La table `user` est absente : cette base est vierge. " +
        "Lancez `bun run db:migrate` (et non `db:baseline`), qui créera le schéma.",
    );
  }

  const migrations = readMigrationFiles({ migrationsFolder: "./migrations" });
  if (migrations.length === 0) {
    throw new Error("Aucune migration trouvée dans ./migrations.");
  }

  // Mêmes schéma, table et colonnes que ceux créés par `migrate()`
  // (drizzle-orm/pg-core/dialect.js) — toute divergence rendrait la
  // comptabilité invisible au migrateur.
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  const existing = await db.execute<{ count: string }>(
    sql`SELECT count(*)::text AS count FROM "drizzle"."__drizzle_migrations"`,
  );
  if (Number(existing.rows[0]?.count ?? 0) > 0) {
    console.log(
      "[baseline] `__drizzle_migrations` est déjà renseignée : rien à faire.",
    );
    return;
  }

  for (const migration of migrations) {
    await db.execute(
      sql`INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
          VALUES (${migration.hash}, ${migration.folderMillis})`,
    );
  }

  console.log(
    `[baseline] ${migrations.length} migration(s) marquée(s) comme appliquée(s). ` +
      "`bun run db:migrate` n'a désormais plus rien à rejouer.",
  );
}

main()
  .then(async () => {
    await db.$client.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("[baseline] échec :", error);
    await db.$client.end().catch(() => {});
    process.exit(1);
  });
