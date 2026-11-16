import { createId } from "@paralleldrive/cuid2";
import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "@/server/db";
import { classes } from "@/server/modules/classes/class.entity";
import type { ListClassesQueryDTO } from "@/server/modules/classes/class.dto";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";

export type ClassRow = typeof classes.$inferSelect;

export type CreateClassInput = {
  name: string;
  primaryTeacherId?: string | null;
  secondaryTeacherId?: string | null;
  classType?: "group" | "individual";
};

export type UpdateClassInput = Partial<CreateClassInput>;

function toWhereClause(filters: Partial<ListClassesQueryDTO>): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.q) {
    clauses.push(ilike(classes.name, `%${filters.q}%`));
  }

  if (filters.primaryTeacherId) {
    clauses.push(eq(classes.primaryTeacherId, filters.primaryTeacherId));
  }

  if (filters.secondaryTeacherId) {
    clauses.push(eq(classes.secondaryTeacherId, filters.secondaryTeacherId));
  }

  if (filters.teacherId) {
    clauses.push(
      or(
        eq(classes.primaryTeacherId, filters.teacherId),
        eq(classes.secondaryTeacherId, filters.teacherId),
      )!,
    );
  }

  if (filters.classType) {
    clauses.push(eq(classes.classType, filters.classType));
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export const classRepository = {
  async findMany(
    filters: Partial<ListClassesQueryDTO>,
    pagination: ParsedPagination,
  ): Promise<{ items: ClassRow[]; total: number }> {
    const where = toWhereClause(filters);

    let orderColumn = desc(classes.createdAt);
    const isAsc = filters.sortOrder === "asc";

    if (filters.sortBy === "name") {
      orderColumn = isAsc ? asc(classes.name) : desc(classes.name);
    } else if (filters.sortBy === "classType") {
      orderColumn = isAsc ? asc(classes.classType) : desc(classes.classType);
    } else if (filters.sortBy === "createdAt") {
      orderColumn = isAsc ? asc(classes.createdAt) : desc(classes.createdAt);
    }

    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(classes)
        .where(where)
        .orderBy(orderColumn)
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: count() }).from(classes).where(where),
    ]);

    return {
      items,
      total: totalRows[0]?.count ?? 0,
    };
  },

  async findById(id: string): Promise<ClassRow | null> {
    const [found] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, id))
      .limit(1);

    return found ?? null;
  },

  async findByTeacherId(teacherId: string): Promise<ClassRow[]> {
    return db
      .select()
      .from(classes)
      .where(
        or(
          eq(classes.primaryTeacherId, teacherId),
          eq(classes.secondaryTeacherId, teacherId),
        ),
      )
      .orderBy(desc(classes.createdAt));
  },

  async create(data: CreateClassInput): Promise<ClassRow> {
    const [created] = await db
      .insert(classes)
      .values({
        id: createId(),
        name: data.name,
        primaryTeacherId: data.primaryTeacherId ?? null,
        secondaryTeacherId: data.secondaryTeacherId ?? null,
        classType: data.classType ?? "group",
      })
      .returning();

    return created;
  },

  async update(id: string, data: UpdateClassInput): Promise<ClassRow | null> {
    const [updated] = await db
      .update(classes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(classes.id, id))
      .returning();

    return updated ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const deleted = await db
      .delete(classes)
      .where(eq(classes.id, id))
      .returning({ id: classes.id });

    return deleted.length > 0;
  },

  async findSelectOptions(
    filters: { q?: string; classType?: "group" | "individual" },
    pagination: { limit: number; offset: number },
  ): Promise<{ items: { id: string; name: string }[]; total: number }> {
    const clauses: SQL[] = [];

    if (filters.q) {
      clauses.push(ilike(classes.name, `%${filters.q}%`));
    }

    if (filters.classType) {
      clauses.push(eq(classes.classType, filters.classType));
    }

    const whereClause = clauses.length > 0 ? and(...clauses) : undefined;

    const [items, [countResult]] = await Promise.all([
      db
        .select({
          id: classes.id,
          name: classes.name,
        })
        .from(classes)
        .where(whereClause)
        .orderBy(asc(classes.name))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: count() }).from(classes).where(whereClause),
    ]);

    return {
      items,
      total: countResult?.count ?? 0,
    };
  },
};
