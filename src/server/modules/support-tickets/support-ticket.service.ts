import {
  ForbiddenException,
  NotFoundException,
} from "@/server/exceptions/exceptions";
import { appSettingsService } from "@/server/modules/app-settings/app-settings.service";
import {
  getSupportTicketReceivedEmailTemplate,
  sendEmail,
} from "@/server/lib/email";
import {
  supportTicketRepository,
  type SupportTicketMessageWithSender,
} from "@/server/modules/support-tickets/support-ticket.repository";
import { notificationService } from "@/server/modules/notifications/notification.service";
import { userRepository } from "@/server/modules/users/user.repository";
import type {
  CreateSupportTicketDTO,
  StaffCreateSupportTicketDTO,
  CreateSupportTicketMessageDTO,
  ListSupportTicketsQueryDTO,
} from "@/server/modules/support-tickets/support-ticket.dto";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import { TicketStatus } from "@/shared/enums/ticket-status.enum";
import { UserRole } from "@/shared/enums/user-role.enum";
import type { PaginatedResponse } from "@/shared/types/pagination.types";
import type {
  SupportTicketDTO,
  SupportTicketMessageDTO,
} from "@/shared/types/support-ticket.types";

type SupportTicketRow =
  Awaited<ReturnType<typeof supportTicketRepository.findById>> extends infer T
    ? NonNullable<T>
    : never;

