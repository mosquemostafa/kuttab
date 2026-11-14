import { apiFetch } from "@/lib/api/api-core";

export const authApi = {
  linkSocial: async (payload: {
    provider: "google" | "github";
    callbackURL: string;
    errorCallbackURL: string;
    disableRedirect: boolean;
  }) => {
    const response = await apiFetch("/auth/link-social", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const rawResult = (await response.json().catch(() => ({}))) as {
      url?: string;
      message?: string;
    };
    return {
      success: response.ok,
      url: rawResult.url,
      reason: rawResult.message ?? null,
    };
  },
  clearCookies: () =>
    apiFetch("/clear-cookies", {
      method: "POST",
    }),
};
