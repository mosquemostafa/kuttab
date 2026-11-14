import { request } from "@/lib/api/api-core";
import type { ContactDTO } from "@/server/modules/contact/contact.dto";

export const contactApi = {
  send: (data: ContactDTO) =>
    request<{ sent: boolean }>("/contact", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
