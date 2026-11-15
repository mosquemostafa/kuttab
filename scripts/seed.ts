#!/usr/bin/env node

import { resolve } from "node:path";
import { existsSync } from "node:fs";
import readline from "node:readline";
import { config as loadEnv } from "dotenv";

const root = process.cwd();

// Load local environment files if not already loaded
const envFiles = [
  ".env.development.local",
  ".env.local",
  ".env.development",
  ".env",
];

for (const file of envFiles) {
  const filePath = resolve(root, file);
  if (existsSync(filePath)) {
    loadEnv({ path: filePath, override: false });
  }
}

// Ensure local db URL is prioritized for local seeding script
if (process.env.DATABASE_URL_LOCAL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_LOCAL;
}

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolvePrompt) => {
    rl.question(question, (answer) => {
      rl.close();
      resolvePrompt(answer.trim());
    });
  });
}

async function main() {
  console.log("\n🌱 Almostafa Database Seeder (target: local)");
  console.log("=".repeat(50));

  // Dynamically import seedService after env is loaded
  const { seedService, assertLocalDatabaseAllowed } =
    await import("./seeder/seed.service");
  const { db } = await import("@/server/db");
  const { user } = await import("@/server/db/schema");

  try {
    assertLocalDatabaseAllowed();
  } catch (err: unknown) {
    console.error(
      `\n🚨 FORBIDDEN: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  // Parse CLI flags
  let targetUserId: string | undefined;
  let cleanBeforeSeed = true;

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--user-id=")) {
      targetUserId = arg.split("=")[1];
    } else if (arg === "--no-clean") {
      cleanBeforeSeed = false;
    } else if (arg === "--clean" || arg === "-c") {
      cleanBeforeSeed = true;
    }
  }

  if (process.env.SEED_USER_ID) {
    targetUserId = process.env.SEED_USER_ID;
  }

  // Fetch existing users from local DB
  const existingUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user);

  if (!targetUserId) {
    if (existingUsers.length > 0) {
      console.log("\nExisting user(s) found in local database:");
      existingUsers.forEach((u, idx) => {
        const roleStr = u.role ? ` [${u.role}]` : "";
        console.log(
          `  [${idx + 1}] ${u.id} (${u.email} — ${u.name})${roleStr}`,
        );
      });
      console.log("");
    } else {
      console.log("\nNo existing users found in local database.\n");
    }

    if (process.stdin.isTTY) {
      const defaultChoice =
        existingUsers.length > 0 ? "1" : "usr_admin_starter";
      const promptText =
        existingUsers.length > 0
          ? `👉 Enter target userId to seed (number [1-${existingUsers.length}], or paste userId) [default: 1]: `
          : `👉 Enter target userId to seed (or press Enter for '${defaultChoice}'): `;

      const answer = await promptUser(promptText);

      if (!answer) {
        targetUserId =
          existingUsers.length > 0 ? existingUsers[0].id : defaultChoice;
      } else {
        const selectedIndex = parseInt(answer, 10);
        if (
          !isNaN(selectedIndex) &&
          selectedIndex >= 1 &&
          selectedIndex <= existingUsers.length
        ) {
          targetUserId = existingUsers[selectedIndex - 1].id;
        } else {
          targetUserId = answer;
        }
      }
    } else {
      // Non-interactive fallback
      targetUserId =
        existingUsers.length > 0 ? existingUsers[0].id : "usr_admin_starter";
    }
  }

  if (
    process.stdin.isTTY &&
    !process.argv.includes("--no-clean") &&
    !process.argv.includes("--clean")
  ) {
    const cleanAnswer = await promptUser(
      "👉 Clean existing seeded data before re-seeding? [Y/n] [default: Y]: ",
    );
    cleanBeforeSeed =
      !cleanAnswer ||
      cleanAnswer.toLowerCase() === "y" ||
      cleanAnswer.toLowerCase() === "yes";
  }

  console.log(`\n🎯 Target Primary User ID: ${targetUserId}`);
  console.log(
    `🧹 Clean mode: ${cleanBeforeSeed ? "Enabled (wiping old seed data for a fresh start)" : "Disabled (keeping existing records)"}`,
  );
  console.log("🚀 Executing comprehensive seeding across all features...\n");

  const startTime = Date.now();
  const result = await seedService.seed({
    targetUserId,
    cleanBeforeSeed,
  });

  const durationMs = Date.now() - startTime;

  console.log("✅ Seeding completed successfully in " + durationMs + "ms!\n");
  console.log("📊 Summary of seeded records:");
  console.log("-".repeat(40));
  for (const [key, count] of Object.entries(result.summary)) {
    console.log(`  ✓ ${key.padEnd(26)} : ${count}`);
  }
  console.log("-".repeat(40));
  console.log(`\n🎉 Primary User: ${result.targetUserId}`);
  console.log(
    "✨ All UI sections, dashboards, analytics, and learning features are populated with fresh data!\n",
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Seeding failed:", err);
  process.exit(1);
});
