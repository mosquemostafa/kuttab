import {
  deleteBetterAuthCookiesFromResponse,
  sanitizeInternalRedirectPath,
} from "@/server/lib/clear-stale-better-auth-session";
import { NextRequest, NextResponse } from "next/server";

/**
 * Clears Better Auth cookies when they are stale (browser still has them but `getSession` failed).
 * Must run in a Route Handler — Server Components cannot mutate `cookies()`.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("redirect");
  const target = raw ? sanitizeInternalRedirectPath(raw) : "/";

  const url = new URL(target, request.nextUrl.origin);
  const response = NextResponse.redirect(url);
  deleteBetterAuthCookiesFromResponse(request, response);
  return response;
}
