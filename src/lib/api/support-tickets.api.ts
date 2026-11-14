import type {
  CreateSupportTicketDTO,
  StaffCreateSupportTicketDTO,
  CreateSupportTicketMessageDTO,
  ListSupportTicketsQueryDTO,
  UpdateSupportTicketStatusDTO,
} from "@/server/modules/support-tickets/support-ticket.dto";
import type {
  SupportTicketDTO,
  SupportTicketMessageDTO,
} from "@/shared/types/support-ticket.types";
import { request, requestWithMeta } from "@/lib/api/api-core";

export const supportTicketsApi = {
  list: (query?: ListSupportTicketsQueryDTO) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<SupportTicketDTO>(
      `/support/tickets${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  listAll: (query?: ListSupportTicketsQueryDTO) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<SupportTicketDTO>(
      `/support/staff/tickets${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  getById: (id: string) => request<SupportTicketDTO>(`/support/tickets/${id}`),
  create: (data: CreateSupportTicketDTO) =>
    request<SupportTicketDTO>("/support/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createByStaff: (data: StaffCreateSupportTicketDTO) =>
    request<SupportTicketDTO>("/support/staff/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStatus: (id: string, data: UpdateSupportTicketStatusDTO) =>
    request<SupportTicketDTO>(`/support/tickets/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<null>(`/support/tickets/${id}`, {
      method: "DELETE",
    }),

  // Message methods
  listMessages: (ticketId: string) =>
    request<SupportTicketMessageDTO[]>(`/support/tickets/${ticketId}/messages`),

  sendMessage: (ticketId: string, data: CreateSupportTicketMessageDTO) =>
    request<SupportTicketMessageDTO>(`/support/tickets/${ticketId}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteMessage: (ticketId: string, messageId: string) =>
    request<null>(`/support/tickets/${ticketId}/messages/${messageId}`, {
      method: "DELETE",
    }),
};
