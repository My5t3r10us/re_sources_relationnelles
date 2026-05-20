import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

// Charge .env.test quand NODE_ENV=test (utilisé par `db:test:push`),
// sinon .env classique. Les variables déjà exportées par le shell gardent la priorité.
const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
loadEnv({ path: envFile });

// En mode test, on autorise un fallback explicite vers DATABASE_URL_TEST
// pour le cas où l'utilisateur n'a défini que cette variable-là.
const url =
  process.env.NODE_ENV === "test"
    ? process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL
    : process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    `[drizzle.config] DATABASE_URL${
      process.env.NODE_ENV === "test" ? "_TEST" : ""
    } est requis (fichier ${envFile} introuvable ou variable manquante).`,
  );
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url },
});
