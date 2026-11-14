import { createId } from "@paralleldrive/cuid2";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "@/server/modules/users/user.entity";
import { supportTicket } from "@/server/modules/support-tickets/support-ticket.entity";

export const supportTicketMessage = pgTable(
  "support_ticket_messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => supportTicket.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("support_ticket_messages_ticket_id_idx").on(table.ticketId),
    index("support_ticket_messages_sender_id_idx").on(table.senderId),
    index("support_ticket_messages_created_at_idx").on(table.createdAt),
  ],
);
