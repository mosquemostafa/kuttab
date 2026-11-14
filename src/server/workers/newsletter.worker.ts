import type Redis from "ioredis";
import { Worker, type Job } from "bullmq";

import {
  handlePlannerJob,
  processNewsletterBatch,
} from "./newsletter-batch.processor";
import {
  NEWSLETTER_QUEUE_NAME,
  type NewsletterBatchJobData,
  type NewsletterJobData,
  type NewsletterPlannerJobData,
} from "@/server/queues/newsletter.types";

/**
 * Creates and starts the Newsletter BullMQ worker.
 * Rate-limited to 1 job/sec to align with Resend batch delivery limits.
 */
export function createNewsletterWorker(
  connection: Redis,
): Worker<NewsletterJobData> {
  console.info("[worker:newsletter] Initializing newsletter BullMQ worker...");

  let worker: Worker<NewsletterJobData>;

  worker = new Worker<NewsletterJobData>(
    NEWSLETTER_QUEUE_NAME,
    async (job: Job<NewsletterJobData>): Promise<unknown> => {
      if (job.data.type === "planner") {
        return handlePlannerJob(job as Job<NewsletterPlannerJobData>);
      }
      return processNewsletterBatch(job as Job<NewsletterBatchJobData>, worker);
    },
    {
      connection,
      concurrency: 3,
      limiter: {
        max: 1,
        duration: 1000,
      },
    },
  );

  worker.on("ready", () => {
    console.info(
      "[worker:newsletter] Worker is connected and ready to process jobs.",
    );
  });

  worker.on("completed", (job: Job<NewsletterJobData>) => {
    console.info(
      `[worker:newsletter] Job ${job.id} (${job.data.type}) completed successfully.`,
    );
  });

  worker.on("failed", (job: Job<NewsletterJobData> | undefined, err: Error) => {
    console.error(
      `[worker:newsletter] Job ${job?.id} (${job?.data?.type}) failed on attempt ${job?.attemptsMade}:`,
      err.message,
    );
  });

  worker.on("error", (err: Error) => {
    console.error("[worker:newsletter] Worker error:", err);
  });

  return worker;
}
