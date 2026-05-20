import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/api/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "mobile", "tests/e2e", ".next"],
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
    testTimeout: 20000,
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      exclude: [
        "node_modules/",
        "tests/",
        ".next/",
        "mobile/",
        "**/*.config.{ts,js,mjs}",
        "drizzle.config.ts",
        "proxy.ts",
        "next-env.d.ts",
        "db/seed.ts",
        "app/api/auth/**",
        "i18n/**",
      ],
    },
    environmentMatchGlobs: [
      ["tests/api/**", "node"],
      ["tests/unit/lib/**", "node"],
    ],
  },
});
