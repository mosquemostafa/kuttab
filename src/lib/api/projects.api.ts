import type {
  CreateProjectBody,
  ListProjectsQueryDTO,
  UpdateProjectDTO,
} from "@/server/modules/projects/project.dto";
import type { ProjectDTO } from "@/shared/types/project.types";
import type { SelectNameItem, SelectQuery } from "@/shared/types/select.types";
import { request, requestWithMeta } from "@/lib/api/api-core";

export const projectsApi = {
  select: (query?: SelectQuery) => {
    const params = new URLSearchParams();
    if (query?.q) params.set("q", query.q);
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.includeArchived) params.set("includeArchived", "true");

    return requestWithMeta<SelectNameItem>(
      `/projects/select${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  list: (query?: ListProjectsQueryDTO) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<ProjectDTO>(
      `/projects${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  getById: (id: string) => request<ProjectDTO>(`/projects/${id}`),
  counts: (query?: { q?: string; isArchived?: boolean }) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return request<{ count: number }>(
      `/projects/counts${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  analytics: (query?: { projectId?: string }) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return request<{
      todos: number;
      notes: number;
      resources: number;
      total: number;
    }>(`/projects/analytics${params.size ? `?${params.toString()}` : ""}`);
  },
  create: (data: CreateProjectBody) =>
    request<ProjectDTO>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateProjectDTO) =>
    request<ProjectDTO>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  archive: (id: string) =>
    request<ProjectDTO>(`/projects/${id}/archive`, {
      method: "PATCH",
    }),
  unarchive: (id: string) =>
    request<ProjectDTO>(`/projects/${id}/unarchive`, {
      method: "PATCH",
    }),
  delete: (id: string) =>
    request<null>(`/projects/${id}`, {
      method: "DELETE",
    }),
};
