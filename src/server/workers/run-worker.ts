import "./env-preload";

import { type Worker } from "bullmq";

import { getWorkerRedisConnection } from "@/server/lib/redis";
import { createNewsletterWorker } from "./newsletter.worker";

const connection = getWorkerRedisConnection();

console.info("[worker-manager] Starting background worker orchestrator...");

/**
 * Registry of all active feature workers running inside this worker process.
 * To add a new background feature (e.g. notifications, scheduled jobs, data exports):
 * 1. Define its queue in src/server/queues/<feature>.queue.ts
 * 2. Create its worker factory in src/server/workers/<feature>.worker.ts
 * 3. Add create<Feature>Worker(connection) to this array.
 */
const activeWorkers: Worker[] = [
  createNewsletterWorker(connection),
  // Future: createNotificationsWorker(connection),
];

// Universal Graceful Shutdown (Docker stop_grace_period = 60s)
let isShuttingDown = false;
async function handleShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.info(
    `[worker-manager] Received ${signal}. Draining ${activeWorkers.length} active worker(s)...`,
  );

  try {
    // Close all workers in parallel
    await Promise.all(
      activeWorkers.map(async (worker) => {
        await worker.close();
        console.info(
          `[worker-manager] Worker "${worker.name}" closed successfully.`,
        );
      }),
    );

    await connection.quit();
    console.info(
      "[worker-manager] Shared Redis connection closed. Exiting process.",
    );
    process.exit(0);
  } catch (error) {
    console.error("[worker-manager] Error during graceful shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", () => void handleShutdown("SIGTERM"));
process.on("SIGINT", () => void handleShutdown("SIGINT"));
