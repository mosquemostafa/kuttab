import {
  ConflictException,
  NotFoundException,
} from "@/server/exceptions/exceptions";
import {
  featuredBlogsCacheKey,
  invalidatePublicBlogListCaches,
  publishedBlogTopTagsCacheKey,
  publishedBlogsCacheKey,
} from "@/server/modules/blogs/blog.cache";
import { blogRepository } from "@/server/modules/blogs/blog.repository";
import { getCacheTtlSeconds } from "@/server/modules/cache/cache-ttl";
import { cacheGetOrSet } from "@/server/modules/cache/cache.service";
import type {
  CreateBlogDTO,
  ListAdminBlogsQueryDTO,
  ListBlogsQueryDTO,
  UpdateBlogDTO,
} from "@/server/modules/blogs/blog.dto";
import type { BlogEntity } from "@/server/modules/blogs/blog.repository";
import type { PaginationMeta } from "@/shared/types/pagination.types";
import type { BlogDTO, BlogListItemDTO } from "@/shared/types/blog.types";

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const directCode = (error as { code?: unknown }).code;
  if (typeof directCode === "string") {
    return directCode;
  }

  const cause = (error as { cause?: unknown }).cause;
  if (!cause || typeof cause !== "object") {
    return undefined;
  }

  const causeCode = (cause as { code?: unknown }).code;
  return typeof causeCode === "string" ? causeCode : undefined;
}

function isSlugUniqueViolation(error: unknown): boolean {
  if (getErrorCode(error) === "23505") {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("blog_slug_unique_idx") ||
    error.message.includes("duplicate key")
  );
}

