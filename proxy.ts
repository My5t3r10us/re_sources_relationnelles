import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/tableau-de-bord", "/publier", "/profil"];
const adminRoutes = ["/admin"];
const authRoutes = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAdmin = adminRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  // Redirect logged-in users away from login/register
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/tableau-de-bord", request.url));
  }

  // Protect routes that require authentication
  if ((isProtected || isAdmin) && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/tableau-de-bord/:path*",
    "/publier/:path*",
    "/profil/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
