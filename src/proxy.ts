import { isPublicPath } from "@/lib/paths";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/config";
import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { LOCALE_COOKIE_NAME, routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { NextRequest, NextResponse } from "next/server";
import { handleApiCors } from "@/server/lib/cors";

const handleI18nRouting = createMiddleware(routing);

function hasAccept(request: NextRequest, mime: string): boolean {
  const accept = request.headers.get("accept") ?? "";
  return accept.toLowerCase().includes(mime);
}

function hasFileExtension(pathname: string): boolean {
  // e.g. /robots.txt, /sitemap.xml, /foo/bar.png
  return /\.[a-z0-9]+$/i.test(pathname);
}

function appendGeoLinkHeaders(response: NextResponse, request: NextRequest) {
  // Use env var to avoid 0.0.0.0:3000 if proxy doesn't forward host headers correctly
  const origin = (
    process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  ).replace(/\/$/, "");
  const links = [
    `<${origin}/llms.txt>; rel="describedby"`,
    `<${origin}/sitemap.xml>; rel="sitemap"`,
  ].join(", ");
  response.headers.append("Link", links);
}

/**
 * Attaches standard web security headers and GEO link headers to HTML responses.
 */
function finalizeResponse(
  response: NextResponse,
  request: NextRequest,
): NextResponse {
  if (hasAccept(request, "text/html")) {
    appendGeoLinkHeaders(response, request);
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }
  return response;
}

function getLocaleFromPathname(pathname: string): string {
  const maybeLocale = pathname.split("/").filter(Boolean)[0];
  return hasLocale(routing.locales, maybeLocale)
    ? maybeLocale
    : routing.defaultLocale;
}

function getLocaleFromCookie(request: NextRequest): string | null {
  const locale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  return hasLocale(routing.locales, locale) ? locale : null;
}

function resolveRequestLocale(
  request: NextRequest,
  pathname: string,
  hasLocalePrefix: boolean,
): string {
  const localeFromPathname = getLocaleFromPathname(pathname);

  // For locale-less paths like "/" or "/auth/login", honor the persisted locale cookie first.
  if (!hasLocalePrefix) {
    return getLocaleFromCookie(request) ?? localeFromPathname;
  }

  return localeFromPathname;
}

function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return "/";
  const maybeLocale = segments[0];
  if (hasLocale(routing.locales, maybeLocale)) {
    const rest = segments.slice(1);
    return rest.length ? `/${rest.join("/")}` : "/";
  }
  return pathname;
}

function buildLocalizedPathname(pathname: string, locale: string): string {
  if (pathname === "/") return `/${locale}`;
  return `/${locale}${pathname}`;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept API routes immediately for CORS and preflight handling
  if (pathname.startsWith("/api/")) {
    return handleApiCors(request);
  }

  const hasLocalePrefix = hasLocale(
    routing.locales,
    pathname.split("/").filter(Boolean)[0],
  );
  const locale = resolveRequestLocale(request, pathname, hasLocalePrefix);
  const internalPath = stripLocalePrefix(pathname);

  // GEO — Markdown negotiation
  // If a client requests Markdown, serve a Markdown representation of the same page
  // by rewriting to `/${locale}/md...` while keeping the URL stable.
  if (
    hasAccept(request, "text/markdown") &&
    hasLocalePrefix &&
    !pathname.includes("/md") &&
    !hasFileExtension(pathname) &&
    isPublicPath(internalPath)
  ) {
    const url = request.nextUrl.clone();
    url.pathname =
      internalPath === "/" ? `/${locale}/md` : `/${locale}/md${internalPath}`;
    return NextResponse.rewrite(url);
  }

  const sessionCookie = getSessionCookie(request);

  // 1. Main page ("/" or "/{locale}"): Single-hop redirect straight to dashboard (if auth) or login (if not auth)
  if (internalPath === "/") {
    const destination = sessionCookie
      ? `/${locale}${DEFAULT_LOGIN_REDIRECT}${request.nextUrl.search}`
      : `/${locale}/auth/login${request.nextUrl.search}`;
    const targetUrl = new URL(destination, request.url);
    return finalizeResponse(NextResponse.redirect(targetUrl), request);
  }

  // 2. Locale-less paths: Redirect to localized path (preserving query parameters)
  if (!hasLocalePrefix) {
    const localizedPathname = `${buildLocalizedPathname(pathname, locale)}${request.nextUrl.search}`;
    return finalizeResponse(
      NextResponse.redirect(new URL(localizedPathname, request.url)),
      request,
    );
  }

  // 3. Public paths: Allow access without authentication (includes /contact, /privacy, etc.)
  if (isPublicPath(internalPath)) {
    return finalizeResponse(handleI18nRouting(request), request);
  }

  // 4. Protected paths: Redirect unauthenticated users to login while preserving deep link
  if (!sessionCookie) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    const destination = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("callbackUrl", destination);
    return finalizeResponse(NextResponse.redirect(loginUrl), request);
  }

  // 5. Authenticated access for non-public paths
  return finalizeResponse(handleI18nRouting(request), request);
}

// Match page routes except static assets, plus all API routes for CORS handling.
export const config = {
  matcher: [
    "/((?!_next|api|trpc|sentry-example-page)(?!.*\\.\\w+$).*)",
    "/",
    "/api/:path*",
  ],
};
