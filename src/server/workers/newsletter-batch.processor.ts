import { type Job, Worker, UnrecoverableError } from "bullmq";
import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/server/db";
import {
  newsletterCampaign,
  newsletterSubscriber,
} from "@/server/modules/newsletter/newsletter.entity";
import { newsletterRepository } from "@/server/modules/newsletter/newsletter.repository";
import {
  buildCampaignEmailHtml,
  buildUnsubscribeUrl,
  localizedCampaignField,
  renderNewsletterBodyToHtml,
  resolveFooterLocale,
} from "@/server/modules/newsletter/newsletter-render.helper";
import { env } from "@/server/lib/env";
import {
  type NewsletterBatchRecipient,
  sendNewsletterBatchEmail,
} from "@/server/lib/resend";
import { getNewsletterQueue } from "@/server/queues/newsletter.queue";
import {
  DEFAULT_JOB_OPTIONS,
  type NewsletterBatchJobData,
  type NewsletterPlannerJobData,
} from "@/server/queues/newsletter.types";

/**
 * Fans out batch jobs (100 subscribers per job) in the background via keyset pagination.
 * This runs inside the worker process so the web HTTP request returns immediately.
 */
export async function handlePlannerJob(job: Job<NewsletterPlannerJobData>) {
  const { campaignId, resumeGeneration } = job.data;
  const queue = getNewsletterQueue();
  const BATCH_SIZE = 100;
  let batchNumber = 0;
  let lastId = "";

  console.info("[newsletter:planner] Starting planner fan-out", {
    campaignId,
    resumeGeneration,
  });

  // 1. Bulk pre-populate pending send records for all active subscribers upfront
  // This guarantees:
  // - Real-time pending counter visibility in the UI
  // - Multi-batch campaigns will never prematurely complete on Batch 0
  await db.execute(sql`
    INSERT INTO newsletter_campaign_sends (
      id, campaign_id, subscriber_id, status, created_at, updated_at
    )
    SELECT
      gen_random_uuid(),
      ${campaignId},
      s.id,
      'pending',
      NOW(),
      NOW()
    FROM newsletter_subscribers s
    WHERE s.status = 'active'
    ON CONFLICT (campaign_id, subscriber_id) DO NOTHING;
  `);

  while (true) {
    // Keyset pagination: finds eligible pending or expired-lease rows
    const result = await db.execute<{ id: string }>(sql`
      SELECT cs.subscriber_id AS id
      FROM newsletter_campaign_sends cs
      WHERE cs.campaign_id = ${campaignId}
        AND cs.subscriber_id > ${lastId}
        AND (
          cs.status = 'pending'
          OR (cs.status = 'processing' AND cs.locked_until < NOW())
        )
      ORDER BY cs.subscriber_id
      LIMIT ${BATCH_SIZE}
    `);

    const rows = result.rows;
    if (!rows || rows.length === 0) {
      break;
    }

    const subscriberIds = rows.map((r) => r.id);
    lastId = subscriberIds[subscriberIds.length - 1];

    const jobId = `campaign_${campaignId}_gen_${resumeGeneration}_b_${batchNumber}`;
    await queue.add(
      "send-batch",
      {
        type: "batch",
        campaignId,
        batchNumber,
        resumeGeneration,
        subscriberIds,
      },
      {
        ...DEFAULT_JOB_OPTIONS,
        jobId,
      },
    );

    batchNumber++;
  }

  console.info("[newsletter:planner] Fan-out complete", {
    campaignId,
    totalBatches: batchNumber,
  });

  if (batchNumber === 0) {
    console.info(
      "[newsletter:planner] No active subscribers found, completing campaign immediately",
      { campaignId },
    );
    await checkAndMarkCampaignCompletion(campaignId);
  }
}

/**
 * Processes a single batch of up to 100 subscribers:
 * 1. Atomically claims records in PostgreSQL using UPSERT with lease expiration.
 * 2. Fetches fresh subscriber records and renders personalized bodies.
 * 3. Delivers via Resend's batch.send API with deterministic Idempotency-Key.
 * 4. Handles 429 rate limits using BullMQ's worker.rateLimit().
 * 5. Updates delivery status and campaign counters atomically.
 * 6. Checks for campaign completion.
 */
