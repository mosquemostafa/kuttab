import { request } from "@/lib/api/api-core";

export const userApi = {
  deleteMyAccount: () =>
    request(`/user/me`, {
      method: "DELETE",
    }),
};
