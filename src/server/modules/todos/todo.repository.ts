import { createId } from "@paralleldrive/cuid2";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
  lt,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";

import type { TodoChecklistItem } from "@/shared/types/todo.types";
import { db } from "@/server/db";
import { todo } from "@/server/modules/todos/todo.entity";
import type { ListTodosQueryDTO } from "@/server/modules/todos/todo.dto";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";

type TodoRow = typeof todo.$inferSelect;

type TodoFilters = Pick<ListTodosQueryDTO, "q" | "priority" | "projectId"> & {
  sortBy?: ListTodosQueryDTO["sortBy"];
  completed?: boolean;
  dueFrom?: string;
  dueTo?: string;
  onlyNoDueDate?: boolean;
  onlyOverdue?: boolean;
  currentDate?: string;
};

type TodoUpdateData = Partial<{
  title: string;
  isCompleted: boolean;
  priority: "low" | "medium" | "high" | null;
  dueDate: string | null;
  projectId: string | null;
  checklist: TodoChecklistItem[];
}>;

function toWhereClause(userId: string, filters: TodoFilters) {
  const clauses: SQL[] = [eq(todo.userId, userId)];

  if (filters.priority) {
    clauses.push(eq(todo.priority, filters.priority));
  }

  if (filters.projectId) {
    clauses.push(eq(todo.projectId, filters.projectId));
  }

  if (filters.completed !== undefined) {
    clauses.push(eq(todo.isCompleted, filters.completed));
  }

  if (filters.q) {
    const query = `%${filters.q}%`;
    clauses.push(ilike(todo.title, query));
  }

  if (filters.onlyNoDueDate) {
    clauses.push(isNull(todo.dueDate));
    return and(...clauses);
  }

  if (filters.onlyOverdue) {
    clauses.push(isNotNull(todo.dueDate));
    if (filters.currentDate) {
      clauses.push(lt(todo.dueDate, filters.currentDate));
    } else {
      clauses.push(lt(todo.dueDate, sql`current_date`));
    }
    return and(...clauses);
  }

  const dueClauses: SQL[] = [];

  if (filters.dueFrom) {
    dueClauses.push(gte(todo.dueDate, filters.dueFrom));
  }

  if (filters.dueTo) {
    dueClauses.push(lte(todo.dueDate, filters.dueTo));
  }

  if (dueClauses.length > 0) {
    const dueRange = and(...dueClauses);

    if (!dueRange) {
      return and(...clauses);
    }

    clauses.push(dueRange);
  }

  return and(...clauses);
}

function getOrderBy(sortBy?: ListTodosQueryDTO["sortBy"]) {
  const completionOrder = sql<number>`case
    when ${todo.isCompleted} = false then 0
    else 1
  end`;

  const dueDateNullsLast = sql<number>`case
    when ${todo.dueDate} is null then 1
    else 0
  end`;

  const priorityOrder = sql<number>`case
    when ${todo.priority} = 'high' then 3
    when ${todo.priority} = 'medium' then 2
    when ${todo.priority} = 'low' then 1
    else 0
  end`;

  if (sortBy === "title") {
    return [
      asc(completionOrder),
      asc(todo.title),
      desc(todo.createdAt),
    ] as const;
  }

  if (sortBy === "priority") {
    return [
      asc(completionOrder),
      desc(priorityOrder),
      desc(todo.createdAt),
    ] as const;
  }

  return [
    asc(completionOrder),
    asc(dueDateNullsLast),
    desc(todo.dueDate),
    desc(todo.createdAt),
  ] as const;
}

export const todoRepository = {
  async findManyByUserId(
    userId: string,
    filters: TodoFilters,
    pagination: ParsedPagination,
  ): Promise<{ todos: TodoRow[]; total: number }> {
    const where = toWhereClause(userId, filters);
    const orderBy = getOrderBy(filters.sortBy);

    const [todos, totalRows] = await Promise.all([
      db
        .select()
        .from(todo)
        .where(where)
        .orderBy(...orderBy)
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(todo)
        .where(where),
    ]);

    const total = Number(totalRows[0]?.count ?? 0);

    return {
      todos,
      total,
    };
  },

  async findByIdAndUserId(id: string, userId: string): Promise<TodoRow | null> {
    const [found] = await db
      .select()
      .from(todo)
      .where(and(eq(todo.id, id), eq(todo.userId, userId)))
      .limit(1);

    return found ?? null;
  },

  async create(data: {
    userId: string;
    title: string;
    projectId: string | null;
    checklist: TodoChecklistItem[];
    isCompleted?: boolean;
    priority?: "low" | "medium" | "high";
    dueDate: string | null;
  }): Promise<TodoRow> {
    const [created] = await db
      .insert(todo)
      .values({
        id: createId(),
        userId: data.userId,
        title: data.title,
        projectId: data.projectId,
        checklist: data.checklist,
        isCompleted: data.isCompleted ?? false,
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        dueDate: data.dueDate,
      })
      .returning();

    return created;
  },

  async update(
    id: string,
    userId: string,
    data: TodoUpdateData,
  ): Promise<TodoRow | null> {
    const [updated] = await db
      .update(todo)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(todo.id, id), eq(todo.userId, userId)))
      .returning();

    return updated ?? null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const deleted = await db
      .delete(todo)
      .where(and(eq(todo.id, id), eq(todo.userId, userId)))
      .returning({ id: todo.id });

    return deleted.length > 0;
  },

  async countByUserId(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(todo)
      .where(eq(todo.userId, userId));

    return Number(result?.count ?? 0);
  },

  async findSelectOptions(
    userId: string,
    filters: { q?: string },
    pagination: { limit: number; offset: number },
  ): Promise<{ items: { id: string; title: string }[]; total: number }> {
    const clauses: SQL[] = [eq(todo.userId, userId)];

    if (filters.q) {
      clauses.push(ilike(todo.title, `%${filters.q}%`));
    }

    const whereClause = and(...clauses);

    const [items, [countResult]] = await Promise.all([
      db
        .select({
          id: todo.id,
          title: todo.title,
        })
        .from(todo)
        .where(whereClause)
        .orderBy(asc(todo.title))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(todo)
        .where(whereClause),
    ]);

    return {
      items,
      total: countResult?.count ?? 0,
    };
  },
};
