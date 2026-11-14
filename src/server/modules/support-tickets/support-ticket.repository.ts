import { createId } from "@paralleldrive/cuid2";
import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { supportTicket } from "@/server/modules/support-tickets/support-ticket.entity";
import { supportTicketMessage } from "@/server/modules/support-tickets/support-ticket-message.entity";
import { user } from "@/server/modules/users/user.entity";
import { TicketStatus } from "@/shared/enums/ticket-status.enum";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";

type SupportTicketRow = typeof supportTicket.$inferSelect;
type SupportTicketListRow = SupportTicketRow & {
  userEmail: string | null;
};
type SupportTicketMessageRow = typeof supportTicketMessage.$inferSelect;
export type SupportTicketMessageWithSender = SupportTicketMessageRow & {
  senderName: string | null;
  senderAvatar: string | null;
  senderRole: string;
};
type SortDirection = "asc" | "desc";

const supportTicketListSelection = {
  id: supportTicket.id,
  userId: supportTicket.userId,
  subject: supportTicket.subject,
  description: supportTicket.description,
  status: supportTicket.status,
  createdAt: supportTicket.createdAt,
  updatedAt: supportTicket.updatedAt,
  userEmail: user.email,
};

function toStatusClause(status?: TicketStatus) {
  if (!status) return undefined;
  return eq(supportTicket.status, status);
}

export const supportTicketRepository = {
  async findManyByUserId(
    userId: string,
    pagination: ParsedPagination,
    status?: TicketStatus,
    sortDirection: SortDirection = "desc",
  ): Promise<{ tickets: SupportTicketListRow[]; total: number }> {
    const where = and(eq(supportTicket.userId, userId), toStatusClause(status));
    const createdAtOrder =
      sortDirection === "asc"
        ? asc(supportTicket.createdAt)
        : desc(supportTicket.createdAt);

    const [tickets, totalRows] = await Promise.all([
      db
        .select(supportTicketListSelection)
        .from(supportTicket)
        .leftJoin(user, eq(supportTicket.userId, user.id))
        .where(where)
        .orderBy(createdAtOrder)
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(supportTicket)
        .where(where),
    ]);

    return {
      tickets,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  async findMany(
    pagination: ParsedPagination,
    status?: TicketStatus,
    sortDirection: SortDirection = "desc",
  ): Promise<{ tickets: SupportTicketListRow[]; total: number }> {
    const where = toStatusClause(status);
    const createdAtOrder =
      sortDirection === "asc"
        ? asc(supportTicket.createdAt)
        : desc(supportTicket.createdAt);

    const [tickets, totalRows] = await Promise.all([
      db
        .select(supportTicketListSelection)
        .from(supportTicket)
        .leftJoin(user, eq(supportTicket.userId, user.id))
        .where(where)
        .orderBy(createdAtOrder)
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(supportTicket)
        .where(where),
    ]);

    return {
      tickets,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  async findById(id: string): Promise<SupportTicketRow | null> {
    const [row] = await db
      .select()
      .from(supportTicket)
      .where(eq(supportTicket.id, id))
      .limit(1);

    return row ?? null;
  },

  async findByIdWithUser(id: string): Promise<SupportTicketListRow | null> {
    const [row] = await db
      .select(supportTicketListSelection)
      .from(supportTicket)
      .leftJoin(user, eq(supportTicket.userId, user.id))
      .where(eq(supportTicket.id, id))
      .limit(1);

    return row ?? null;
  },

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<SupportTicketRow | null> {
    const [row] = await db
      .select()
      .from(supportTicket)
      .where(and(eq(supportTicket.id, id), eq(supportTicket.userId, userId)))
      .limit(1);

    return row ?? null;
  },

  async create(data: {
    userId: string;
    subject: string;
    description: string;
  }): Promise<SupportTicketRow> {
    const [created] = await db
      .insert(supportTicket)
      .values({
        id: createId(),
        userId: data.userId,
        subject: data.subject,
        description: data.description,
        status: TicketStatus.OPEN,
      })
      .returning();

    return created;
  },

  async updateStatus(
    id: string,
    status: TicketStatus,
  ): Promise<SupportTicketRow | null> {
    const [updated] = await db
      .update(supportTicket)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(supportTicket.id, id))
      .returning();

    return updated ?? null;
  },

  async touchUpdatedAt(id: string): Promise<void> {
    await db
      .update(supportTicket)
      .set({ updatedAt: new Date() })
      .where(eq(supportTicket.id, id));
  },

  async delete(id: string): Promise<boolean> {
    const deleted = await db
      .delete(supportTicket)
      .where(eq(supportTicket.id, id))
      .returning({ id: supportTicket.id });

    return deleted.length > 0;
  },

  // Message methods
  async findMessagesByTicketId(
    ticketId: string,
  ): Promise<SupportTicketMessageWithSender[]> {
    const rows = await db
      .select({
        id: supportTicketMessage.id,
        ticketId: supportTicketMessage.ticketId,
        senderId: supportTicketMessage.senderId,
        content: supportTicketMessage.content,
        createdAt: supportTicketMessage.createdAt,
        updatedAt: supportTicketMessage.updatedAt,
        senderName: user.name,
        senderAvatar: user.image,
        senderRole: user.role,
      })
      .from(supportTicketMessage)
      .leftJoin(user, eq(supportTicketMessage.senderId, user.id))
      .where(eq(supportTicketMessage.ticketId, ticketId))
      .orderBy(asc(supportTicketMessage.createdAt));

    return rows.map((r) => ({
      ...r,
      senderRole: r.senderRole ?? "user",
    }));
  },

  async findMessageById(
    messageId: string,
  ): Promise<SupportTicketMessageRow | null> {
    const [row] = await db
      .select()
      .from(supportTicketMessage)
      .where(eq(supportTicketMessage.id, messageId))
      .limit(1);

    return row ?? null;
  },

  async createMessage(data: {
    ticketId: string;
    senderId: string;
    content: string;
  }): Promise<SupportTicketMessageRow> {
    const [created] = await db
      .insert(supportTicketMessage)
      .values({
        id: createId(),
        ticketId: data.ticketId,
        senderId: data.senderId,
        content: data.content,
      })
      .returning();

    return created;
  },

  async deleteMessage(messageId: string): Promise<boolean> {
    const deleted = await db
      .delete(supportTicketMessage)
      .where(eq(supportTicketMessage.id, messageId))
      .returning({ id: supportTicketMessage.id });

    return deleted.length > 0;
  },
};
