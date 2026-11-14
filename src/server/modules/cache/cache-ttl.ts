/**
 * Hard-coded TTL (seconds) per logical cache entry.
 *
 * When adding a new cached route/API: add a key here and use `getCacheTtlSeconds("yourKey")`.
 */
const cacheTtlDefaultsSeconds = {
  /** Single-row app settings; invalidated on admin update. */
  appSettings: 24 * 60 * 60,
  blogsFeatured: 24 * 60 * 60,
  /** `/blogs`, `/dashboard/blogs`, `GET /api/blogs` (includes `?tag=` and search) */
  blogsPublished: 24 * 60 * 60,
  /** `GET /api/blogs/top-tags` — top tag strings for published posts only */
  blogsTopTags: 24 * 60 * 60,
} as const;

type CacheTtlRoute = keyof typeof cacheTtlDefaultsSeconds;

export function getCacheTtlSeconds(route: CacheTtlRoute): number {
  return cacheTtlDefaultsSeconds[route];
}