function toDTO(entity: BlogEntity): BlogDTO {
  return {
    id: entity.id,
    titleAr: entity.titleAr,
    titleEn: entity.titleEn,
    descriptionAr: entity.descriptionAr,
    descriptionEn: entity.descriptionEn,
    slug: entity.slug,
    contentAr: entity.contentAr,
    contentEn: entity.contentEn,
    coverImageUrl: entity.coverImageUrl,
    isFeatured: entity.isFeatured,
    excerptAr: entity.excerptAr,
    excerptEn: entity.excerptEn,
    readingMinutes: entity.readingMinutes,
    authorId: entity.authorId,
    tags: entity.tags,
    status: entity.status,
    publishDate: entity.publishDate ? entity.publishDate.toISOString() : null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

function toListDTO(entity: BlogEntity): BlogListItemDTO {
  const { contentAr: _c1, contentEn: _c2, ...rest } = toDTO(entity);
  return rest;
}

function isPubliclyVisiblePublishedBlog(entity: BlogEntity): boolean {
  if (entity.status !== "published") {
    return false;
  }

  const now = new Date();
  if (entity.publishDate != null && entity.publishDate > now) {
    return false;
  }

  return true;
}

function toMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/** Top tag strings on published posts (for `/blogs` topic discovery). */
const PUBLISHED_TOP_TAGS_LIMIT = 15;

/** Cache debug label: shows tag/search so tag-filtered lists are visible in logs. */
function blogListCacheDebugLabel(
  apiPath: "GET /api/blogs" | "GET /api/blogs/featured",
  query: ListBlogsQueryDTO,
): string {
  const parts: string[] = [];
  if (query.tag) {
    parts.push(`tag=${query.tag}`);
  }
  if (query.q) {
    parts.push("q=…");
  }
  return parts.length ? `${apiPath} · ${parts.join(" · ")}` : apiPath;
}

export const blogService = {
  async listPublished(
    query: ListBlogsQueryDTO,
    page: number,
    limit: number,
  ): Promise<{ items: BlogListItemDTO[]; meta: PaginationMeta }> {
    const key = publishedBlogsCacheKey(query, page, limit);

    return cacheGetOrSet(
      key,
      getCacheTtlSeconds("blogsPublished"),
      async () => {
        const { items, total } = await blogRepository.findPublishedMany(
          query,
          page,
          limit,
        );

        return {
          items: items.map(toListDTO),
          meta: toMeta(page, limit, total),
        };
      },
      {
        debugLabel: blogListCacheDebugLabel("GET /api/blogs", query),
      },
    );
  },

  async listFeaturedPublished(
    query: ListBlogsQueryDTO,
    page: number,
    limit: number,
  ): Promise<{ items: BlogListItemDTO[]; meta: PaginationMeta }> {
    const key = featuredBlogsCacheKey(query, page, limit);

    return cacheGetOrSet(
      key,
      getCacheTtlSeconds("blogsFeatured"),
      async () => {
        const { items, total } = await blogRepository.findFeaturedPublishedMany(
          query,
          page,
          limit,
        );

        return {
          items: items.map(toListDTO),
          meta: toMeta(page, limit, total),
        };
      },
      {
        debugLabel: blogListCacheDebugLabel("GET /api/blogs/featured", query),
      },
    );
  },

  async listPublishedSlugs(): Promise<
    Array<{ slug: string; updatedAt: string }>
  > {
    const items = await blogRepository.findPublishedSlugs();
    return items.map((item) => ({
      slug: item.slug,
      updatedAt: item.updatedAt.toISOString(),
    }));
  },

  async listPublishedTopTags(): Promise<string[]> {
    const key = publishedBlogTopTagsCacheKey();

    return cacheGetOrSet(
      key,
      getCacheTtlSeconds("blogsTopTags"),
      async () => blogRepository.findPublishedTopTags(PUBLISHED_TOP_TAGS_LIMIT),
      { debugLabel: "GET /api/blogs/top-tags" },
    );
  },

  async getPublishedBySlug(slug: string): Promise<BlogDTO> {
    const found = await blogRepository.findPublishedBySlug(slug);

    if (!found) {
      throw new NotFoundException("Blog", slug);
    }

    return toDTO(found);
  },

  /**
   * Up to 3 published posts that share tags with the given post, ranked by shared tag count.
   * Empty when the source has no tags or no overlapping published posts.
   */
  async listPublishedRelatedByBlogId(
    blogId: string,
  ): Promise<BlogListItemDTO[]> {
    const source = await blogRepository.findById(blogId);

    if (!source || !isPubliclyVisiblePublishedBlog(source)) {
      throw new NotFoundException("Blog", blogId);
    }

    if (source.tags.length === 0) {
      return [];
    }

    const items = await blogRepository.findPublishedRelatedBySharedTags(
      blogId,
      3,
    );

    return items.map(toListDTO);
  },

  async listAdmin(
    query: ListAdminBlogsQueryDTO,
    page: number,
    limit: number,
  ): Promise<{ items: BlogListItemDTO[]; meta: PaginationMeta }> {
    const { items, total } = await blogRepository.findAdminMany(
      query,
      page,
      limit,
    );

    return {
      items: items.map(toListDTO),
      meta: toMeta(page, limit, total),
    };
  },

  async getById(id: string): Promise<BlogDTO> {
    const found = await blogRepository.findById(id);

    if (!found) {
      throw new NotFoundException("Blog", id);
    }

    return toDTO(found);
  },

  async create(authorId: string, input: CreateBlogDTO): Promise<BlogDTO> {
    const slugExists = await blogRepository.existsBySlug(input.slug);

    if (slugExists) {
      throw new ConflictException("A blog with this slug already exists");
    }

    let created;

    try {
      created = await blogRepository.create(authorId, {
        ...input,
        isFeatured: input.isFeatured ?? false,
        tags: input.tags ?? [],
        status: input.status ?? "draft",
        publishDate:
          input.status === "published"
            ? (input.publishDate ?? new Date().toISOString())
            : input.publishDate,
      });
    } catch (error) {
      if (isSlugUniqueViolation(error)) {
        throw new ConflictException("A blog with this slug already exists");
      }

      throw error;
    }

    void invalidatePublicBlogListCaches();

    return toDTO(created);
  },

  async update(id: string, input: UpdateBlogDTO): Promise<BlogDTO> {
    if (input.slug) {
      const slugExists = await blogRepository.existsBySlug(input.slug, id);

      if (slugExists) {
        throw new ConflictException("A blog with this slug already exists");
      }
    }

    const nextInput: UpdateBlogDTO = {
      ...input,
      ...(input.status === "published" && input.publishDate === undefined
        ? { publishDate: new Date().toISOString() }
        : {}),
    };

    let updated;

    try {
      updated = await blogRepository.update(id, nextInput);
    } catch (error) {
      if (isSlugUniqueViolation(error)) {
        throw new ConflictException("A blog with this slug already exists");
      }

      throw error;
    }

    if (!updated) {
      throw new NotFoundException("Blog", id);
    }

    void invalidatePublicBlogListCaches();

    return toDTO(updated);
  },

  async delete(id: string): Promise<void> {
    const deleted = await blogRepository.delete(id);

    if (!deleted) {
      throw new NotFoundException("Blog", id);
    }

    void invalidatePublicBlogListCaches();
  },
};
