import { apiFetch } from "@/lib/api/api-core";

export const authApi = {
  clearCookies: () =>
    apiFetch("/clear-cookies", {
      method: "POST",
    }),
};