function toDTO(ticket: SupportTicketRow): SupportTicketDTO {
  return {
    id: ticket.id,
    userId: ticket.userId,
    userEmail:
      "userEmail" in ticket
        ? ((ticket as SupportTicketRow & { userEmail?: string | null })
            .userEmail ?? null)
        : null,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status as TicketStatus,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

function toMessageDTO(
  message: SupportTicketMessageWithSender,
): SupportTicketMessageDTO {
  return {
    id: message.id,
    ticketId: message.ticketId,
    senderId: message.senderId,
    senderName: message.senderName,
    senderAvatar: message.senderAvatar,
    senderRole: message.senderRole,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}

function isSupportStaff(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPPORT;
}

export const supportTicketService = {
  async listMyTickets(
    userId: string,
    pagination: ParsedPagination,
    filters: Pick<ListSupportTicketsQueryDTO, "status" | "sortDirection">,
  ): Promise<PaginatedResponse<SupportTicketDTO>> {
    const result = await supportTicketRepository.findManyByUserId(
      userId,
      pagination,
      filters.status,
      filters.sortDirection,
    );

    return {
      items: result.tickets.map(toDTO),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit),
      },
    };
  },

  async listAllTickets(
    pagination: ParsedPagination,
    filters: Pick<ListSupportTicketsQueryDTO, "status" | "sortDirection">,
  ): Promise<PaginatedResponse<SupportTicketDTO>> {
    const result = await supportTicketRepository.findMany(
      pagination,
      filters.status,
      filters.sortDirection,
    );

    return {
      items: result.tickets.map(toDTO),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit),
      },
    };
  },

  async getTicketById(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<SupportTicketDTO> {
    const ticket = isSupportStaff(role)
      ? await supportTicketRepository.findByIdWithUser(id)
      : await supportTicketRepository.findByIdAndUserId(id, userId);

    if (!ticket) {
      throw new NotFoundException("Support ticket", id);
    }

    return toDTO(ticket);
  },

  async createTicket(
    userId: string,
    input: CreateSupportTicketDTO,
    locale?: string,
  ): Promise<SupportTicketDTO> {
    const created = await supportTicketRepository.create({
      userId,
      subject: input.subject,
      description: input.description,
    });

    // Ticket creation should succeed even if notification email fails.
    const [settings, profile] = await Promise.all([
      appSettingsService.getSettings(),
      userRepository.findProfileById(userId),
    ]);

    if (settings.sendSupportTicketConfirmationEmail && profile?.email) {
      const isArabic = locale === "ar";

      void sendEmail({
        to: profile.email,
        subject: isArabic
          ? `تم استلام تذكرة الدعم: ${created.subject}`
          : `Support ticket received: ${created.subject}`,
        text: isArabic
          ? `مرحبًا ${profile.name || "عزيزي المستخدم"},\n\nلقد استلمنا تذكرة الدعم الخاصة بك وسنعود إليك قريبًا.\n\nرقم التذكرة: ${created.id}\nالموضوع: ${created.subject}`
          : `Hi ${profile.name || "there"},\n\nWe received your support ticket and will get back to you soon.\n\nTicket ID: ${created.id}\nSubject: ${created.subject}`,
        html: getSupportTicketReceivedEmailTemplate({
          name: profile.name,
          ticketId: created.id,
          subject: created.subject,
          locale,
        }),
      });
    }

    // Notify support staff about the new ticket.
    void (async () => {
      try {
        const staffIds = await userRepository.findIdsByRoles([
          UserRole.ADMIN,
          UserRole.SUPPORT,
        ]);

        const isArabic = locale === "ar";
        await notificationService.createForUsers(staffIds, {
          type: "support_ticket",
          title: isArabic ? "تذكرة دعم جديدة" : "New support ticket",
          message: isArabic
            ? `تم استلام تذكرة دعم جديدة: ${created.subject}`
            : `A new support ticket was received: ${created.subject}`,
          link: `/support/tickets/${created.id}`,
          metadata: { ticketId: created.id, subject: created.subject },
        });
      } catch {
        // Notification dispatch must not affect ticket creation.
      }
    })();

    return toDTO(created);
  },

  async createTicketByStaff(
    input: StaffCreateSupportTicketDTO,
    locale?: string,
  ): Promise<SupportTicketDTO> {
    const targetUser = await userRepository.findProfileById(input.targetUserId);
    if (!targetUser) {
      throw new NotFoundException("User", input.targetUserId);
    }

    const created = await supportTicketRepository.create({
      userId: input.targetUserId,
      subject: input.subject,
      description: input.description,
    });

    // Notify the target user about the new ticket initiated by support staff
    void (async () => {
      try {
        const isArabic = locale === "ar";
        await notificationService.createForUser(input.targetUserId, {
          type: "support_ticket",
          title: isArabic
            ? "محادثة جديدة من الدعم"
            : "New support conversation",
          message: isArabic
            ? `قام فريق الدعم ببدء محادثة معك: ${created.subject}`
            : `Support team started a conversation with you: ${created.subject}`,
          link: `/dashboard/support/${created.id}`,
          metadata: { ticketId: created.id, subject: created.subject },
        });
      } catch {
        // Notification failure should not block ticket creation
      }
    })();

    return toDTO(created);
  },

  async updateTicketStatus(
    id: string,
    role: UserRole,
    status: TicketStatus,
    userId?: string,
  ): Promise<SupportTicketDTO> {
    const isStaff = isSupportStaff(role);

    // If regular user, verify ticket ownership
    if (!isStaff) {
      if (!userId) {
        throw new ForbiddenException();
      }
      const ticket = await supportTicketRepository.findByIdAndUserId(
        id,
        userId,
      );
      if (!ticket) {
        throw new NotFoundException("Support ticket", id);
      }
    }

    const updated = await supportTicketRepository.updateStatus(id, status);

    if (!updated) {
      throw new NotFoundException("Support ticket", id);
    }

    return toDTO(updated);
  },

  async deleteTicket(id: string, role: UserRole): Promise<void> {
    if (!isSupportStaff(role)) {
      throw new ForbiddenException();
    }

    const deleted = await supportTicketRepository.delete(id);

    if (!deleted) {
      throw new NotFoundException("Support ticket", id);
    }
  },

  // Message methods
  async listTicketMessages(
    ticketId: string,
    userId: string,
    role: UserRole,
  ): Promise<SupportTicketMessageDTO[]> {
    const ticket = isSupportStaff(role)
      ? await supportTicketRepository.findById(ticketId)
      : await supportTicketRepository.findByIdAndUserId(ticketId, userId);

    if (!ticket) {
      throw new NotFoundException("Support ticket", ticketId);
    }

    const messages =
      await supportTicketRepository.findMessagesByTicketId(ticketId);
    return messages.map(toMessageDTO);
  },

  async addTicketMessage(
    ticketId: string,
    userId: string,
    role: UserRole,
    input: CreateSupportTicketMessageDTO,
    locale?: string,
  ): Promise<SupportTicketMessageDTO> {
    const isStaff = isSupportStaff(role);
    const ticket = isStaff
      ? await supportTicketRepository.findById(ticketId)
      : await supportTicketRepository.findByIdAndUserId(ticketId, userId);

    if (!ticket) {
      throw new NotFoundException("Support ticket", ticketId);
    }

    const created = await supportTicketRepository.createMessage({
      ticketId,
      senderId: userId,
      content: input.content,
    });

    // If user sent a message on a resolved/closed ticket, automatically reopen it
    if (!isStaff && ticket.status !== TicketStatus.OPEN) {
      await supportTicketRepository.updateStatus(ticketId, TicketStatus.OPEN);
    } else {
      await supportTicketRepository.touchUpdatedAt(ticketId);
    }

    // Trigger in-app notifications (only if recipient does not already have an unread notification for this ticket)
    void (async () => {
      try {
        const isArabic = locale === "ar";
        if (isStaff) {
          // Check if ticket owner already has an unread notification for this ticket
          const alreadyNotified = await notificationService.hasUnreadForTicket(
            ticket.userId,
            ticket.id,
          );
          if (!alreadyNotified) {
            await notificationService.createForUser(ticket.userId, {
              type: "support_ticket",
              title: isArabic ? "رد جديد من الدعم" : "New reply from support",
              message: isArabic
                ? `قام فريق الدعم بالرد على تذكرتك: ${ticket.subject}`
                : `Support team replied to your ticket: ${ticket.subject}`,
              link: `/dashboard/support/${ticket.id}`,
              metadata: { ticketId: ticket.id, subject: ticket.subject },
            });
          }
        } else {
          // User sent a message -> notify support staff who don't already have an unread notification for this ticket
          const allStaffIds = await userRepository.findIdsByRoles([
            UserRole.ADMIN,
            UserRole.SUPPORT,
          ]);

          const alreadyNotifiedStaffIds =
            await notificationService.findUserIdsWithUnreadTicket(
              allStaffIds,
              ticket.id,
            );

          const pendingStaffIds = allStaffIds.filter(
            (id) => !alreadyNotifiedStaffIds.has(id),
          );

          if (pendingStaffIds.length > 0) {
            await notificationService.createForUsers(pendingStaffIds, {
              type: "support_ticket",
              title: isArabic
                ? "رسالة جديدة على تذكرة دعم"
                : "New ticket message",
              message: isArabic
                ? `رسالة جديدة من المستخدم على التذكرة: ${ticket.subject}`
                : `New user message on ticket: ${ticket.subject}`,
              link: `/support/tickets/${ticket.id}`,
              metadata: { ticketId: ticket.id, subject: ticket.subject },
            });
          }
        }
      } catch {
        // Notification failure should not block message creation
      }
    })();

    // Retrieve sender details to return full DTO
    const sender = await userRepository.findProfileById(userId);
    return {
      id: created.id,
      ticketId: created.ticketId,
      senderId: created.senderId,
      senderName: sender?.name ?? null,
      senderAvatar: sender?.image ?? null,
      senderRole: role,
      content: created.content,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  },

  async deleteTicketMessage(
    ticketId: string,
    messageId: string,
    userId: string,
    role: UserRole,
  ): Promise<void> {
    if (!isSupportStaff(role)) {
      throw new ForbiddenException();
    }

    const message = await supportTicketRepository.findMessageById(messageId);
    if (!message || message.ticketId !== ticketId) {
      throw new NotFoundException("Message", messageId);
    }

    // Admins and Support members can delete messages they sent
    if (message.senderId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException("You can only delete messages you sent");
    }

    await supportTicketRepository.deleteMessage(messageId);
  },
};
