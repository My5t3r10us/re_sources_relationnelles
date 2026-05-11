import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  const validLocale =
    locale && (routing.locales as readonly string[]).includes(locale)
      ? locale
      : routing.defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default,
  };
});
