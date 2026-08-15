import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    // L'app Expo est un projet autonome : sa propre toolchain, son propre
    // lockfile et son propre TypeScript. `tsconfig.json` l'exclut déjà.
    "mobile/**",
  ]),
  {
    // Les doubles de test manipulent des formes de données partielles et des
    // modules mockés dont le type exact n'a pas d'intérêt : `any` y est un
    // outil légitime, pas un relâchement du typage applicatif.
    files: ["tests/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
