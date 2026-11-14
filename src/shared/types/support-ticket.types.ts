import type { TicketStatus } from "@/shared/enums/ticket-status.enum";

export interface SupportTicketDTO {
  id: string;
  userId: string;
  userEmail?: string | null;
  subject: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketMessageDTO {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string | null;
  senderAvatar: string | null;
  senderRole: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
