import { createHash } from "node:crypto";

import type { ListBlogsQueryDTO } from "@/server/modules/blogs/blog.dto";
import {
  buildCacheKey,
  invalidateByPrefix,
} from "@/server/modules/cache/cache.service";

const FEATURED_BLOGS_CACHE_PREFIX = "blogs:featured:v1";
const PUBLISHED_BLOGS_CACHE_PREFIX = "blogs:published:v1";
/** Single Redis key (no query hash): aggregated tag counts for published blogs. */
const PUBLISHED_BLOG_TOP_TAGS_CACHE_PREFIX = "blogs:published:top-tags:v1";

/**
 * One Redis key per distinct list: `q`, `tag`, `page`, `limit` are all hashed.
 * So `?tag=habits`, plain lists, and search each get their own entry (no extra work).
 */
function listQueryCacheKey(
  prefix: string,
  query: ListBlogsQueryDTO,
  page: number,
  limit: number,
): string {
  const payload = JSON.stringify({
    q: query.q ?? null,
    tag: query.tag ?? null,
    page,
    limit,
  });
  const hash = createHash("sha256").update(payload).digest("hex").slice(0, 32);
  return buildCacheKey(prefix, [hash]);
}

export function featuredBlogsCacheKey(
  query: ListBlogsQueryDTO,
  page: number,
  limit: number,
): string {
  return listQueryCacheKey(FEATURED_BLOGS_CACHE_PREFIX, query, page, limit);
}

export function publishedBlogsCacheKey(
  query: ListBlogsQueryDTO,
  page: number,
  limit: number,
): string {
  return listQueryCacheKey(PUBLISHED_BLOGS_CACHE_PREFIX, query, page, limit);
}

async function invalidateFeaturedBlogsCache(): Promise<void> {
  await invalidateByPrefix(`${FEATURED_BLOGS_CACHE_PREFIX}:`);
}

async function invalidatePublishedBlogsCache(): Promise<void> {
  await invalidateByPrefix(`${PUBLISHED_BLOGS_CACHE_PREFIX}:`);
}

export function publishedBlogTopTagsCacheKey(): string {
  return PUBLISHED_BLOG_TOP_TAGS_CACHE_PREFIX;
}

async function invalidatePublishedBlogTopTagsCache(): Promise<void> {
  await invalidateByPrefix(PUBLISHED_BLOG_TOP_TAGS_CACHE_PREFIX);
}

/** Clears Redis for featured + main published blog lists (e.g. after any admin write). */
export async function invalidatePublicBlogListCaches(): Promise<void> {
  await Promise.all([
    invalidateFeaturedBlogsCache(),
    invalidatePublishedBlogsCache(),
    invalidatePublishedBlogTopTagsCache(),
  ]);
}
