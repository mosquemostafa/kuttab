import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { parseSelectQuery } from "@/server/dto/select-query.dto";
import {
  createTodoSchema,
  listTodosQuerySchema,
  updateTodoSchema,
} from "@/server/modules/todos/todo.dto";
import { validateBody } from "@/server/pipes/validate.pipe";
import { parsePagination } from "@/server/pipes/parse-pagination.pipe";
import { todoService } from "@/server/modules/todos/todo.service";
import { getUserId } from "@/server/utils/request-user";
import type { ApiSuccess } from "@/shared/types/api-response.types";
import type { PaginationMeta } from "@/shared/types/pagination.types";

function ok<T>(
  data: T,
  meta?: PaginationMeta,
  status = 200,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export const todoController = {
  async list(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);

    const parsedQuery = listTodosQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      projectId: searchParams.get("projectId") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      dueFrom: searchParams.get("dueFrom") ?? undefined,
      dueTo: searchParams.get("dueTo") ?? undefined,
      completed: searchParams.get("completed") ?? undefined,
      onlyNoDueDate: searchParams.get("onlyNoDueDate") ?? undefined,
      onlyOverdue: searchParams.get("onlyOverdue") ?? undefined,
      currentDate: searchParams.get("currentDate") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const pagination = parsePagination(searchParams);
    const userId = getUserId(req);

    const result = await todoService.listTodos(
      userId,
      {
        q: parsedQuery.q,
        projectId: parsedQuery.projectId,
        priority: parsedQuery.priority,
        sortBy: parsedQuery.sortBy,
        completed: parsedQuery.completed,
        dueFrom: parsedQuery.dueFrom,
        dueTo: parsedQuery.dueTo,
        onlyNoDueDate: parsedQuery.onlyNoDueDate,
        onlyOverdue: parsedQuery.onlyOverdue,
        currentDate: parsedQuery.currentDate,
      },
      pagination,
    );

    return ok(result.items, result.meta);
  },

  async getById(req: NextRequest, id: string): Promise<NextResponse> {
    const userId = getUserId(req);
    const result = await todoService.getTodoById(userId, id);
    return ok(result);
  },

  async create(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(createTodoSchema, body);
    const userId = getUserId(req);
    const result = await todoService.createTodo(userId, input);
    return ok(result, undefined, 201);
  },

  async update(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateTodoSchema, body);
    const userId = getUserId(req);
    const result = await todoService.updateTodo(userId, id, input);
    return ok(result);
  },

  async delete(req: NextRequest, id: string): Promise<NextResponse> {
    const userId = getUserId(req);
    await todoService.deleteTodo(userId, id);
    return new NextResponse(null, { status: 204 });
  },

  async select(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const query = parseSelectQuery(searchParams);
    const userId = getUserId(req);
    const result = await todoService.getSelectOptions(userId, query);
    return ok(result.items, result.meta);
  },
};
