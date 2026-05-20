import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const handleI18n = createMiddleware(routing);

const protectedRoutes = ["/tableau-de-bord", "/publier", "/profil"];
const adminRoutes = ["/admin"];
const authRoutes = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip locale prefix for route matching (localePrefix: "as-needed" means fr has no prefix)
  const segments = pathname.split("/");
  const firstSegment = segments[1];
  const hasLocalePrefix = (routing.locales as readonly string[]).includes(firstSegment);
  const pathnameWithoutLocale = hasLocalePrefix
    ? "/" + segments.slice(2).join("/") || "/"
    : pathname;

  const sessionToken =
    request.cookies.get("__Secure-better-auth.session_token")?.value ??
    request.cookies.get("better-auth.session_token")?.value;

  const isProtected = protectedRoutes.some((r) => pathnameWithoutLocale.startsWith(r));
  const isAdmin = adminRoutes.some((r) => pathnameWithoutLocale.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathnameWithoutLocale.startsWith(r));

  // Build locale-aware redirect prefix (fr is default, no prefix needed)
  const currentLocale = hasLocalePrefix ? firstSegment : routing.defaultLocale;
  const localePrefix = currentLocale !== routing.defaultLocale ? `/${currentLocale}` : "";

  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(
      new URL(`${localePrefix}/tableau-de-bord`, request.url)
    );
  }

  if ((isProtected || isAdmin) && !sessionToken) {
    const loginUrl = new URL(`${localePrefix}/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathnameWithoutLocale);
    return NextResponse.redirect(loginUrl);
  }

  return handleI18n(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
