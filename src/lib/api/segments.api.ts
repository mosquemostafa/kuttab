import type {
  CreateSegmentDTO,
  ListSegmentsQueryDTO,
  UpdateSegmentDTO,
} from "@/server/modules/segments/segment.dto";
import type { SegmentDTO } from "@/shared/types/segment.types";
import { request, requestWithMeta } from "@/lib/api/api-core";

export const segmentsApi = {
  list: (query?: ListSegmentsQueryDTO) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<SegmentDTO>(
      `/admin/segments${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  getById: (id: string) => request<SegmentDTO>(`/admin/segments/${id}`),
  create: (data: CreateSegmentDTO) =>
    request<SegmentDTO>("/admin/segments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateSegmentDTO) =>
    request<SegmentDTO>(`/admin/segments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<null>(`/admin/segments/${id}`, {
      method: "DELETE",
    }),
};
