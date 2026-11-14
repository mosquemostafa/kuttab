import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, ilike, lte, ne, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/server/db";
import { blog } from "@/server/modules/blogs/blog.entity";
import type {
  CreateBlogDTO,
  ListAdminBlogsQueryDTO,
  ListBlogsQueryDTO,
  UpdateBlogDTO,
} from "@/server/modules/blogs/blog.dto";

type BlogEntity = typeof blog.$inferSelect;

type PublishedFilters = Pick<ListBlogsQueryDTO, "q" | "tag">;

type AdminFilters = Pick<
  ListAdminBlogsQueryDTO,
  "q" | "tag" | "status" | "authorId" | "slug"
>;

function withTextQuery(clauses: SQL[], query?: string) {
  if (!query) {
    return;
  }

  const normalizedQuery = `%${query}%`;

  clauses.push(
    or(
      ilike(blog.titleAr, normalizedQuery),
      ilike(blog.titleEn, normalizedQuery),
      ilike(blog.descriptionAr, normalizedQuery),
      ilike(blog.descriptionEn, normalizedQuery),
      ilike(blog.excerptAr, normalizedQuery),
      ilike(blog.excerptEn, normalizedQuery),
    ) as SQL,
  );
}

function withTagFilter(clauses: SQL[], tag?: string) {
  if (!tag) {
    return;
  }

  clauses.push(sql`${tag} = ANY(${blog.tags})`);
}

/** Case-insensitive substring match against any stored tag (admin list only). */
function withAdminTagFilterPartial(clauses: SQL[], tag?: string) {
  if (!tag) {
    return;
  }

  clauses.push(
    sql`exists (
      select 1
      from unnest(${blog.tags}) as blog_tag(val)
      where strpos(lower(blog_tag.val), lower(${tag})) > 0
    )`,
  );
}

function toPublishedWhereClause(filters: PublishedFilters): SQL {
  const now = new Date();
  const clauses: SQL[] = [
    eq(blog.status, "published"),
    or(sql`${blog.publishDate} IS NULL`, lte(blog.publishDate, now)) as SQL,
  ];

  withTextQuery(clauses, filters.q);
  withTagFilter(clauses, filters.tag);

  return and(...clauses) as SQL;
}

/** Newest first: real publish date, or `createdAt` when publish date is unset. */
const orderByNewestPublishFirst = [
  desc(sql`coalesce(${blog.publishDate}, ${blog.createdAt})`),
  desc(blog.createdAt),
];

function toAdminWhereClause(filters: AdminFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.slug) {
    clauses.push(eq(blog.slug, filters.slug));
  }

  if (filters.status) {
    clauses.push(eq(blog.status, filters.status));
  }

  if (filters.authorId) {
    clauses.push(eq(blog.authorId, filters.authorId));
  }

  withTextQuery(clauses, filters.q);
  withAdminTagFilterPartial(clauses, filters.tag);

  if (clauses.length === 0) {
    return undefined;
  }

  return and(...clauses) as SQL;
}

