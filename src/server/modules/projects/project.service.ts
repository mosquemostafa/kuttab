import {
  buildSelectMeta,
  type ParsedSelectQuery,
  type SelectNameItem,
} from "@/server/dto/select-query.dto";
import type {
  CreateProjectDTO,
  ListProjectsQueryDTO,
  ProjectAnalyticsQueryDTO,
  ProjectCountsQueryDTO,
  UpdateProjectDTO,
} from "@/server/modules/projects/project.dto";
import { projectRepository } from "@/server/modules/projects/project.repository";
import { assertCanCreateProject } from "@/server/modules/subscriptions/entitlement-guards";
import { NotFoundException } from "@/server/exceptions/exceptions";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import { parseStoredTintColorKey } from "@/shared/constants/color-palette";
import type {
  PaginatedResponse,
  PaginationMeta,
} from "@/shared/types/pagination.types";
import type { ProjectDTO } from "@/shared/types/project.types";

type ProjectRow =
  Awaited<
    ReturnType<typeof projectRepository.findByIdAndUserId>
  > extends infer T
    ? NonNullable<T>
    : never;

function toDTO(value: ProjectRow): ProjectDTO {
  return {
    id: value.id,
    userId: value.userId,
    name: value.name,
    description: value.description ?? null,
    colorKey: parseStoredTintColorKey(value.colorKey),
    icon: value.icon ?? null,
    isArchived: value.isArchived,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
  };
}

export const projectService = {
  async listProjects(
    userId: string,
    filters: Pick<ListProjectsQueryDTO, "q" | "isArchived" | "sortBy">,
    pagination: ParsedPagination,
  ): Promise<PaginatedResponse<ProjectDTO>> {
    const { projects, total } = await projectRepository.findManyByUserId(
      userId,
      filters,
      pagination,
    );

    return {
      items: projects.map(toDTO),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  },

  async getProjectById(userId: string, id: string): Promise<ProjectDTO> {
    const found = await projectRepository.findByIdAndUserId(id, userId);

    if (!found) {
      throw new NotFoundException("Project", id);
    }

    return toDTO(found);
  },

  async createProject(
    userId: string,
    dto: CreateProjectDTO,
  ): Promise<ProjectDTO> {
    await assertCanCreateProject(userId);

    const created = await projectRepository.create({
      userId,
      name: dto.name,
      description: dto.description ?? null,
      colorKey: parseStoredTintColorKey(dto.colorKey ?? null),
      icon: dto.icon ?? null,
      isArchived: dto.isArchived ?? false,
    });

    return toDTO(created);
  },

  async updateProject(
    userId: string,
    id: string,
    dto: UpdateProjectDTO,
  ): Promise<ProjectDTO> {
    const updateData: Parameters<typeof projectRepository.update>[2] = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description ?? null }
        : {}),
      ...(dto.colorKey !== undefined
        ? { colorKey: parseStoredTintColorKey(dto.colorKey) }
        : {}),
      ...(dto.icon !== undefined ? { icon: dto.icon ?? null } : {}),
      ...(dto.isArchived !== undefined ? { isArchived: dto.isArchived } : {}),
    };

    const updated = await projectRepository.update(id, userId, updateData);

    if (!updated) {
      throw new NotFoundException("Project", id);
    }

    return toDTO(updated);
  },

  async archiveProject(userId: string, id: string): Promise<ProjectDTO> {
    const updated = await projectRepository.update(id, userId, {
      isArchived: true,
    });

    if (!updated) {
      throw new NotFoundException("Project", id);
    }

    return toDTO(updated);
  },

  async unarchiveProject(userId: string, id: string): Promise<ProjectDTO> {
    const updated = await projectRepository.update(id, userId, {
      isArchived: false,
    });

    if (!updated) {
      throw new NotFoundException("Project", id);
    }

    return toDTO(updated);
  },

  async getProjectContentAnalytics(
    userId: string,
    filters: Pick<ProjectAnalyticsQueryDTO, "projectId">,
  ): Promise<{
    todos: number;
    total: number;
  }> {
    const counts = await projectRepository.getContentCounts(userId, {
      projectId: filters.projectId,
    });

    return {
      todos: counts.todos,
      total: counts.todos,
    };
  },

  async getProjectCounts(
    userId: string,
    filters?: Pick<ProjectCountsQueryDTO, "q" | "isArchived">,
  ): Promise<{ count: number }> {
    const count = await projectRepository.countByUserId(userId, {
      q: filters?.q,
      isArchived: filters?.isArchived,
      sortBy: undefined,
    });

    return { count };
  },

  async deleteProject(userId: string, id: string): Promise<void> {
    const deleted = await projectRepository.delete(id, userId);

    if (!deleted) {
      throw new NotFoundException("Project", id);
    }
  },

  async getSelectOptions(
    userId: string,
    query: ParsedSelectQuery,
  ): Promise<{ items: SelectNameItem[]; meta: PaginationMeta }> {
    const { items, total } = await projectRepository.findSelectOptions(
      userId,
      { q: query.q, includeArchived: query.includeArchived },
      { limit: query.limit, offset: query.offset },
    );

    return {
      items,
      meta: buildSelectMeta(total, query.page, query.limit),
    };
  },
};
