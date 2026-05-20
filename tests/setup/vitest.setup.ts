import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.test if present so users can just `cp .env.test.example .env.test`.
// Variables already in process.env (set by the shell or CI) take precedence.
const envTestPath = resolve(process.cwd(), ".env.test");
if (existsSync(envTestPath)) {
  for (const rawLine of readFileSync(envTestPath, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID ?? "test";
process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY ?? "test";
process.env.AWS_BUCKET = process.env.AWS_BUCKET ?? "resources-test";
process.env.AWS_PUBLIC_URL = process.env.AWS_PUBLIC_URL ?? "https://test.example.com";
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ?? "test-secret-do-not-use-in-production-please";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: async () => "fr",
  getMessages: async () => ({}),
  setRequestLocale: () => {},
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// jsdom does not implement scrollIntoView
if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

afterEach(() => {
  cleanup();
});
