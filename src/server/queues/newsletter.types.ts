import type { JobsOptions } from "bullmq";

export type NewsletterPlannerJobData = {
  type: "planner";
  campaignId: string;
  resumeGeneration: number;
};

export type NewsletterBatchJobData = {
  type: "batch";
  campaignId: string;
  batchNumber: number;
  resumeGeneration: number;
  subscriberIds: string[];
};

export type NewsletterJobData =
  | NewsletterPlannerJobData
  | NewsletterBatchJobData;

export const NEWSLETTER_QUEUE_NAME = "newsletter-delivery";

/**
 * Production job options:
 * - Exponential backoff on transient errors.
 * - Strict retention limits to avoid filling up Redis memory under `noeviction`.
 */
export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000,
  },
  removeOnComplete: {
    count: 1000,
    age: 24 * 3600, // 24 hours
  },
  removeOnFail: {
    count: 5000,
  },
};
