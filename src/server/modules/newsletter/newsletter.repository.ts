import {
  and,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  lt,
  ne,
  notExists,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/server/db";
import {
  newsletterCampaign,
  newsletterCampaignSend,
  newsletterSubscriber,
} from "@/server/modules/newsletter/newsletter.entity";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";

type NewsletterSubscriberRow = typeof newsletterSubscriber.$inferSelect;
export type NewsletterCampaignRow = typeof newsletterCampaign.$inferSelect;

/** List query projection — excludes bodyAr/bodyEn for smaller responses. */
type NewsletterCampaignListItemRow = Omit<
  NewsletterCampaignRow,
  "bodyAr" | "bodyEn"
>;
type NewsletterCampaignSendRow = typeof newsletterCampaignSend.$inferSelect;

export const newsletterRepository = {
  async findSubscriberByEmail(
    email: string,
  ): Promise<NewsletterSubscriberRow | null> {
    const rows = await db
      .select()
      .from(newsletterSubscriber)
      .where(eq(newsletterSubscriber.email, email))
      .limit(1);
    return rows[0] ?? null;
  },

  async findSubscriberByToken(
    token: string,
  ): Promise<NewsletterSubscriberRow | null> {
    const rows = await db
      .select()
      .from(newsletterSubscriber)
      .where(eq(newsletterSubscriber.unsubscribeToken, token))
      .limit(1);
    return rows[0] ?? null;
  },

  async insertSubscriber(row: {
    id: string;
    email: string;
    locale: string | null;
    status: "active" | "unsubscribed";
    unsubscribeToken: string;
  }): Promise<void> {
    await db.insert(newsletterSubscriber).values({
      id: row.id,
      email: row.email,
      locale: row.locale,
      status: row.status,
      unsubscribeToken: row.unsubscribeToken,
    });
  },

  async updateSubscriberActiveResubscribe(
    id: string,
    locale: string | null,
    unsubscribeToken: string,
  ): Promise<void> {
    await db
      .update(newsletterSubscriber)
      .set({
        status: "active",
        locale,
        unsubscribeToken,
        unsubscribedAt: null,
      })
      .where(eq(newsletterSubscriber.id, id));
  },

  async setSubscriberUnsubscribed(id: string): Promise<void> {
    await db
      .update(newsletterSubscriber)
      .set({
        status: "unsubscribed",
        unsubscribedAt: new Date(),
      })
      .where(eq(newsletterSubscriber.id, id));
  },

  async updateSubscriberLocale(
    id: string,
    locale: string | null,
  ): Promise<void> {
    await db
      .update(newsletterSubscriber)
      .set({ locale })
      .where(eq(newsletterSubscriber.id, id));
  },

  async listSubscribers(
    pagination: ParsedPagination,
  ): Promise<{ items: NewsletterSubscriberRow[]; total: number }> {
    const [items, totalRow] = await Promise.all([
      db
        .select()
        .from(newsletterSubscriber)
        .orderBy(desc(newsletterSubscriber.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ c: count() })
        .from(newsletterSubscriber)
        .then((r) => r[0]?.c ?? 0),
    ]);

    return { items, total: Number(totalRow) };
  },

  async countActiveSubscribers(): Promise<number> {
    const row = await db
      .select({ c: count() })
      .from(newsletterSubscriber)
      .where(eq(newsletterSubscriber.status, "active"))
      .then((r) => r[0]?.c ?? 0);
    return Number(row);
  },

  async insertCampaign(row: {
    id: string;
    subjectAr: string;
    subjectEn: string;
    bodyAr: string;
    bodyEn: string;
    createdBy: string;
    coverImageUrl?: string | null;
    isWebsitePublic?: boolean;
    slug?: string | null;
    excerptAr?: string | null;
    excerptEn?: string | null;
  }): Promise<void> {
    await db.insert(newsletterCampaign).values({
      id: row.id,
      subjectAr: row.subjectAr,
      subjectEn: row.subjectEn,
      bodyAr: row.bodyAr,
      bodyEn: row.bodyEn,
      status: "draft",
      createdBy: row.createdBy,
      coverImageUrl: row.coverImageUrl ?? null,
      isWebsitePublic: row.isWebsitePublic ?? false,
      slug: row.slug ?? null,
      excerptAr: row.excerptAr ?? null,
      excerptEn: row.excerptEn ?? null,
    });
  },

  async findCampaignIdBySlug(
    slug: string,
    excludeId?: string,
  ): Promise<string | null> {
    const where =
      excludeId !== undefined
        ? and(
            eq(newsletterCampaign.slug, slug),
            ne(newsletterCampaign.id, excludeId),
          )
        : eq(newsletterCampaign.slug, slug);
    const rows = await db
      .select({ id: newsletterCampaign.id })
      .from(newsletterCampaign)
      .where(where)
      .limit(1);
    return rows[0]?.id ?? null;
  },

  async getCampaignById(id: string): Promise<NewsletterCampaignRow | null> {
    const rows = await db
      .select()
      .from(newsletterCampaign)
      .where(eq(newsletterCampaign.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async listCampaigns(pagination: ParsedPagination): Promise<{
    items: NewsletterCampaignListItemRow[];
    total: number;
  }> {
    const [items, totalRow] = await Promise.all([
      db
        .select({
          id: newsletterCampaign.id,
          subjectAr: newsletterCampaign.subjectAr,
          subjectEn: newsletterCampaign.subjectEn,
          status: newsletterCampaign.status,
          failureReason: newsletterCampaign.failureReason,
          createdBy: newsletterCampaign.createdBy,
          createdAt: newsletterCampaign.createdAt,
          startedAt: newsletterCampaign.startedAt,
          completedAt: newsletterCampaign.completedAt,
          coverImageUrl: newsletterCampaign.coverImageUrl,
          isWebsitePublic: newsletterCampaign.isWebsitePublic,
          slug: newsletterCampaign.slug,
          excerptAr: newsletterCampaign.excerptAr,
          excerptEn: newsletterCampaign.excerptEn,
          resumeGeneration: newsletterCampaign.resumeGeneration,
          sentCount: newsletterCampaign.sentCount,
          failedCount: newsletterCampaign.failedCount,
        })
        .from(newsletterCampaign)
        .orderBy(desc(newsletterCampaign.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ c: count() })
        .from(newsletterCampaign)
        .then((r) => r[0]?.c ?? 0),
    ]);
    return { items, total: Number(totalRow) };
  },

  /** Updates campaign content fields for any status (used after send for corrections / website channel). */
  async updateCampaignById(
    id: string,
    patch: {
      subjectAr?: string;
      subjectEn?: string;
      bodyAr?: string;
      bodyEn?: string;
      coverImageUrl?: string | null;
      isWebsitePublic?: boolean;
      slug?: string | null;
      excerptAr?: string | null;
      excerptEn?: string | null;
    },
  ): Promise<void> {
    await db
      .update(newsletterCampaign)
      .set(patch)
      .where(eq(newsletterCampaign.id, id));
  },

  /** Deletes the campaign row only when it is still a draft (send rows cascade). */
  async deleteCampaignIfDraft(id: string): Promise<boolean> {
    const removed = await db
      .delete(newsletterCampaign)
      .where(
        and(
          eq(newsletterCampaign.id, id),
          eq(newsletterCampaign.status, "draft"),
        ),
      )
      .returning({ id: newsletterCampaign.id });
    return removed.length > 0;
  },

  async markCampaignQueued(id: string): Promise<boolean> {
    const updated = await db
      .update(newsletterCampaign)
      .set({ status: "queued" })
      .where(
        and(
          eq(newsletterCampaign.id, id),
          eq(newsletterCampaign.status, "draft"),
        ),
      )
      .returning({ id: newsletterCampaign.id });
    return updated.length > 0;
  },

  async markCampaignSending(id: string): Promise<boolean> {
    const updated = await db
      .update(newsletterCampaign)
      .set({
        status: "sending",
        startedAt: new Date(),
      })
      .where(
        and(
          eq(newsletterCampaign.id, id),
          or(
            eq(newsletterCampaign.status, "draft"),
            eq(newsletterCampaign.status, "queued"),
          ),
        ),
      )
      .returning({ id: newsletterCampaign.id });
    return updated.length > 0;
  },

  async incrementCampaignResumeGeneration(id: string): Promise<number | null> {
    const updated = await db
      .update(newsletterCampaign)
      .set({
        resumeGeneration: sql`${newsletterCampaign.resumeGeneration} + 1`,
      })
      .where(
        and(
          eq(newsletterCampaign.id, id),
          eq(newsletterCampaign.status, "sending"),
        ),
      )
      .returning({ resumeGeneration: newsletterCampaign.resumeGeneration });
    return updated[0]?.resumeGeneration ?? null;
  },

  /** First webhook chunk: draft was already set to `queued` when the job was enqueued. */
  async tryMarkCampaignSendingWithStartedAt(id: string): Promise<void> {
    await db
      .update(newsletterCampaign)
      .set({
        status: "sending",
        startedAt: new Date(),
      })
      .where(
        and(
          eq(newsletterCampaign.id, id),
          eq(newsletterCampaign.status, "queued"),
        ),
      );
  },

  async markCampaignCompleted(id: string): Promise<void> {
    await db
      .update(newsletterCampaign)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(newsletterCampaign.id, id));
  },

  async markCampaignFailed(id: string, reason: string): Promise<void> {
    await db
      .update(newsletterCampaign)
      .set({
        status: "failed",
        failureReason: reason,
        completedAt: new Date(),
      })
      .where(eq(newsletterCampaign.id, id));
  },

  async countSendStatuses(campaignId: string): Promise<{
    sent: number;
    failed: number;
    pending: number;
  }> {
    const rows = await db
      .select({
        status: newsletterCampaignSend.status,
        c: count(),
      })
      .from(newsletterCampaignSend)
      .where(eq(newsletterCampaignSend.campaignId, campaignId))
      .groupBy(newsletterCampaignSend.status);

    const out = { sent: 0, failed: 0, pending: 0 };
    for (const r of rows) {
      const n = Number(r.c);
      if (r.status === "sent") out.sent = n;
      else if (r.status === "failed") out.failed = n;
      else if (r.status === "pending") out.pending = n;
    }
    return out;
  },

  async findStalePendingRecipients(
    campaignId: string,
    staleBefore: Date,
    limit: number,
  ): Promise<
    { send: NewsletterCampaignSendRow; subscriber: NewsletterSubscriberRow }[]
  > {
    return db
      .select({
        send: newsletterCampaignSend,
        subscriber: newsletterSubscriber,
      })
      .from(newsletterCampaignSend)
      .innerJoin(
        newsletterSubscriber,
        eq(newsletterCampaignSend.subscriberId, newsletterSubscriber.id),
      )
      .where(
        and(
          eq(newsletterCampaignSend.campaignId, campaignId),
          eq(newsletterCampaignSend.status, "pending"),
          lt(newsletterCampaignSend.createdAt, staleBefore),
          eq(newsletterSubscriber.status, "active"),
        ),
      )
      .limit(limit);
  },

  /**
   * Active subscribers with no send row yet for this campaign (first-time send queue).
   */
  async findSubscribersForNewSends(
    campaignId: string,
    cursorCreatedAt: Date | null,
    cursorId: string | null,
    limit: number,
  ): Promise<NewsletterSubscriberRow[]> {
    const noSendRow = notExists(
      db
        .select({ x: sql`1` })
        .from(newsletterCampaignSend)
        .where(
          and(
            eq(newsletterCampaignSend.campaignId, campaignId),
            eq(newsletterCampaignSend.subscriberId, newsletterSubscriber.id),
          ),
        ),
    );

    const cursorParts =
      cursorCreatedAt && cursorId
        ? [
            or(
              gt(newsletterSubscriber.createdAt, cursorCreatedAt),
              and(
                eq(newsletterSubscriber.createdAt, cursorCreatedAt),
                gt(newsletterSubscriber.id, cursorId),
              ),
            ),
          ]
        : [];

    return db
      .select()
      .from(newsletterSubscriber)
      .where(
        and(
          eq(newsletterSubscriber.status, "active"),
          noSendRow,
          ...cursorParts,
        ),
      )
      .orderBy(newsletterSubscriber.createdAt, newsletterSubscriber.id)
      .limit(limit);
  },

  async insertSendPending(input: {
    id: string;
    campaignId: string;
    subscriberId: string;
  }): Promise<boolean> {
    const inserted = await db
      .insert(newsletterCampaignSend)
      .values({
        id: input.id,
        campaignId: input.campaignId,
        subscriberId: input.subscriberId,
        status: "pending",
      })
      .onConflictDoNothing({
        target: [
          newsletterCampaignSend.campaignId,
          newsletterCampaignSend.subscriberId,
        ],
      })
      .returning({ id: newsletterCampaignSend.id });
    return inserted.length > 0;
  },

  async listWebsitePublicCampaignsForDashboard(
    pagination: ParsedPagination,
  ): Promise<{ items: NewsletterCampaignListItemRow[]; total: number }> {
    const sortExpr = sql`coalesce(${newsletterCampaign.startedAt}, ${newsletterCampaign.completedAt}, ${newsletterCampaign.createdAt})`;
    const whereClause = and(
      eq(newsletterCampaign.isWebsitePublic, true),
      eq(newsletterCampaign.status, "completed"),
      isNotNull(newsletterCampaign.slug),
    );
    const [items, totalRow] = await Promise.all([
      db
        .select({
          id: newsletterCampaign.id,
          subjectAr: newsletterCampaign.subjectAr,
          subjectEn: newsletterCampaign.subjectEn,
          status: newsletterCampaign.status,
          failureReason: newsletterCampaign.failureReason,
          createdBy: newsletterCampaign.createdBy,
          createdAt: newsletterCampaign.createdAt,
          startedAt: newsletterCampaign.startedAt,
          completedAt: newsletterCampaign.completedAt,
          coverImageUrl: newsletterCampaign.coverImageUrl,
          isWebsitePublic: newsletterCampaign.isWebsitePublic,
          slug: newsletterCampaign.slug,
          excerptAr: newsletterCampaign.excerptAr,
          excerptEn: newsletterCampaign.excerptEn,
          resumeGeneration: newsletterCampaign.resumeGeneration,
          sentCount: newsletterCampaign.sentCount,
          failedCount: newsletterCampaign.failedCount,
        })
        .from(newsletterCampaign)
        .where(whereClause)
        .orderBy(desc(sortExpr))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ c: count() })
        .from(newsletterCampaign)
        .where(whereClause)
        .then((r) => r[0]?.c ?? 0),
    ]);
    return { items, total: Number(totalRow) };
  },

  async getWebsitePublicCompletedBySlug(
    slug: string,
  ): Promise<NewsletterCampaignRow | null> {
    const rows = await db
      .select()
      .from(newsletterCampaign)
      .where(
        and(
          eq(newsletterCampaign.slug, slug.trim().toLowerCase()),
          eq(newsletterCampaign.isWebsitePublic, true),
          eq(newsletterCampaign.status, "completed"),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async updateSendResult(
    sendId: string,
    patch: {
      status: "sent" | "failed";
      resendMessageId?: string | null;
      error?: string | null;
    },
  ): Promise<void> {
    await db
      .update(newsletterCampaignSend)
      .set({
        status: patch.status,
        resendMessageId: patch.resendMessageId ?? null,
        error: patch.error ?? null,
        updatedAt: new Date(),
      })
      .where(eq(newsletterCampaignSend.id, sendId));
  },

  /**
   * True when every active subscriber has a terminal send row (sent or failed) for the campaign.
   */
  async isCampaignFullyDelivered(campaignId: string): Promise<boolean> {
    const activeCount = await this.countActiveSubscribers();
    if (activeCount === 0) {
      return true;
    }

    const terminalRow = await db
      .select({ c: count() })
      .from(newsletterCampaignSend)
      .innerJoin(
        newsletterSubscriber,
        eq(newsletterCampaignSend.subscriberId, newsletterSubscriber.id),
      )
      .where(
        and(
          eq(newsletterCampaignSend.campaignId, campaignId),
          eq(newsletterSubscriber.status, "active"),
          inArray(newsletterCampaignSend.status, ["sent", "failed"]),
        ),
      )
      .then((r) => Number(r[0]?.c ?? 0));

    return terminalRow >= activeCount;
  },
};
