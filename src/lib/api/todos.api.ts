import type {
  CreateTodoDTO,
  ListTodosQueryDTO,
  UpdateTodoDTO,
} from "@/server/modules/todos/todo.dto";
import type { TodoDTO } from "@/shared/types/todo.types";
import type { SelectQuery, SelectTitleItem } from "@/shared/types/select.types";
import { request, requestWithMeta } from "@/lib/api/api-core";

export const todosApi = {
  select: (query?: SelectQuery) => {
    const params = new URLSearchParams();
    if (query?.q) params.set("q", query.q);
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));

    return requestWithMeta<SelectTitleItem>(
      `/todos/select${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  list: (query?: ListTodosQueryDTO) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<TodoDTO>(
      `/todos${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  getById: (id: string) => request<TodoDTO>(`/todos/${id}`),
  create: (data: CreateTodoDTO) =>
    request<TodoDTO>("/todos", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateTodoDTO) =>
    request<TodoDTO>(`/todos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<null>(`/todos/${id}`, {
      method: "DELETE",
    }),
};
