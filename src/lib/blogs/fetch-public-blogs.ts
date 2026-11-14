import "server-only";

import { blogService } from "@/server/modules/blogs/blog.service";
import { NotFoundException } from "@/server/exceptions/exceptions";
import type { BlogDTO, BlogListItemDTO } from "@/shared/types/blog.types";
import type { PaginationMeta } from "@/shared/types/pagination.types";

/** Page size for `/blogs` and `/dashboard/blogs` list views (server-rendered). */
const PUBLIC_BLOG_LIST_PAGE_SIZE = 24;

export function parseBlogListPageParam(
  raw: string | string[] | undefined,
): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(s ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Up to 15 most-used tags on visible published posts; empty on failure. */
export async function fetchPublishedBlogTopTags(): Promise<string[]> {
  try {
    return await blogService.listPublishedTopTags();
  } catch {
    return [];
  }
}

export async function fetchPublishedBlogList(
  tag: string | undefined,
  page: number,
): Promise<{
  items: BlogListItemDTO[];
  meta: PaginationMeta;
  loadFailed: boolean;
}> {
  const emptyMeta: PaginationMeta = {
    page: 1,
    limit: PUBLIC_BLOG_LIST_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  };

  try {
    const result = await blogService.listPublished(
      tag ? { tag } : {},
      page,
      PUBLIC_BLOG_LIST_PAGE_SIZE,
    );

    return { items: result.items, meta: result.meta, loadFailed: false };
  } catch {
    return { items: [], meta: emptyMeta, loadFailed: true };
  }
}

export async function fetchPublishedBlogBySlug(
  slug: string,
): Promise<BlogDTO | null> {
  try {
    return await blogService.getPublishedBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundException) {
      return null;
    }
    return null;
  }
}

/** Tag-based related posts (max 3); empty on failure or no overlaps. */
export async function fetchPublishedRelatedBlogs(
  blogId: string,
): Promise<BlogListItemDTO[]> {
  try {
    return await blogService.listPublishedRelatedByBlogId(blogId);
  } catch {
    return [];
  }
}
