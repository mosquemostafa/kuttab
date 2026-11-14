import { Queue } from "bullmq";

import { getQueueRedisConnection } from "@/server/lib/redis";
import {
  DEFAULT_JOB_OPTIONS,
  NEWSLETTER_QUEUE_NAME,
  type NewsletterJobData,
} from "./newsletter.types";

let queueInstance: Queue<NewsletterJobData> | null = null;

export function getNewsletterQueue(): Queue<NewsletterJobData> {
  if (!queueInstance) {
    const connection = getQueueRedisConnection();
    queueInstance = new Queue<NewsletterJobData>(NEWSLETTER_QUEUE_NAME, {
      connection,
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }
  return queueInstance;
}

/**
 * Enqueues a Planner Job for a campaign send or resume.
 * The planner executes in the background worker and fans out batch jobs
 * without blocking the HTTP request handler.
 */
export async function enqueueCampaignPlannerJob(
  campaignId: string,
  resumeGeneration: number,
): Promise<string> {
  const queue = getNewsletterQueue();
  const jobId = `campaign_${campaignId}_planner_gen_${resumeGeneration}`;

  const job = await queue.add(
    "campaign-planner",
    {
      type: "planner",
      campaignId,
      resumeGeneration,
    },
    {
      ...DEFAULT_JOB_OPTIONS,
      jobId,
    },
  );

  return job.id || jobId;
}
