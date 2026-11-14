import { env } from "@/server/lib/env";
import { NextRequest, NextResponse } from "next/server";

/**
 * Returns the exact list of allowed origins.
 * Guaranteed to never use wildcards (*) and restricts localhost strictly to development.
 */
export function getAllowedOrigins(): string[] {
  const origins = new Set<string>();

  if (env.NEXT_PUBLIC_APP_URL) {
    origins.add(env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""));
  }

  // Allow localhost only in development mode
  if (env.NODE_ENV === "development") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }

  // Allow specific Chrome Extension ID
  const extensionId =
    env.CHROME_EXTENSION_ID || process.env.CHROME_EXTENSION_ID;
  if (extensionId) {
    origins.add(`chrome-extension://${extensionId.trim()}`);
  }

  // Additional explicit origins (e.g. staging or mobile web domains)
  const additionalOrigins = env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS;
  if (additionalOrigins) {
    const list = additionalOrigins
      .split(",")
      .map((item) => item.trim().replace(/\/$/, ""))
      .filter(Boolean);
    for (const item of list) {
      origins.add(item);
    }
  }

  return Array.from(origins);
}

/**
 * Checks if the given origin is present in the allowed origins whitelist.
 */
function isOriginAllowed(origin: string | null | undefined): boolean {
  if (!origin) {
    return false;
  }
  const normalized = origin.trim().replace(/\/$/, "");
  return getAllowedOrigins().includes(normalized);
}

/**
 * Constructs standard CORS headers tailored to an allowed origin.
 */
function getCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With, Accept, Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400", // 24 hours preflight cache
    Vary: "Origin",
  };
}

/**
 * Handles CORS for API requests at the proxy/middleware level:
 * 1. Responds to preflight OPTIONS requests immediately (204 for allowed, 403 for untrusted).
 * 2. Appends CORS headers to standard API responses if the request originates from a whitelisted origin.
 * 3. Transparently passes non-browser requests (e.g. Flutter native, server webhooks) without interference.
 */
export function handleApiCors(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");

  // Preflight OPTIONS handling
  if (request.method === "OPTIONS") {
    if (!origin || !isOriginAllowed(origin)) {
      return new NextResponse(null, { status: 403 });
    }

    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }

  // Standard request handling
  const response = NextResponse.next();

  if (origin && isOriginAllowed(origin)) {
    const corsHeaders = getCorsHeaders(origin);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }
  }

  return response;
}
