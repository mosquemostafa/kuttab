import Redis, { RedisOptions } from "ioredis";

function parseRedisConfig(): { url: string; options: RedisOptions } {
  const url = process.env.REDIS_URL?.trim() || "redis://localhost:6379";
  const password = process.env.REDIS_PASSWORD?.trim();

  const options: RedisOptions = {
    enableReadyCheck: false,
    lazyConnect: true,
  };

  if (password && !url.includes("@")) {
    options.password = password;
  }

  return { url, options };
}

declare global {
  var __queueRedis: Redis | undefined;
}

/**
 * Producer connection: Fast-fail timeouts for web HTTP requests.
 * Cached on globalThis to prevent connection leaks during Next.js hot reloads.
 */
export function getQueueRedisConnection(): Redis {
  const { url, options } = parseRedisConfig();
  const queueOptions: RedisOptions = {
    ...options,
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
    commandTimeout: 3000,
  };

  if (!globalThis.__queueRedis) {
    globalThis.__queueRedis = new Redis(url, queueOptions);
  }

  return globalThis.__queueRedis;
}

/**
 * Worker connection: maxRetriesPerRequest MUST be null for BullMQ blocking commands.
 */
export function getWorkerRedisConnection(): Redis {
  const { url, options } = parseRedisConfig();
  return new Redis(url, {
    ...options,
    maxRetriesPerRequest: null,
  });
}
