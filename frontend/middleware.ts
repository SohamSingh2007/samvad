import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes requiring authentication
const PROTECTED_ROUTES = ["/dashboard", "/admin", "/settings", "/meeting"];
const AUTH_ROUTES = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Retrieve Better Auth session token cookie
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const hasSession = Boolean(sessionToken && sessionToken.trim().length > 0);

  // 1. Block access to protected routes if no session cookie exists
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect logged-in users away from /login & /signup unless switching accounts, expired, or redirected
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);
  if (
    isAuthRoute &&
    hasSession &&
    !searchParams.has("expired") &&
    !searchParams.has("switch") &&
    !searchParams.has("redirect") &&
    !searchParams.has("signed_out")
  ) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  const response = NextResponse.next();

  // Prevent back-forward cache (bfcache) on protected routes after logout
  if (isProtectedRoute) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
    "/settings",
    "/settings/:path*",
    "/meeting",
    "/meeting/:path*",
    "/login",
    "/signup",
  ],
};
