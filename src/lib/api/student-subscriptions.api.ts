import { request, requestWithMeta } from "@/lib/api/api-core";
import type {
  CreateStudentSubscriptionDTO,
  ListStudentSubscriptionsQueryDTO,
  UpdateStudentSubscriptionDTO,
} from "@/server/modules/student-subscriptions/student-subscription.dto";
import type { StudentSubscriptionDTO } from "@/shared/types/student-subscription.types";

export const studentSubscriptionsApi = {
  list: (query?: ListStudentSubscriptionsQueryDTO) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<StudentSubscriptionDTO>(
      `/student-subscriptions${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  getById: (id: string) =>
    request<StudentSubscriptionDTO>(`/student-subscriptions/${id}`),
  create: (data: CreateStudentSubscriptionDTO) =>
    request<StudentSubscriptionDTO>("/student-subscriptions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateStudentSubscriptionDTO) =>
    request<StudentSubscriptionDTO>(`/student-subscriptions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<null>(`/student-subscriptions/${id}`, {
      method: "DELETE",
    }),
};
