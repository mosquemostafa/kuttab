import type {
  CreateTeacherDTO,
  ListTeachersQueryDTO,
  UpdateTeacherDTO,
} from "@/server/modules/teachers/teacher.dto";
import type { TeacherDTO } from "@/shared/types/teacher.types";
import type { SelectNameItem, SelectQuery } from "@/shared/types/select.types";
import { request, requestWithMeta } from "@/lib/api/api-core";

export const teachersApi = {
  select: (query?: SelectQuery) => {
    const params = new URLSearchParams();
    if (query?.q) params.set("q", query.q);
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.includeArchived) params.set("includeArchived", "true");

    return requestWithMeta<SelectNameItem>(
      `/teachers/select${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  list: (query?: ListTeachersQueryDTO) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<TeacherDTO>(
      `/teachers${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  getById: (id: string) => request<TeacherDTO>(`/teachers/${id}`),
  create: (data: CreateTeacherDTO) =>
    request<TeacherDTO>("/teachers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateTeacherDTO) =>
    request<TeacherDTO>(`/teachers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<null>(`/teachers/${id}`, {
      method: "DELETE",
    }),
};
