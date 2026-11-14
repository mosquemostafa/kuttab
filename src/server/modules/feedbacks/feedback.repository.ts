import { createId } from "@paralleldrive/cuid2";
import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { feedback } from "@/server/modules/feedbacks/feedback.entity";
import { user } from "@/server/modules/users/user.entity";
import { FeedbackStatus } from "@/shared/enums/feedback-status.enum";
import { FeedbackType } from "@/shared/enums/feedback-type.enum";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";

type FeedbackRow = typeof feedback.$inferSelect;
type FeedbackListRow = FeedbackRow & {
  userEmail: string | null;
};
type SortDirection = "asc" | "desc";

const feedbackListSelection = {
  id: feedback.id,
  userId: feedback.userId,
  type: feedback.type,
  subject: feedback.subject,
  description: feedback.description,
  status: feedback.status,
  createdAt: feedback.createdAt,
  updatedAt: feedback.updatedAt,
  userEmail: user.email,
};

function toStatusClause(status?: FeedbackStatus) {
  if (!status) return undefined;
  return eq(feedback.status, status);
}

function toTypeClause(type?: FeedbackType) {
  if (!type) return undefined;
  return eq(feedback.type, type);
}

export const feedbackRepository = {
  async findManyByUserId(
    userId: string,
    pagination: ParsedPagination,
    filters: {
      status?: FeedbackStatus;
      type?: FeedbackType;
    },
    sortDirection: SortDirection = "desc",
  ): Promise<{ items: FeedbackListRow[]; total: number }> {
    const where = and(
      eq(feedback.userId, userId),
      toStatusClause(filters.status),
      toTypeClause(filters.type),
    );
    const createdAtOrder =
      sortDirection === "asc"
        ? asc(feedback.createdAt)
        : desc(feedback.createdAt);

    const [items, totalRows] = await Promise.all([
      db
        .select(feedbackListSelection)
        .from(feedback)
        .leftJoin(user, eq(feedback.userId, user.id))
        .where(where)
        .orderBy(createdAtOrder)
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(feedback)
        .where(where),
    ]);

    return {
      items,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  async findMany(
    pagination: ParsedPagination,
    filters: {
      status?: FeedbackStatus;
      type?: FeedbackType;
    },
    sortDirection: SortDirection = "desc",
  ): Promise<{ items: FeedbackListRow[]; total: number }> {
    const where = and(
      toStatusClause(filters.status),
      toTypeClause(filters.type),
    );
    const createdAtOrder =
      sortDirection === "asc"
        ? asc(feedback.createdAt)
        : desc(feedback.createdAt);

    const [items, totalRows] = await Promise.all([
      db
        .select(feedbackListSelection)
        .from(feedback)
        .leftJoin(user, eq(feedback.userId, user.id))
        .where(where)
        .orderBy(createdAtOrder)
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(feedback)
        .where(where),
    ]);

    return {
      items,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  async findById(id: string): Promise<FeedbackRow | null> {
    const [row] = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, id))
      .limit(1);
    return row ?? null;
  },

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<FeedbackRow | null> {
    const [row] = await db
      .select()
      .from(feedback)
      .where(and(eq(feedback.id, id), eq(feedback.userId, userId)))
      .limit(1);

    return row ?? null;
  },

  async create(data: {
    userId: string;
    type: FeedbackType;
    subject: string;
    description: string;
  }): Promise<FeedbackRow> {
    const [created] = await db
      .insert(feedback)
      .values({
        id: createId(),
        userId: data.userId,
        type: data.type,
        subject: data.subject,
        description: data.description,
        status: FeedbackStatus.NEW,
      })
      .returning();

    return created;
  },

  async updateStatus(
    id: string,
    status: FeedbackStatus,
  ): Promise<FeedbackRow | null> {
    const [updated] = await db
      .update(feedback)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(feedback.id, id))
      .returning();

    return updated ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const deleted = await db
      .delete(feedback)
      .where(eq(feedback.id, id))
      .returning({ id: feedback.id });

    return deleted.length > 0;
  },
};
