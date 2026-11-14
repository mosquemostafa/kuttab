import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

import { user } from "@/server/modules/users/user.entity";

export const newsletterSubscriberStatusEnum = pgEnum(
  "newsletter_subscriber_status",
  ["active", "unsubscribed"],
);

export const newsletterCampaignStatusEnum = pgEnum(
  "newsletter_campaign_status",
  ["draft", "queued", "sending", "completed", "failed"],
);

export const newsletterCampaignSendStatusEnum = pgEnum(
  "newsletter_campaign_send_status",
  ["pending", "processing", "sent", "failed"],
);

export const newsletterSubscriber = pgTable(
  "newsletter_subscribers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text("email").notNull().unique(),
    locale: text("locale"),
    status: newsletterSubscriberStatusEnum("status").notNull(),
    unsubscribeToken: text("unsubscribe_token").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    unsubscribedAt: timestamp("unsubscribed_at"),
  },
  (table) => [
    index("newsletter_subscriber_created_at_idx").on(table.createdAt),
  ],
);

export const newsletterCampaign = pgTable(
  "newsletter_campaigns",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    subjectAr: text("subject_ar").notNull(),
    subjectEn: text("subject_en").notNull(),
    bodyAr: text("body_ar").notNull(),
    bodyEn: text("body_en").notNull(),
    status: newsletterCampaignStatusEnum("status").notNull(),
    failureReason: text("failure_reason"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    coverImageUrl: text("cover_image_url"),
    isWebsitePublic: boolean("is_website_public").notNull().default(false),
    slug: text("slug"),
    excerptAr: text("excerpt_ar"),
    excerptEn: text("excerpt_en"),
    resumeGeneration: integer("resume_generation").notNull().default(0),
    sentCount: integer("sent_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
  },
  (table) => [
    index("newsletter_campaign_status_idx").on(table.status),
    index("newsletter_campaign_created_by_idx").on(table.createdBy),
    index("newsletter_campaigns_public_list_idx").on(
      table.isWebsitePublic,
      table.status,
      table.startedAt,
    ),
    uniqueIndex("newsletter_campaigns_slug_unique")
      .on(table.slug)
      .where(sql`${table.slug} IS NOT NULL`),
  ],
);

export const newsletterCampaignSend = pgTable(
  "newsletter_campaign_sends",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => newsletterCampaign.id, { onDelete: "cascade" }),
    subscriberId: text("subscriber_id")
      .notNull()
      .references(() => newsletterSubscriber.id, { onDelete: "cascade" }),
    status: newsletterCampaignSendStatusEnum("status").notNull(),
    resendMessageId: text("resend_message_id"),
    error: text("error"),
    lockedUntil: timestamp("locked_until"),
    claimedBy: text("claimed_by"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("newsletter_campaign_send_campaign_subscriber_unique").on(
      table.campaignId,
      table.subscriberId,
    ),
    index("newsletter_campaign_send_campaign_id_idx").on(table.campaignId),
    index("newsletter_campaign_send_campaign_status_idx").on(
      table.campaignId,
      table.status,
    ),
    index("newsletter_campaign_send_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
  ],
);
