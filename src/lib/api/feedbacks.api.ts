import type {
  CreateFeedbackDTO,
  ListFeedbacksQueryDTO,
  UpdateFeedbackStatusDTO,
} from "@/server/modules/feedbacks/feedback.dto";
import type { FeedbackDTO } from "@/shared/types/feedback.types";
import { request, requestWithMeta } from "@/lib/api/api-core";

export const feedbacksApi = {
  list: (query?: ListFeedbacksQueryDTO) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<FeedbackDTO>(
      `/feedbacks${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  listAll: (query?: ListFeedbacksQueryDTO) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<FeedbackDTO>(
      `/support/staff/feedbacks${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  getById: (id: string) => request<FeedbackDTO>(`/feedbacks/${id}`),
  create: (data: CreateFeedbackDTO) =>
    request<FeedbackDTO>("/feedbacks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStatus: (id: string, data: UpdateFeedbackStatusDTO) =>
    request<FeedbackDTO>(`/feedbacks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<null>(`/feedbacks/${id}`, {
      method: "DELETE",
    }),
};
