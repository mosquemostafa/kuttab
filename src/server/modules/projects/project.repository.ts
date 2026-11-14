import { createId } from "@paralleldrive/cuid2";
import { and, asc, desc, eq, ilike, inArray, sql, type SQL } from "drizzle-orm";

import { db } from "@/server/db";
import { project } from "@/server/modules/projects/project.entity";
import { todo } from "@/server/modules/todos/todo.entity";
import type { ListProjectsQueryDTO } from "@/server/modules/projects/project.dto";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import type { ColorKey } from "@/shared/constants/color-palette";

type ProjectRow = typeof project.$inferSelect;

type ProjectFilters = Pick<ListProjectsQueryDTO, "q" | "isArchived" | "sortBy">;

type ProjectUpdateData = Partial<{
  name: string;
  description: string | null;
  colorKey: ColorKey | null;
  icon: string | null;
  isArchived: boolean;
}>;

function toWhereClause(userId: string, filters: Partial<ProjectFilters> = {}) {
  const clauses: SQL[] = [eq(project.userId, userId)];

  if (filters.isArchived !== undefined) {
    clauses.push(eq(project.isArchived, filters.isArchived));
  }

  if (filters.q) {
    clauses.push(ilike(project.name, `%${filters.q}%`));
  }

  return and(...clauses);
}

function getOrderBy(sortBy?: ListProjectsQueryDTO["sortBy"]) {
  if (sortBy === "name") {
    return [asc(project.name), desc(project.createdAt)] as const;
  }

  if (sortBy === "updatedAt") {
    return [desc(project.updatedAt)] as const;
  }

  return [desc(project.createdAt)] as const;
}

export const projectRepository = {
  async findManyByUserId(
    userId: string,
    filters: ProjectFilters,
    pagination: ParsedPagination,
  ): Promise<{ projects: ProjectRow[]; total: number }> {
    const where = toWhereClause(userId, filters);
    const orderBy = getOrderBy(filters.sortBy);

    const [projects, totalRows] = await Promise.all([
      db
        .select()
        .from(project)
        .where(where)
        .orderBy(...orderBy)
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(project)
        .where(where),
    ]);

    const total = Number(totalRows[0]?.count ?? 0);

    return { projects, total };
  },

  async countByUserId(
    userId: string,
    filters: Partial<ProjectFilters> = {},
  ): Promise<number> {
    const where = toWhereClause(userId, filters);
    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(project)
      .where(where);

    return Number(totalRows[0]?.count ?? 0);
  },

  async findManyByIdsAndUserId(
    userId: string,
    ids: string[],
  ): Promise<ProjectRow[]> {
    if (ids.length === 0) return [];
    return db
      .select()
      .from(project)
      .where(and(eq(project.userId, userId), inArray(project.id, ids)));
  },

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<ProjectRow | null> {
    const [found] = await db
      .select()
      .from(project)
      .where(and(eq(project.id, id), eq(project.userId, userId)))
      .limit(1);

    return found ?? null;
  },

  async create(data: {
    userId: string;
    name: string;
    description: string | null;
    colorKey: ColorKey | null;
    icon: string | null;
    isArchived: boolean;
  }): Promise<ProjectRow> {
    const [created] = await db
      .insert(project)
      .values({
        id: createId(),
        userId: data.userId,
        name: data.name,
        description: data.description,
        colorKey: data.colorKey,
        icon: data.icon,
        isArchived: data.isArchived,
      })
      .returning();

    return created;
  },

  async update(
    id: string,
    userId: string,
    data: ProjectUpdateData,
  ): Promise<ProjectRow | null> {
    const [updated] = await db
      .update(project)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(project.id, id), eq(project.userId, userId)))
      .returning();

    return updated ?? null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const deleted = await db
      .delete(project)
      .where(and(eq(project.id, id), eq(project.userId, userId)))
      .returning({ id: project.id });

    return deleted.length > 0;
  },

  async getContentCounts(
    userId: string,
    filters?: { projectId?: string },
  ): Promise<{
    todos: number;
  }> {
    const todoWhere = filters?.projectId
      ? and(eq(todo.userId, userId), eq(todo.projectId, filters.projectId))
      : eq(todo.userId, userId);

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(todo)
      .where(todoWhere);

    return {
      todos: Number(result?.count ?? 0),
    };
  },

  async findSelectOptions(
    userId: string,
    filters: { q?: string; includeArchived?: boolean },
    pagination: { limit: number; offset: number },
  ): Promise<{ items: { id: string; name: string }[]; total: number }> {
    const clauses: SQL[] = [eq(project.userId, userId)];

    if (!filters.includeArchived) {
      clauses.push(eq(project.isArchived, false));
    }

    if (filters.q) {
      clauses.push(ilike(project.name, `%${filters.q}%`));
    }

    const whereClause = and(...clauses);

    const [items, [countResult]] = await Promise.all([
      db
        .select({
          id: project.id,
          name: project.name,
        })
        .from(project)
        .where(whereClause)
        .orderBy(asc(project.name))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(project)
        .where(whereClause),
    ]);

    return {
      items,
      total: countResult?.count ?? 0,
    };
  },
};
