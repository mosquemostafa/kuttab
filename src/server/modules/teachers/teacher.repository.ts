import { createId } from "@paralleldrive/cuid2";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  type SQL,
} from "drizzle-orm";

import { db } from "@/server/db";
import { teacher } from "@/server/modules/teachers/teacher.entity";
import type { ListTeachersQueryDTO } from "@/server/modules/teachers/teacher.dto";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";

export type TeacherRow = typeof teacher.$inferSelect;

export type CreateTeacherInput = {
  userId?: string | null;
  name: string;
  phone?: string | null;
  studentType?: "foundation" | "khatimeen" | "children" | "adults" | null;
  status?: "active" | "archived";
  notes?: string | null;
};

export type UpdateTeacherInput = Partial<CreateTeacherInput>;

function toWhereClause(filters: Partial<ListTeachersQueryDTO>): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    clauses.push(
      or(
        ilike(teacher.name, pattern),
        ilike(teacher.phone, pattern),
        ilike(teacher.notes, pattern),
      )!,
    );
  }

  if (filters.userId) {
    clauses.push(eq(teacher.userId, filters.userId));
  }

  if (filters.studentType) {
    clauses.push(eq(teacher.studentType, filters.studentType));
  }

  if (filters.status) {
    clauses.push(eq(teacher.status, filters.status));
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export const teacherRepository = {
  async findMany(
    filters: Partial<ListTeachersQueryDTO>,
    pagination: ParsedPagination,
  ): Promise<{ items: TeacherRow[]; total: number }> {
    const where = toWhereClause(filters);

    let orderColumn = desc(teacher.createdAt);
    const isAsc = filters.sortOrder === "asc";

    if (filters.sortBy === "name") {
      orderColumn = isAsc ? asc(teacher.name) : desc(teacher.name);
    } else if (filters.sortBy === "status") {
      orderColumn = isAsc ? asc(teacher.status) : desc(teacher.status);
    } else if (filters.sortBy === "createdAt") {
      orderColumn = isAsc ? asc(teacher.createdAt) : desc(teacher.createdAt);
    }

    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(teacher)
        .where(where)
        .orderBy(orderColumn)
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: count() }).from(teacher).where(where),
    ]);

    return {
      items,
      total: totalRows[0]?.count ?? 0,
    };
  },

  async findById(id: string): Promise<TeacherRow | null> {
    const [found] = await db
      .select()
      .from(teacher)
      .where(eq(teacher.id, id))
      .limit(1);

    return found ?? null;
  },

  async findByUserId(userId: string): Promise<TeacherRow[]> {
    return db
      .select()
      .from(teacher)
      .where(eq(teacher.userId, userId))
      .orderBy(desc(teacher.createdAt));
  },

  async create(data: CreateTeacherInput): Promise<TeacherRow> {
    const [created] = await db
      .insert(teacher)
      .values({
        id: createId(),
        userId: data.userId ?? null,
        name: data.name,
        phone: data.phone ?? null,
        studentType: data.studentType ?? null,
        status: data.status ?? "active",
        notes: data.notes ?? null,
      })
      .returning();

    return created;
  },

  async update(
    id: string,
    data: UpdateTeacherInput,
  ): Promise<TeacherRow | null> {
    const [updated] = await db
      .update(teacher)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(teacher.id, id))
      .returning();

    return updated ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const deleted = await db
      .delete(teacher)
      .where(eq(teacher.id, id))
      .returning({ id: teacher.id });

    return deleted.length > 0;
  },

  async findSelectOptions(
    filters: { q?: string; includeArchived?: boolean },
    pagination: { limit: number; offset: number },
  ): Promise<{ items: { id: string; name: string }[]; total: number }> {
    const clauses: SQL[] = [];

    if (!filters.includeArchived) {
      clauses.push(eq(teacher.status, "active"));
    }

    if (filters.q) {
      clauses.push(ilike(teacher.name, `%${filters.q}%`));
    }

    const whereClause = clauses.length > 0 ? and(...clauses) : undefined;

    const [items, [countResult]] = await Promise.all([
      db
        .select({
          id: teacher.id,
          name: teacher.name,
        })
        .from(teacher)
        .where(whereClause)
        .orderBy(asc(teacher.name))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: count() }).from(teacher).where(whereClause),
    ]);

    return {
      items,
      total: countResult?.count ?? 0,
    };
  },
};
