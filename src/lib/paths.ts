/**
 * Public paths configuration
 *
 * - exactPaths: Specific paths that are public (matched after normalization)
 * - prefixes:   Path prefixes that make all children public (must end with "/")
 *
 * NOTE: Prefer prefixes over exactPaths for route families (e.g. all /auth/* routes).
 * Only use exactPaths for standalone pages that don't have children.
 */
const routingPathConfig = {
  public: {
    exactPaths: ["/", "/contact", "/privacy", "/terms"],
    prefixes: [
      "/auth/",
      "/blogs/",
      "/help/",
      "/newsletter/",
      "/p/",
      "/api/public/",
    ],
  },
};

/**
 * Strips trailing slash from a pathname, except for root "/".
 */
const normalizePathname = (pathname: string): string => {
  if (pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
};

/**
 * Checks if a normalized pathname matches any of the exact paths.
 */
function hasExactPath(pathname: string, exactPaths: string[]): boolean {
  return exactPaths.some((p) => pathname === p);
}

/**
 * Checks if a pathname matches any prefix.
 * Handles both the prefix root ("/auth") and children ("/auth/login").
 * Prefixes must end with "/" in config.
 */
function hasPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix),
  );
}

export function isPublicPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return (
    hasExactPath(normalized, routingPathConfig.public.exactPaths) ||
    hasPrefix(normalized, routingPathConfig.public.prefixes)
  );
}
