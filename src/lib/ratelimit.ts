import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

/** Matches @upstash/ratelimit `limit` return shape for headers and branching. */
type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending: Promise<unknown>;
};

const noopLimit = async (): Promise<RateLimitResult> => ({
  success: true,
  limit: 0,
  remaining: 999,
  reset: Date.now() + 60_000,
  pending: Promise.resolve(),
});

type Limiter = { limit: (identifier: string) => Promise<RateLimitResult> };

function asLimiter(r: Ratelimit): Limiter {
  return { limit: (id) => r.limit(id) };
}

function noopLimiter(): Limiter {
  return { limit: noopLimit };
}

let redisSingleton: Redis | null | undefined;

function getRateLimitRedis(): Redis | null {
  if (redisSingleton !== undefined) {
    return redisSingleton;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    redisSingleton = null;
    return null;
  }
  try {
    redisSingleton = new Redis({ url, token });
  } catch {
    redisSingleton = null;
  }
  return redisSingleton;
}

function buildLimiters(redis: Redis | null): {
  login: Limiter;
  forgotPassword: Limiter;
  subscribe: Limiter;
  signUp: Limiter;
  contactForm: Limiter;
} {
  if (!redis) {
    return {
      login: noopLimiter(),
      forgotPassword: noopLimiter(),
      subscribe: noopLimiter(),
      signUp: noopLimiter(),
      contactForm: noopLimiter(),
    };
  }

  // Balanced windows: tight enough to deter abuse, long enough for normal retries (login ~1m; others ~5m).
  return {
    login: asLimiter(
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "2 m"),
        prefix: "rl:login",
        analytics: true,
      }),
    ),
    forgotPassword: asLimiter(
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "5 m"),
        prefix: "rl:forgot-password",
      }),
    ),
    subscribe: asLimiter(
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(2, "5 m"),
        prefix: "rl:subscribe",
      }),
    ),
    signUp: asLimiter(
      new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(5, "5 m"),
        prefix: "rl:sign-up",
      }),
    ),
    contactForm: asLimiter(
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "10 m"),
        prefix: "rl:contact-form",
      }),
    ),
  };
}

let limitersCache: ReturnType<typeof buildLimiters> | undefined;

export function getRateLimiters(): ReturnType<typeof buildLimiters> {
  if (!limitersCache) {
    limitersCache = buildLimiters(getRateLimitRedis());
  }
  return limitersCache;
}

/** Stable object for `rateLimiters.login.limit(...)` call sites. */
export const rateLimiters = {
  get login() {
    return getRateLimiters().login;
  },
  get forgotPassword() {
    return getRateLimiters().forgotPassword;
  },
  get subscribe() {
    return getRateLimiters().subscribe;
  },
  get signUp() {
    return getRateLimiters().signUp;
  },
  get contactForm() {
    return getRateLimiters().contactForm;
  },
};

export function getClientIpFromRequest(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  const first = xff?.split(",")[0]?.trim();
  if (first) {
    return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }
  return "anonymous";
}

export function getClientIpFromHeaders(requestHeaders: Headers): string {
  const xff = requestHeaders.get("x-forwarded-for");
  const first = xff?.split(",")[0]?.trim();
  if (first) {
    return first;
  }
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }
  return "anonymous";
}

export async function flushRateLimitPending(result: RateLimitResult) {
  await result.pending;
}

/** Seconds until the window allows another attempt (`reset` is ms from `@upstash/ratelimit`). */
/** Computes localized wait units/count for auth server actions. */
