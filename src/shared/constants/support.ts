/** Stale thresholds for support desk analytics (must match SQL interval derived from this value). */
export const STALE_DAYS = 7 as const;

/**
 * Number of **calendar days** in the support overview daily time series (inclusive of today).
 * The SQL window for per-day aggregates uses `SUPPORT_OVERVIEW_SERIES_DAYS - 1` elapsed days from
 * `now()` so the oldest bucket aligns with `eachDayOfInterval` + `subDays(end, DAYS - 1)`.
 */
export const SUPPORT_OVERVIEW_SERIES_DAYS = 30 as const;
