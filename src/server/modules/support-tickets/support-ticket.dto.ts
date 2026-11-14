import { z } from "zod";
import { TicketStatus } from "@/shared/enums/ticket-status.enum";

export const createSupportTicketSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(20000),
});

export const staffCreateSupportTicketSchema = z.object({
  targetUserId: z.string().trim().min(1),
  subject: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(20000),
});

export const listSupportTicketsQuerySchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const updateSupportTicketStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
});

export const createSupportTicketMessageSchema = z.object({
  content: z.string().trim().min(1).max(10000),
});

export type CreateSupportTicketDTO = z.infer<typeof createSupportTicketSchema>;
export type StaffCreateSupportTicketDTO = z.infer<
  typeof staffCreateSupportTicketSchema
>;
export type ListSupportTicketsQueryDTO = z.infer<
  typeof listSupportTicketsQuerySchema
>;
export type UpdateSupportTicketStatusDTO = z.infer<
  typeof updateSupportTicketStatusSchema
>;
export type CreateSupportTicketMessageDTO = z.infer<
  typeof createSupportTicketMessageSchema
>;
