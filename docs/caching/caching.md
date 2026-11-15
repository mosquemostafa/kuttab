# Server-side caching (Upstash Redis)

This document describes the **Redis-backed cache** used in the backend. It is **HTTP/REST–based** ([Upstash](https://upstash.com/)), works well with serverless and Node runtimes, and is **optional**: if credentials are missing, the app still runs and reads from Postgres as usual.

## What is cached today

| Area         | Service method          | Key / Route   | Notes                                                        |
| ------------ | ----------------------- | ------------- | ------------------------------------------------------------ |
| App Settings | `appSettingsService.get` | `appSettings` | Cached for fast read access; invalidated on updates via admin |

## Environment and configuration

Validated in [`src/server/lib/env.ts`](../../src/server/lib/env.ts):

| Variable                   | Required? | Purpose               |
| -------------------------- | --------- | --------------------- |
| `UPSTASH_REDIS_REST_URL`   | Optional  | Upstash REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Optional  | Upstash token         |

Rules:

- **Both set or both omitted.** If only one is set, env validation fails.
- If **either is missing**, [`getCacheRedis()`](../../src/server/modules/cache/cache.client.ts) returns `null` and all cache operations **degrade to uncached behavior** (no thrown errors from the cache layer for “Redis down” at init).

**Production / CI:** Enter the URL and token **without** surrounding quotes in the dashboard (value should be `https://….upstash.io`, not `"https://….upstash.io"`). The env loader also strips one pair of outer quotes if they were pasted by mistake. Enable these variables for **Production** (and **Preview** if needed); if they are set for **Runtime only** and omitted at **build** time, leaving both unset for the build is fine—they are optional—but a **non-empty invalid** value (typo, stray characters) will still fail validation.

TTL values are **hard-coded** in [`src/server/modules/cache/cache-ttl.ts`](../../src/server/modules/cache/cache-ttl.ts). They are **not** read from environment variables.

- **`cacheTtlDefaultsSeconds`**: named logical routes (`appSettings`) → seconds.

## Source map

| File                                                                                     | Role                                              |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| [`src/server/modules/cache/cache.client.ts`](../../src/server/modules/cache/cache.client.ts) | Upstash Redis client instantiation                |
| [`src/server/modules/cache/cache-ttl.ts`](../../src/server/modules/cache/cache-ttl.ts)       | Central TTL definitions (seconds)                 |
| [`src/server/modules/cache/cache.service.ts`](../../src/server/modules/cache/cache.service.ts) | Generic `getCachedJson`, `setCachedJson`, `deleteCacheKey` |
