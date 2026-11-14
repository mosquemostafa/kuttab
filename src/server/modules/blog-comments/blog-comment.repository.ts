import { createId } from "@paralleldrive/cuid2";
import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { blogsComment } from "@/server/modules/blog-comments/blog-comment.entity";
import { user } from "@/server/modules/users/user.entity";
import type { CreateBlogCommentDTO } from "@/server/modules/blog-comments/blog-comment.dto";

type BlogsCommentEntity = typeof blogsComment.$inferSelect;

/** Comment row with author fields from a single join query (no N+1). */
export type BlogCommentWithAuthor = {
  id: string;
  blogId: string;
  userId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  authorName: string;
  authorImage: string | null;
};

const commentAuthorSelection = {
  id: blogsComment.id,
  blogId: blogsComment.blogId,
  userId: blogsComment.userId,
  body: blogsComment.body,
  createdAt: blogsComment.createdAt,
  updatedAt: blogsComment.updatedAt,
  authorName: user.name,
  authorImage: user.image,
} as const;

export const blogCommentRepository = {
  async findManyByBlogId(
    blogId: string,
    page: number,
    limit: number,
  ): Promise<{ items: BlogCommentWithAuthor[]; total: number }> {
    const offset = (page - 1) * limit;
    const where = eq(blogsComment.blogId, blogId);

    const [items, totalRows] = await Promise.all([
      db
        .select(commentAuthorSelection)
        .from(blogsComment)
        .innerJoin(user, eq(blogsComment.userId, user.id))
        .where(where)
        .orderBy(asc(blogsComment.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(blogsComment)
        .where(where),
    ]);

    return {
      items,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  async findById(id: string): Promise<BlogsCommentEntity | null> {
    const [found] = await db
      .select()
      .from(blogsComment)
      .where(eq(blogsComment.id, id))
      .limit(1);

    return found ?? null;
  },

  /** Single comment with author — one join query (used after create/update). */
  async findByIdWithAuthor(id: string): Promise<BlogCommentWithAuthor | null> {
    const [found] = await db
      .select(commentAuthorSelection)
      .from(blogsComment)
      .innerJoin(user, eq(blogsComment.userId, user.id))
      .where(eq(blogsComment.id, id))
      .limit(1);

    return found ?? null;
  },

  async create(
    blogId: string,
    userId: string,
    input: CreateBlogCommentDTO,
  ): Promise<BlogsCommentEntity> {
    const [created] = await db
      .insert(blogsComment)
      .values({
        id: createId(),
        blogId,
        userId,
        body: input.body,
      })
      .returning();

    if (!created) {
      throw new Error("Blog comment insert did not return a row");
    }

    return created;
  },

  async update(id: string, body: string): Promise<BlogsCommentEntity | null> {
    const [updated] = await db
      .update(blogsComment)
      .set({
        body,
        updatedAt: new Date(),
      })
      .where(eq(blogsComment.id, id))
      .returning();

    return updated ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const deleted = await db
      .delete(blogsComment)
      .where(eq(blogsComment.id, id))
      .returning({ id: blogsComment.id });

    return deleted.length > 0;
  },
};
