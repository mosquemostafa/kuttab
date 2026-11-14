import {
  buildSelectMeta,
  type ParsedSelectQuery,
  type SelectTitleItem,
} from "@/server/dto/select-query.dto";
import type { ListTodosQueryDTO } from "@/server/modules/todos/todo.dto";
import type {
  CreateTodoDTO,
  UpdateTodoDTO,
} from "@/server/modules/todos/todo.dto";
import { NotFoundException } from "@/server/exceptions/exceptions";
import { projectRepository } from "@/server/modules/projects/project.repository";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import { todoRepository } from "@/server/modules/todos/todo.repository";
import type {
  PaginatedResponse,
  PaginationMeta,
} from "@/shared/types/pagination.types";
import type { TodoDTO } from "@/shared/types/todo.types";
import { resolveCompletionFromChecklist } from "@/shared/utils/todo-checklist";

type TodoRow =
  Awaited<ReturnType<typeof todoRepository.findByIdAndUserId>> extends infer T
    ? NonNullable<T>
    : never;

async function assertProjectOwned(
  userId: string,
  projectId: string,
): Promise<void> {
  const found = await projectRepository.findByIdAndUserId(projectId, userId);

  if (!found) {
    throw new NotFoundException("Project", projectId);
  }
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function toDTO(value: TodoRow): TodoDTO {
  return {
    id: value.id,
    userId: value.userId,
    title: value.title,
    projectId: value.projectId ?? null,
    checklist: [...(value.checklist ?? [])],
    isCompleted: value.isCompleted,
    priority: value.priority,
    dueDate: value.dueDate ?? null,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
  };
}

export const todoService = {
  async listTodos(
    userId: string,
    filters: Pick<
      ListTodosQueryDTO,
      "q" | "priority" | "projectId" | "sortBy"
    > & {
      completed?: boolean;
      dueFrom?: string;
      dueTo?: string;
      onlyNoDueDate?: boolean;
      onlyOverdue?: boolean;
      currentDate?: string;
    },
    pagination: ParsedPagination,
  ): Promise<PaginatedResponse<TodoDTO>> {
    const { todos, total } = await todoRepository.findManyByUserId(
      userId,
      filters,
      pagination,
    );

    return {
      items: todos.map(toDTO),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  },

  async getTodoById(userId: string, id: string): Promise<TodoDTO> {
    const found = await todoRepository.findByIdAndUserId(id, userId);

    if (!found) {
      throw new NotFoundException("Todo", id);
    }

    return toDTO(found);
  },

  async createTodo(userId: string, dto: CreateTodoDTO): Promise<TodoDTO> {
    const projectId = dto.projectId ?? null;

    if (projectId) {
      await assertProjectOwned(userId, projectId);
    }

    const checklist = dto.checklist ?? [];
    const checklistCompletion = resolveCompletionFromChecklist(checklist);

    const created = await todoRepository.create({
      userId,
      title: dto.title,
      projectId,
      checklist,
      isCompleted: checklistCompletion ?? false,
      priority: dto.priority,
      dueDate: dto.dueDate ?? null,
    });

    return toDTO(created);
  },

  async updateTodo(
    userId: string,
    id: string,
    dto: UpdateTodoDTO,
  ): Promise<TodoDTO> {
    const existing = await todoRepository.findByIdAndUserId(id, userId);

    if (!existing) {
      throw new NotFoundException("Todo", id);
    }

    if (dto.projectId !== undefined && dto.projectId) {
      await assertProjectOwned(userId, dto.projectId);
    }

    const updateData: Parameters<typeof todoRepository.update>[2] = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.isCompleted !== undefined
        ? { isCompleted: dto.isCompleted }
        : {}),
      ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate ?? null } : {}),
      ...(dto.projectId !== undefined
        ? { projectId: dto.projectId ?? null }
        : {}),
      ...(dto.checklist !== undefined ? { checklist: dto.checklist } : {}),
    };

    if (dto.checklist !== undefined) {
      const checklistCompletion = resolveCompletionFromChecklist(dto.checklist);
      if (checklistCompletion !== null) {
        updateData.isCompleted = checklistCompletion;
      }
    }

    if (updateData.isCompleted === true) {
      const effectiveDueDate =
        updateData.dueDate !== undefined
          ? updateData.dueDate
          : existing.dueDate;

      if (!effectiveDueDate) {
        updateData.dueDate = todayIsoDate();
      }
    }

    const updated = await todoRepository.update(id, userId, {
      ...updateData,
    });

    if (!updated) {
      throw new NotFoundException("Todo", id);
    }

    return toDTO(updated);
  },

  async deleteTodo(userId: string, id: string): Promise<void> {
    const deleted = await todoRepository.delete(id, userId);

    if (!deleted) {
      throw new NotFoundException("Todo", id);
    }
  },

  async getSelectOptions(
    userId: string,
    query: ParsedSelectQuery,
  ): Promise<{ items: SelectTitleItem[]; meta: PaginationMeta }> {
    const { items, total } = await todoRepository.findSelectOptions(
      userId,
      { q: query.q },
      { limit: query.limit, offset: query.offset },
    );

    return {
      items,
      meta: buildSelectMeta(total, query.page, query.limit),
    };
  },
};
