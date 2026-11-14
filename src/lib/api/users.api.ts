import type { ListUsersQueryDTO } from "@/server/modules/users/dto/list-users.dto";
import type { UserRole } from "@/shared/enums/user-role.enum";
import type { UserWithDetailsDTO } from "@/shared/types/user.types";
import { request, requestNoStore, requestWithMeta } from "@/lib/api/api-core";

export const usersApi = {
  list: (query?: ListUsersQueryDTO) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<UserWithDetailsDTO>(
      `/admin/users${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  getById: (userId: string) =>
    requestNoStore<UserWithDetailsDTO>(`/admin/users/${userId}`),
  ban: (userId: string, banReason: string, banExpiresIn?: number) =>
    request(`/admin/users/${userId}/ban`, {
      method: "PATCH",
      body: JSON.stringify({ banReason, banExpiresIn }),
    }),
  unban: (userId: string) =>
    request(`/admin/users/${userId}/unban`, {
      method: "PATCH",
    }),
  remove: (userId: string) =>
    request(`/admin/users/${userId}`, {
      method: "DELETE",
    }),
  revokeSessions: (userId: string) =>
    request(`/admin/users/${userId}/revoke-sessions`, {
      method: "POST",
    }),
  updateRole: (userId: string, role: UserRole) =>
    request(`/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  updateSegment: (userId: string, segmentId: string | null) =>
    request(`/admin/users/${userId}/segment`, {
      method: "PATCH",
      body: JSON.stringify({ segmentId }),
    }),
  create: async (data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    data?: Record<string, unknown>;
    autoVerify?: boolean;
  }) =>
    request(`/admin/users`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
