import { db } from "@/server/db";
import { notification } from "@/server/modules/notifications/notification.entity";
import { and, count, desc, eq, inArray, lt, sql } from "drizzle-orm";

import type { NotificationCreatePayload } from "@/server/modules/notifications/notification.dto";

type NotificationRow = typeof notification.$inferSelect;

export const notificationRepository = {
  async insert(
    userId: string,
    input: NotificationCreatePayload,
  ): Promise<NotificationRow> {
    const [row] = await db
      .insert(notification)
      .values({
        userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        metadata: input.metadata ?? null,
        isRead: false,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to insert notification");
    }

    return row;
  },

  async insertMany(
    userIds: string[],
    input: NotificationCreatePayload,
  ): Promise<NotificationRow[]> {
    if (userIds.length === 0) {
      return [];
    }

    return db
      .insert(notification)
      .values(
        userIds.map((userId) => ({
          userId,
          type: input.type,
          title: input.title,
          message: input.message,
          link: input.link,
          metadata: input.metadata ?? null,
          isRead: false,
        })),
      )
      .returning();
  },

  async countUnread(userId: string): Promise<number> {
    const [row] = await db
      .select({ n: count() })
      .from(notification)
      .where(
        and(eq(notification.userId, userId), eq(notification.isRead, false)),
      );

    return Number(row?.n ?? 0);
  },

  async listForUser(
    userId: string,
    options: {
      unreadOnly: boolean;
      cursor?: Date;
      limit: number;
    },
  ): Promise<NotificationRow[]> {
    const conditions = [eq(notification.userId, userId)];
    if (options.unreadOnly) {
      conditions.push(eq(notification.isRead, false));
    }
    if (options.cursor !== undefined) {
      conditions.push(lt(notification.createdAt, options.cursor));
    }

    return db
      .select()
      .from(notification)
      .where(and(...conditions))
      .orderBy(desc(notification.createdAt))
      .limit(options.limit + 1);
  },

  async listReadForUser(
    userId: string,
    options: {
      cursor?: Date;
      limit: number;
    },
  ): Promise<NotificationRow[]> {
    const conditions = [
      eq(notification.userId, userId),
      eq(notification.isRead, true),
    ];
    if (options.cursor !== undefined) {
      conditions.push(lt(notification.createdAt, options.cursor));
    }

    return db
      .select()
      .from(notification)
      .where(and(...conditions))
      .orderBy(desc(notification.createdAt))
      .limit(options.limit + 1);
  },

  /**
   * Idempotent: returns true if the notification exists for this user (updated or already read).
   */
  async markOneRead(userId: string, id: string): Promise<boolean> {
    const updated = await db
      .update(notification)
      .set({ isRead: true })
      .where(and(eq(notification.id, id), eq(notification.userId, userId)))
      .returning({ id: notification.id });

    if (updated.length > 0) {
      return true;
    }

    const [existing] = await db
      .select({ id: notification.id })
      .from(notification)
      .where(and(eq(notification.id, id), eq(notification.userId, userId)))
      .limit(1);

    return existing !== undefined;
  },

  async markAllRead(userId: string): Promise<void> {
    await db
      .update(notification)
      .set({ isRead: true })
      .where(
        and(eq(notification.userId, userId), eq(notification.isRead, false)),
      );
  },

  async hasUnreadForTicket(userId: string, ticketId: string): Promise<boolean> {
    const [row] = await db
      .select({ id: notification.id })
      .from(notification)
      .where(
        and(
          eq(notification.userId, userId),
          eq(notification.isRead, false),
          eq(notification.type, "support_ticket"),
          sql`${notification.metadata} @> ${JSON.stringify({ ticketId })}::jsonb`,
        ),
      )
      .limit(1);

    return row !== undefined;
  },

  async findUserIdsWithUnreadTicket(
    userIds: string[],
    ticketId: string,
  ): Promise<Set<string>> {
    if (userIds.length === 0) {
      return new Set();
    }

    const rows = await db
      .select({ userId: notification.userId })
      .from(notification)
      .where(
        and(
          inArray(notification.userId, userIds),
          eq(notification.isRead, false),
          eq(notification.type, "support_ticket"),
          sql`${notification.metadata} @> ${JSON.stringify({ ticketId })}::jsonb`,
        ),
      );

    return new Set(rows.map((r) => r.userId));
  },
};
