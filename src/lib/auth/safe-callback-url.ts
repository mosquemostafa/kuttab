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

/**
 * Maps a public blog post path to the dashboard reader URL where interactive comments load.
 * Returns a **locale-free** path (`/dashboard/blogs/slug`) for use with next-intl `router.push` / `Link`.
 * Supports pathname without locale (`/blogs/slug`) and with locale (`/ar/blogs/slug`).
 */
export function dashboardBlogCommentsPathFromBlogReaderPath(
  pathname: string,
): string | null {
  const trimmed = pathname.replace(/\/$/, "") || "/";

  const withLocale = trimmed.match(/^\/([^/]+)\/blogs\/([^/]+)$/);
  if (withLocale) {
    const slug = withLocale[2];
    return `/dashboard/blogs/${slug}`;
  }

  const noLocale = trimmed.match(/^\/blogs\/([^/]+)$/);
  if (noLocale) {
    return `/dashboard/blogs/${noLocale[1]}`;
  }

  return null;
}
