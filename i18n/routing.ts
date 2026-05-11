import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en", "de", "es", "it", "nl", "pt", "pl"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
