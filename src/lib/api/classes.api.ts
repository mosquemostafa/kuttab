import type {
  CreateClassDTO,
  ListClassesQueryDTO,
  UpdateClassDTO,
} from "@/server/modules/classes/class.dto";
import type { ClassDTO } from "@/shared/types/class.types";
import type { SelectNameItem, SelectQuery } from "@/shared/types/select.types";
import { request, requestWithMeta } from "@/lib/api/api-core";

export const classesApi = {
  select: (query?: SelectQuery) => {
    const params = new URLSearchParams();
    if (query?.q) params.set("q", query.q);
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));

    return requestWithMeta<SelectNameItem>(
      `/classes/select${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  list: (query?: ListClassesQueryDTO) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<ClassDTO>(
      `/classes${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  getById: (id: string) => request<ClassDTO>(`/classes/${id}`),
  create: (data: CreateClassDTO) =>
    request<ClassDTO>("/classes", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateClassDTO) =>
    request<ClassDTO>(`/classes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<null>(`/classes/${id}`, {
      method: "DELETE",
    }),
};
