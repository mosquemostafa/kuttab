import { getCacheRedis } from "@/server/modules/cache/cache.client";

function truncateCacheKey(key: string): string {
  return key.length > 96 ? `${key.slice(0, 93)}...` : key;
}

function isCacheDebugEnabled(): boolean {
  if (process.env.CACHE_DEBUG === "0") {
    return false;
  }
  if (process.env.CACHE_DEBUG === "1") {
    return true;
  }
  return process.env.NODE_ENV === "development";
}

function cacheDebugLog(
  label: string,
  message: string,
  meta: { key: string; ttlSeconds?: number },
): void {
  console.debug(`[cache] ${message}`, {
    label,
    key: truncateCacheKey(meta.key),
    ...(meta.ttlSeconds !== undefined ? { ttlSeconds: meta.ttlSeconds } : {}),
  });
}

type CacheGetOrSetOptions = {
  /**
   * When set, logs whether the value came from Redis or the fetcher (e.g. Postgres).
   * Enabled in development, or when `CACHE_DEBUG=1` (disable with `CACHE_DEBUG=0`).
   */
  debugLabel?: string;
};

/** Join prefix and segments with `:`. Colons inside segments are escaped to avoid ambiguity. */
export function buildCacheKey(prefix: string, parts: string[]): string {
  const safe = parts.map((p) => String(p).replace(/:/g, "_"));
  return [prefix, ...safe].join(":");
}

/** `ttlSeconds`: pass `getCacheTtlSeconds("yourRoute")` from `cache-ttl.ts` for per-route config. */
export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  options?: CacheGetOrSetOptions,
): Promise<T> {
  const label = options?.debugLabel;
  const dbg = label && isCacheDebugEnabled() ? label : null;

  const redis = getCacheRedis();

  if (!redis) {
    if (dbg) {
      cacheDebugLog(
        dbg,
        "Redis unavailable — fetcher only (Postgres / app code)",
        { key },
      );
    }
    return fetcher();
  }

  try {
    const raw = await redis.get(key);
    const hasValue =
      raw != null && !(typeof raw === "string" && raw.length === 0);

    if (hasValue) {
      try {
        const parsed: T =
          typeof raw === "string" ? (JSON.parse(raw) as T) : (raw as T);
        if (dbg) {
          cacheDebugLog(dbg, "HIT — served from Redis (not Postgres)", {
            key,
          });
        }
        return parsed;
      } catch {
        if (dbg) {
          cacheDebugLog(
            dbg,
            "Redis entry not usable (invalid JSON or shape) — fetcher (Postgres); overwriting",
            { key },
          );
        }
        void redis.del(key).catch(() => {});
      }
    } else if (dbg) {
      cacheDebugLog(dbg, "MISS (cache empty) — fetcher (Postgres / app code)", {
        key,
      });
    }
  } catch {
    if (dbg) {
      cacheDebugLog(
        dbg,
        "Redis GET transport error — fetcher (Postgres / app code)",
        { key },
      );
    }
  }

  const fresh = await fetcher();

  try {
    await redis.set(key, JSON.stringify(fresh), { ex: ttlSeconds });
    if (dbg) {
      cacheDebugLog(dbg, "SET — stored in Redis", { key, ttlSeconds });
    }
  } catch {
    if (dbg) {
      cacheDebugLog(dbg, "SET failed — Redis write error", { key });
    }
  }

  return fresh;
}

function isScanComplete(cursor: string | number): boolean {
  return cursor === 0 || cursor === "0";
}

/** Deletes all keys whose names start with `prefix` (prefix is not globbed; `*` is appended). */
export async function invalidateByPrefix(prefix: string): Promise<void> {
  const redis = getCacheRedis();
  if (!redis) {
    return;
  }

  const match = `${prefix}*`;

  try {
    let cursor: string | number = 0;
    for (;;) {
      const scanResult = await redis.scan(cursor, {
        match,
        count: 100,
      });
      const nextCursor = scanResult[0] as string | number;
      const keys = scanResult[1] as string[];
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      if (isScanComplete(nextCursor)) {
        break;
      }
      cursor = nextCursor;
    }
  } catch {
    // ignore
  }
}
