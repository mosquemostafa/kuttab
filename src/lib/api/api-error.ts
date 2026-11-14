/**
 * Thrown by `apiClient` when the API returns `success: false`.
 * Carries optional validation `details` for UI and logging.
 */
class ApiClientError extends Error {
  readonly code: string;
  readonly details: unknown;

  constructor(opts: { message: string; code: string; details?: unknown }) {
    super(opts.message);
    this.name = "ApiClientError";
    this.code = opts.code;
    this.details = opts.details;
  }
}

const VALIDATION_ERROR_CODE = "VALIDATION_ERROR";

/**
 * Flattens API validation `details` into a single readable message for toasts.
 * Supports `{ field: string[] }` (app ValidationException) and Zod-style flatten output.
 */
export function formatValidationDetailsMessage(
  details: unknown,
  fallbackMessage: string,
): string {
  if (
    details == null ||
    typeof details !== "object" ||
    Array.isArray(details)
  ) {
    return fallbackMessage;
  }

  const lines: string[] = [];
  for (const [, value] of Object.entries(details as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      for (const msg of value) {
        if (typeof msg === "string" && msg.trim()) {
          lines.push(msg.trim());
        }
      }
    } else if (typeof value === "string" && value.trim()) {
      lines.push(value.trim());
    }
  }

  if (lines.length === 0) {
    return fallbackMessage;
  }

  const seen = new Set<string>();
  const unique = lines.filter((line) =>
    seen.has(line) ? false : (seen.add(line), true),
  );

  return unique.join(" • ");
}

/** First message per field for inline form errors. */
export function validationDetailsToFieldErrors(
  details: unknown,
): Record<string, string> {
  if (
    details == null ||
    typeof details !== "object" ||
    Array.isArray(details)
  ) {
    return {};
  }

  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(
    details as Record<string, unknown>,
  )) {
    if (Array.isArray(value)) {
      const first = value.find((m) => typeof m === "string" && m.trim());
      if (first) out[key] = String(first).trim();
    } else if (typeof value === "string" && value.trim()) {
      out[key] = value.trim();
    }
  }
  return out;
}

export function isApiClientError(e: unknown): e is ApiClientError {
  return e instanceof ApiClientError;
}

export function failedApiResponseToError(error: {
  code: string;
  message: string;
  details?: unknown;
}): ApiClientError {
  const base = error.message?.trim() || "Request failed";
  const message =
    error.code === VALIDATION_ERROR_CODE && error.details != null
      ? formatValidationDetailsMessage(error.details, base)
      : base;
  return new ApiClientError({
    message,
    code: error.code,
    details: error.details,
  });
}
