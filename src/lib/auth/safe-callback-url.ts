/**
 * Validates a same-origin relative path for post-login redirects (open-redirect safe).
 */
export function sanitizeInternalCallbackPath(
  raw: string | null | undefined,
): string | null {
  if (raw == null || typeof raw !== "string") {
    return null;
  }

  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return null;
  }

  if (decoded.includes("://") || decoded.includes("\\")) {
    return null;
  }

  if (decoded.includes("@")) {
    return null;
  }

  if (decoded.length > 2048) {
    return null;
  }

  return decoded;
}
