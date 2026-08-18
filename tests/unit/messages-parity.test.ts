import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { routing } from "@/i18n/routing";

/**
 * Une clé oubliée dans une seule langue ne casse pas la compilation : elle
 * s'affiche telle quelle au citoyen, en production. Cette parité est donc
 * vérifiée par un test plutôt que par la relecture.
 */

type Messages = Record<string, Record<string, unknown>>;

function load(locale: string): Messages {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), "messages", `${locale}.json`), "utf8"),
  ) as Messages;
}

/** Aplatit l'arborescence en chemins pointés, pour comparer des ensembles plats. */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

const reference = load(routing.defaultLocale);
const referenceKeys = keyPaths(reference).sort();
const otherLocales = routing.locales.filter((l) => l !== routing.defaultLocale);

describe("messages", () => {
  it.each(otherLocales)("%s has the same keys as the default locale", (locale) => {
    expect(keyPaths(load(locale)).sort()).toEqual(referenceKeys);
  });

  it.each(routing.locales)("%s exposes the Feedback namespace", (locale) => {
    const feedback = load(locale).Feedback;
    expect(feedback).toBeDefined();
    expect(Object.keys(feedback).sort()).toEqual(
      [
        "cancel",
        "closeLabel",
        "description",
        "descriptionPlaceholder",
        "error",
        "heading",
        "privacyNotice",
        "submit",
        "success",
        "title",
        "titlePlaceholder",
        "trigger",
        "typeBug",
        "typeFeature",
        "viewBoard",
        "viewPost",
      ].sort(),
    );
  });
});