export const blogRepository = {
  async findPublishedBySlug(slug: string): Promise<BlogEntity | null> {
    const [found] = await db
      .select()
      .from(blog)
      .where(
        and(
          eq(blog.slug, slug),
          eq(blog.status, "published"),
          or(
            sql`${blog.publishDate} IS NULL`,
            lte(blog.publishDate, new Date()),
          ) as SQL,
        ),
      )
      .orderBy(...orderByNewestPublishFirst)
      .limit(1);

    return found ?? null;
  },

  async findById(id: string): Promise<BlogEntity | null> {
    const [found] = await db
      .select()
      .from(blog)
      .where(eq(blog.id, id))
      .limit(1);
    return found ?? null;
  },

  async findPublishedMany(
    query: ListBlogsQueryDTO,
    page: number,
    limit: number,
  ): Promise<{ items: BlogEntity[]; total: number }> {
    const where = toPublishedWhereClause(query);
    const offset = (page - 1) * limit;

    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(blog)
        .where(where)
        .orderBy(...orderByNewestPublishFirst)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(blog)
        .where(where),
    ]);

    return {
      items,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  async findPublishedSlugs(): Promise<
    Array<{ slug: string; updatedAt: Date }>
  > {
    const where = toPublishedWhereClause({});

    return db
      .select({ slug: blog.slug, updatedAt: blog.updatedAt })
      .from(blog)
      .where(where)
      .orderBy(...orderByNewestPublishFirst);
  },

  /**
   * Tag strings on currently visible published posts, ordered by usage (desc), then name.
   * Empty strings from storage are ignored.
   */
  async findPublishedTopTags(limit: number): Promise<string[]> {
    const publishedWhere = toPublishedWhereClause({});

    const result = await db.execute<{ tag: string }>(
      sql`
        SELECT sub.tag AS tag
        FROM (
          SELECT unnested.tag AS tag, COUNT(*)::int AS usage_count
          FROM ${blog}
          CROSS JOIN LATERAL unnest(${blog.tags}) AS unnested(tag)
          WHERE ${publishedWhere}
            AND trim(unnested.tag) <> ''
          GROUP BY unnested.tag
        ) sub
        ORDER BY sub.usage_count DESC, sub.tag ASC
        LIMIT ${limit}
      `,
    );

    return result.rows.map((row) => row.tag).filter(Boolean);
  },

  /**
   * Other published blogs that share at least one tag with the source row `blogId`.
   * Ordered by number of shared tags (desc), then newest publish first.
   * Returns [] when the source has no tags or no overlaps (caller may skip calling if source tags empty).
   */
  async findPublishedRelatedBySharedTags(
    blogId: string,
    limit: number,
  ): Promise<BlogEntity[]> {
    const published = toPublishedWhereClause({});

    const sourceCte = db
      .$with("src")
      .as(db.select({ tags: blog.tags }).from(blog).where(eq(blog.id, blogId)));

    const sourceTags = sql`(SELECT tags FROM src)`;

    // Works on PG 9.4+ — no array_intersect() needed.
    const sharedCount = sql<number>`
      cardinality(ARRAY(
        SELECT unnest(${blog.tags})
        INTERSECT
        SELECT unnest(${sourceTags})
      ))
    `;

    return db
      .with(sourceCte)
      .select()
      .from(blog)
      .where(
        and(
          published,
          ne(blog.id, blogId),
          sql`0 < cardinality(${sourceTags})`,
          sql`${blog.tags} && ${sourceTags}`,
        ) as SQL,
      )
      .orderBy(desc(sharedCount), ...orderByNewestPublishFirst)
      .limit(limit);
  },

  async findFeaturedPublishedMany(
    query: ListBlogsQueryDTO,
    page: number,
    limit: number,
  ): Promise<{ items: BlogEntity[]; total: number }> {
    const baseWhere = toPublishedWhereClause(query);
    const where = and(baseWhere, eq(blog.isFeatured, true)) as SQL;
    const offset = (page - 1) * limit;

    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(blog)
        .where(where)
        .orderBy(...orderByNewestPublishFirst)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(blog)
        .where(where),
    ]);

    return {
      items,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  async findAdminMany(
    query: ListAdminBlogsQueryDTO,
    page: number,
    limit: number,
  ): Promise<{ items: BlogEntity[]; total: number }> {
    const where = toAdminWhereClause(query);
    const offset = (page - 1) * limit;

    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(blog)
        .where(where)
        .orderBy(...orderByNewestPublishFirst)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(blog)
        .where(where),
    ]);

    return {
      items,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  async create(authorId: string, input: CreateBlogDTO): Promise<BlogEntity> {
    const [created] = await db
      .insert(blog)
      .values({
        id: createId(),
        titleAr: input.titleAr,
        titleEn: input.titleEn,
        descriptionAr: input.descriptionAr,
        descriptionEn: input.descriptionEn,
        slug: input.slug,
        contentAr: input.contentAr,
        contentEn: input.contentEn,
        coverImageUrl: input.coverImageUrl,
        isFeatured: input.isFeatured,
        excerptAr: input.excerptAr,
        excerptEn: input.excerptEn,
        readingMinutes: input.readingMinutes,
        authorId,
        tags: input.tags,
        status: input.status,
        publishDate: input.publishDate ? new Date(input.publishDate) : null,
      })
      .returning();

    return created;
  },

  async update(id: string, input: UpdateBlogDTO): Promise<BlogEntity | null> {
    const [updated] = await db
      .update(blog)
      .set({
        ...(input.titleAr !== undefined ? { titleAr: input.titleAr } : {}),
        ...(input.titleEn !== undefined ? { titleEn: input.titleEn } : {}),
        ...(input.descriptionAr !== undefined
          ? { descriptionAr: input.descriptionAr }
          : {}),
        ...(input.descriptionEn !== undefined
          ? { descriptionEn: input.descriptionEn }
          : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.contentAr !== undefined
          ? { contentAr: input.contentAr }
          : {}),
        ...(input.contentEn !== undefined
          ? { contentEn: input.contentEn }
          : {}),
        ...(input.coverImageUrl !== undefined
          ? { coverImageUrl: input.coverImageUrl }
          : {}),
        ...(input.isFeatured !== undefined
          ? { isFeatured: input.isFeatured }
          : {}),
        ...(input.excerptAr !== undefined
          ? { excerptAr: input.excerptAr }
          : {}),
        ...(input.excerptEn !== undefined
          ? { excerptEn: input.excerptEn }
          : {}),
        ...(input.readingMinutes !== undefined
          ? { readingMinutes: input.readingMinutes }
          : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.publishDate !== undefined
          ? {
              publishDate: input.publishDate
                ? new Date(input.publishDate)
                : null,
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(blog.id, id))
      .returning();

    return updated ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const deleted = await db
      .delete(blog)
      .where(eq(blog.id, id))
      .returning({ id: blog.id });

    return deleted.length > 0;
  },

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const where = excludeId
      ? and(eq(blog.slug, slug), ne(blog.id, excludeId))
      : eq(blog.slug, slug);

    const [result] = await db
      .select({ id: blog.id })
      .from(blog)
      .where(where)
      .limit(1);

    return Boolean(result);
  },
};

export type { BlogEntity };
