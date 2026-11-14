import type { Options } from "@sentry/core";

import { nextPublicSentryDsnSchema } from "./zod-env";

function parseOptionalTracesSampleRate(
  raw: string | undefined,
): number | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1) return undefined;
  return n;
}

/**
 * Default production sample rate: 10%.
 * Override (0–1): `SENTRY_TRACES_SAMPLE_RATE` on server/edge, or `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` for client bundles.
 */
function resolveTracesSampleRate(enabled: boolean): number {
  if (!enabled) return 0;
  const override = parseOptionalTracesSampleRate(
    process.env.SENTRY_TRACES_SAMPLE_RATE ??
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  );
  if (override !== undefined) return override;
  return 0.1;
}

/**
 * Shared Sentry init options for client, Node server, and Edge (`@sentry/core` `Options`).
 * Sentry is strictly disabled in development mode (process.env.NODE_ENV !== "production"),
 * ensuring local errors and HMR events are never captured even if a DSN is present in .env.local.
 */
export function getSentryInitOptions(): Options {
  if (process.env.NODE_ENV !== "production") {
    return {
      enabled: false,
    };
  }

  const raw = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const dsnResult = nextPublicSentryDsnSchema.safeParse(raw);
  const dsn = dsnResult.success ? dsnResult.data : undefined;
  if (!dsnResult.success && typeof raw === "string" && raw.trim() !== "") {
    console.warn(
      "[Sentry] Invalid NEXT_PUBLIC_SENTRY_DSN — monitoring disabled.",
    );
  }
  const enabled = Boolean(dsn);

  return {
    dsn,
    enabled,
    environment: process.env.SENTRY_ENVIRONMENT ?? "production",
    sendDefaultPii: true,
    tracesSampleRate: resolveTracesSampleRate(enabled),
    enableLogs: true,
  };
}
