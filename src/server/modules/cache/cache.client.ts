import { Redis } from "@upstash/redis";

import { env } from "@/server/lib/env";

let instance: Redis | null | undefined;

/**
 * Lazy Upstash REST client. Returns `null` when credentials are missing or invalid
 * so the app runs without Redis (cache becomes a pass-through).
 *
 * Uses validated `env`: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
 */
export function getCacheRedis(): Redis | null {
  if (instance !== undefined) {
    return instance;
  }

  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    instance = null;
    return null;
  }

  try {
    instance = new Redis({ url, token });
  } catch {
    instance = null;
  }

  return instance;
}
