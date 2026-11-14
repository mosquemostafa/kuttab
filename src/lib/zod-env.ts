import { z } from "zod";

export const trimEmptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/** Sentry client DSN. Omit or empty to disable (`@sentry/nextjs`). */
export const nextPublicSentryDsnSchema = z.preprocess(
  trimEmptyToUndefined,
  z.string().url("Must be a valid URL when set").optional(),
);
