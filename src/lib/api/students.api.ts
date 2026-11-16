import type {
  CreateStudentDTO,
  ListStudentsQueryDTO,
  UpdateStudentDTO,
} from "@/server/modules/students/student.dto";
import type { StudentDTO } from "@/shared/types/student.types";
import type { SelectNameItem, SelectQuery } from "@/shared/types/select.types";
import { request, requestWithMeta } from "@/lib/api/api-core";

export const studentsApi = {
  select: (query?: SelectQuery) => {
    const params = new URLSearchParams();
    if (query?.q) params.set("q", query.q);
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.includeArchived) params.set("includeArchived", "true");

    return requestWithMeta<SelectNameItem>(
      `/students/select${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  list: (query?: ListStudentsQueryDTO) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<StudentDTO>(
      `/students${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  getById: (id: string) => request<StudentDTO>(`/students/${id}`),
  create: (data: CreateStudentDTO) =>
    request<StudentDTO>("/students", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateStudentDTO) =>
    request<StudentDTO>(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<null>(`/students/${id}`, {
      method: "DELETE",
    }),
};
