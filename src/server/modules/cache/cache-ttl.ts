/**
 * Hard-coded TTL (seconds) per logical cache entry.
 *
 * When adding a new cached route/API: add a key here and use `getCacheTtlSeconds("yourKey")`.
 */
const cacheTtlDefaultsSeconds = {
  /** Single-row app settings; invalidated on admin update; 60s TTL ensures fast self-healing. */
  appSettings: 60,
} as const;

type CacheTtlRoute = keyof typeof cacheTtlDefaultsSeconds;

export function getCacheTtlSeconds(route: CacheTtlRoute): number {
  return cacheTtlDefaultsSeconds[route];
}
