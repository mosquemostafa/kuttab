#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const drizzleDir = resolve(root, "drizzle");

if (!existsSync(drizzleDir)) {
  console.error("❌ 'drizzle' directory not found in project root.");
  process.exit(1);
}

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const archiveDir = resolve(drizzleDir, "archive", `checkpoint_${timestamp}`);

console.log(`\n📦 Starting migration squashing...`);

// 1. Create archive directory
mkdirSync(archiveDir, { recursive: true });

// 2. Identify existing migration files to archive
const entries = readdirSync(drizzleDir);
let movedCount = 0;

for (const entry of entries) {
  if (entry === "archive") continue;
  const oldPath = resolve(drizzleDir, entry);
  const newPath = resolve(archiveDir, entry);
  renameSync(oldPath, newPath);
  movedCount++;
}

console.log(
  `📁 Archived ${movedCount} items to drizzle/archive/checkpoint_${timestamp}/`,
);

// 3. Generate clean baseline migration from current schema.ts
console.log(
  `⚙️ Generating new consolidated baseline migration from schema.ts...`,
);

const result = spawnSync(
  "pnpm",
  ["exec", "drizzle-kit", "generate", "--name", "baseline"],
  {
    stdio: "inherit",
    env: process.env,
  },
);

if (result.status !== 0) {
  console.error("\n❌ Failed to generate baseline migration.");
  console.error(
    "Your previous migrations are safely stored in drizzle/archive/.",
  );
  process.exit(1);
}

console.log("\n" + "=".repeat(70));
console.log("🎉 MIGRATION SQUASHING SUCCESSFUL!");
console.log("=".repeat(70));
console.log(
  "All past migrations have been consolidated into a clean baseline.\n",
);
console.log("Next steps:");
console.log("  • To reset and migrate your local database cleanly:");
console.log("      pnpm db:reset:local\n");
console.log(
  "  • For existing databases that ALREADY have the tables (e.g. Production):",
);
console.log("      pnpm db:baseline:mark:prod\n");
