import { createId } from "@paralleldrive/cuid2";
import { asc, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { segment } from "@/server/modules/segments/segment.entity";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";

type SegmentRow = typeof segment.$inferSelect;

type SortDirection = "asc" | "desc";

export const segmentRepository = {
  async findMany(
    pagination: ParsedPagination,
    searchQuery?: string,
    sortDirection: SortDirection = "desc",
  ): Promise<{ items: SegmentRow[]; total: number }> {
    const where = searchQuery
      ? or(
          ilike(segment.name, `%${searchQuery}%`),
          ilike(segment.icon, `%${searchQuery}%`),
        )
      : undefined;

    const createdAtOrder =
      sortDirection === "asc"
        ? asc(segment.createdAt)
        : desc(segment.createdAt);

    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(segment)
        .where(where)
        .orderBy(createdAtOrder)
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(segment)
        .where(where),
    ]);

    return {
      items,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  async findById(id: string): Promise<SegmentRow | null> {
    const [row] = await db
      .select()
      .from(segment)
      .where(eq(segment.id, id))
      .limit(1);
    return row ?? null;
  },

  async create(data: { name: string; icon: string }): Promise<SegmentRow> {
    const [created] = await db
      .insert(segment)
      .values({
        id: createId(),
        name: data.name,
        icon: data.icon,
      })
      .returning();

    return created;
  },

  async update(
    id: string,
    data: {
      name?: string;
      icon?: string;
    },
  ): Promise<SegmentRow | null> {
    const [updated] = await db
      .update(segment)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(segment.id, id))
      .returning();

    return updated ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const deleted = await db
      .delete(segment)
      .where(eq(segment.id, id))
      .returning({ id: segment.id });

    return deleted.length > 0;
  },
};