export async function processNewsletterBatch(
  job: Job<NewsletterBatchJobData>,
  worker: Worker,
) {
  const { campaignId, subscriberIds } = job.data;
  const claimedBy = `${job.id}_att_${job.attemptsMade}`;

  // 1. ATOMIC UPSERT CLAIM
  // Covers: subscribers with no send row, pending rows, self-retries, and expired leases
  const claimedResult = await db.execute<{ subscriber_id: string }>(sql`
    INSERT INTO newsletter_campaign_sends (
      id, campaign_id, subscriber_id, status, locked_until, claimed_by, created_at, updated_at
    )
    SELECT
      gen_random_uuid(),
      ${campaignId},
      s.id,
      'processing',
      NOW() + INTERVAL '2 minutes',
      ${claimedBy},
      NOW(),
      NOW()
    FROM newsletter_subscribers s
    WHERE s.id IN ${subscriberIds}
    ON CONFLICT (campaign_id, subscriber_id) DO UPDATE
    SET status = 'processing',
        locked_until = NOW() + INTERVAL '2 minutes',
        claimed_by = ${claimedBy},
        updated_at = NOW()
    WHERE newsletter_campaign_sends.status = 'pending'
       OR (
         newsletter_campaign_sends.status = 'processing'
         AND (
           newsletter_campaign_sends.locked_until < NOW()
           OR newsletter_campaign_sends.claimed_by = ${claimedBy}
         )
       )
    RETURNING subscriber_id;
  `);

  const eligibleIds = claimedResult.rows.map((r) => r.subscriber_id);
  if (eligibleIds.length === 0) {
    console.info(
      "[newsletter:worker] Batch skipped (already claimed or sent)",
      {
        jobId: job.id,
        campaignId,
      },
    );
    return { sent: 0, skipped: subscriberIds.length };
  }

  try {
    // 2. Fetch fresh subscriber information
    const recipients = await db
      .select()
      .from(newsletterSubscriber)
      .where(
        and(
          inArray(newsletterSubscriber.id, eligibleIds),
          eq(newsletterSubscriber.status, "active"),
        ),
      );

    // Finalize any subscribers who unsubscribed between planner run and batch dispatch
    const activeIdSet = new Set(recipients.map((r) => r.id));
    const inactiveIds = eligibleIds.filter((id) => !activeIdSet.has(id));
    if (inactiveIds.length > 0) {
      await db.execute(sql`
        UPDATE newsletter_campaign_sends
        SET status = 'failed',
            error = 'Subscriber unsubscribed before delivery',
            locked_until = NULL,
            claimed_by = NULL,
            updated_at = NOW()
        WHERE campaign_id = ${campaignId}
          AND subscriber_id IN ${inactiveIds}
      `);
    }

    if (recipients.length === 0) {
      if (inactiveIds.length > 0) {
        await db.execute(sql`
          UPDATE newsletter_campaigns
          SET failed_count = failed_count + ${inactiveIds.length}
          WHERE id = ${campaignId}
        `);
      }
      await checkAndMarkCampaignCompletion(campaignId);
      return { sent: 0, failed: inactiveIds.length, skipped: 0 };
    }

    const campaign = await newsletterRepository.getCampaignById(campaignId);
    if (!campaign) {
      throw new UnrecoverableError(`Campaign ${campaignId} missing`);
    }

    if (campaign.status === "completed" || campaign.status === "failed") {
      console.info("[newsletter:worker] Campaign already terminated", {
        campaignId,
        status: campaign.status,
      });
      return { sent: 0, skipped: eligibleIds.length };
    }

    // 3. Prepare Batch Payload
    const emailPayloads: NewsletterBatchRecipient[] = recipients.map((sub) => {
      const locale = resolveFooterLocale(sub.locale);
      const subject = localizedCampaignField(
        sub.locale,
        campaign.subjectAr,
        campaign.subjectEn,
      );
      const body = localizedCampaignField(
        sub.locale,
        campaign.bodyAr,
        campaign.bodyEn,
      );
      const innerHtml = renderNewsletterBodyToHtml(body, sub.locale);
      const html = buildCampaignEmailHtml({
        bodyHtml: innerHtml,
        subject,
        locale: sub.locale,
        token: sub.unsubscribeToken,
        coverImageUrl: campaign.coverImageUrl,
      });
      const listUnsubscribe = `<${buildUnsubscribeUrl(env.NEXT_PUBLIC_APP_URL, locale, sub.unsubscribeToken)}>`;

      return {
        subscriberId: sub.id,
        to: sub.email,
        subject,
        html,
        listUnsubscribe,
      };
    });

    // 4. Send via Resend with Idempotency Key
    const batchIdempotencyKey = `camp_${campaignId}_job_${job.id}_att_${job.attemptsMade}`;
    const resendResult = await sendNewsletterBatchEmail(emailPayloads, {
      idempotencyKey: batchIdempotencyKey,
    });

    if (resendResult.rateLimited) {
      // BullMQ rate-limiting pattern: pauses the queue without burning attempts
      const delayMs = (resendResult.retryAfterSec || 5) * 1000;
      console.warn(
        "[newsletter:worker] Rate limited by Resend, delaying queue",
        {
          delayMs,
          jobId: job.id,
        },
      );
      await worker.rateLimit(delayMs);
      throw Worker.RateLimitError();
    }

    if (!resendResult.ok) {
      throw new Error(`Resend batch delivery failed: ${resendResult.error}`);
    }

    // 5. Batch Finalize in Database
    await db.transaction(async (tx) => {
      for (const res of resendResult.items) {
        await tx.execute(sql`
          UPDATE newsletter_campaign_sends
          SET status = ${res.ok ? "sent" : "failed"},
              resend_message_id = ${res.ok ? res.id : null},
              error = ${res.ok ? null : res.error},
              locked_until = NULL,
              claimed_by = NULL,
              updated_at = NOW()
          WHERE campaign_id = ${campaignId} AND subscriber_id = ${res.subscriberId}
        `);
      }

      // Atomic SQL counter increments
      await tx.execute(sql`
        UPDATE newsletter_campaigns
        SET sent_count = sent_count + ${resendResult.successCount},
            failed_count = failed_count + ${resendResult.failCount + inactiveIds.length}
        WHERE id = ${campaignId}
      `);
    });

    // 6. Check for Campaign Completion
    await checkAndMarkCampaignCompletion(campaignId);

    return {
      sent: resendResult.successCount,
      failed: resendResult.failCount,
      skipped: subscriberIds.length - eligibleIds.length,
    };
  } catch (error) {
    // Release claimed rows back to 'pending' on transient failures
    // (RateLimitError and network errors shouldn't leave rows locked for 2 minutes)
    if (eligibleIds.length > 0) {
      await db.execute(sql`
        UPDATE newsletter_campaign_sends
        SET status = 'pending',
            locked_until = NULL,
            claimed_by = NULL,
            updated_at = NOW()
        WHERE campaign_id = ${campaignId}
          AND subscriber_id IN ${eligibleIds}
          AND status = 'processing'
          AND claimed_by = ${claimedBy}
      `);
    }
    throw error;
  }
}

/**
 * Checks whether all campaign send rows have reached a terminal state ('sent' or 'failed').
 * If no pending/processing rows remain, marks the campaign as completed.
 */
async function checkAndMarkCampaignCompletion(campaignId: string) {
  const remaining = await db.execute<{ count: number }>(sql`
    SELECT COUNT(*)::int AS count
    FROM newsletter_campaign_sends
    WHERE campaign_id = ${campaignId}
      AND status IN ('pending', 'processing')
  `);

  const pendingCount = remaining.rows[0]?.count ?? 0;
  if (pendingCount === 0) {
    const updated = await db
      .update(newsletterCampaign)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(
        and(
          eq(newsletterCampaign.id, campaignId),
          eq(newsletterCampaign.status, "sending"),
        ),
      );

    if (updated.rowCount && updated.rowCount > 0) {
      console.info("[newsletter:worker] Campaign fully completed", {
        campaignId,
      });
    }
  }
}
