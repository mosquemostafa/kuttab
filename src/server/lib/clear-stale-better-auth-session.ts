import { redirect } from "next/navigation";
import { getCookies, getSessionCookie } from "better-auth/cookies";
import { auth } from "@/server/lib/auth";

type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * Only path-style redirects (same origin). Prevents open redirects via `//evil.com`.
 */
export function sanitizeInternalRedirectPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }
  return trimmed;
}

import type { NextRequest, NextResponse } from "next/server";

export function deleteBetterAuthCookiesFromResponse(
  request: NextRequest,
  response: NextResponse,
): void {
  const defs = getCookies(auth.options);
  const bases = [
    defs.sessionToken.name,
    defs.sessionData.name,
    defs.dontRememberToken.name,
    defs.accountData.name,
  ];

  for (const { name } of request.cookies.getAll()) {
    if (
      bases.includes(name) ||
      bases.some((base) => name.startsWith(`${base}.`))
    ) {
      response.cookies.delete(name);
    }
  }
}

/**
 * Delete Better Auth cookies. Call only from a **Route Handler** or **Server Action**
 * (`cookies()` is not writable in Server Components).
 */

export function hasStaleSessionCookie(
  headersList: Headers,
  session: SessionResult,
): boolean {
  return !session && Boolean(getSessionCookie(headersList));
}

/**
 * Redirects through `/api/auth/clear-stale-session` so cookies are cleared in a Route Handler,
 * then the browser loads `redirectPath` without stale auth cookies.
 */
export function redirectThroughStaleSessionClear(redirectPath: string): never {
  const safe = sanitizeInternalRedirectPath(redirectPath);
  redirect(
    `/api/auth/clear-stale-session?redirect=${encodeURIComponent(safe)}`,
  );
}
