import type { DashboardSettingsBootstrap } from "@/lib/api/api-server";
import { request, requestNoStore } from "@/lib/api/api-core";

export const dashboardSettingsApi = {
  getBootstrap: (): Promise<DashboardSettingsBootstrap> =>
    requestNoStore<DashboardSettingsBootstrap>("/dashboard/settings"),

  updateProfile: (data: { name: string; phone?: string }) =>
    request<{ updated: boolean }>("/dashboard/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ updated: boolean }>("/dashboard/settings/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  setPassword: (data: { newPassword: string }) =>
    request<{ updated: boolean }>("/dashboard/settings/set-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
