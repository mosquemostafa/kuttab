#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import readline from "node:readline";
import { config as loadEnv } from "dotenv";
import pg from "pg";

const { Client } = pg;
const root = process.cwd();

// Parse arguments
const [, , action, target, ...extraArgs] = process.argv;

const VALID_ACTIONS = [
  "migrate",
  "push",
  "studio",
  "generate",
  "reset",
  "baseline",
  "seed",
  "verify",
];
const VALID_TARGETS = ["local", "test", "prod"];

function printHelpAndExit(errorMessage) {
  if (errorMessage) {
    console.error(`\n❌ ${errorMessage}\n`);
  }
  console.log(`Usage: node scripts/db-cli.mjs <action> <target> [options]\n`);
  console.log(`Available actions:`);
  console.log(
    `  migrate   - Apply pending migrations to the selected database`,
  );
  console.log(`  push      - Push schema changes directly (local & test only)`);
  console.log(`  studio    - Launch Drizzle Studio for the selected database`);
  console.log(
    `  reset     - Drop & recreate schema, then migrate clean (local & test only)`,
  );
  console.log(
    `  baseline  - Mark baseline migration as applied (for existing databases)`,
  );
  console.log(
    `  verify    - Verify live database schema against codebase .entity.ts files`,
  );
  console.log(
    `  seed      - Seed database with rich comprehensive data (local target only)\n`,
  );
  console.log(`Available targets:`);
  console.log(`  local     - Targets DATABASE_URL_LOCAL (or DATABASE_URL)`);
  console.log(`  test      - Targets DATABASE_URL_TEST`);
  console.log(`  prod      - Targets DATABASE_URL_PROD\n`);
  console.log(`Examples:`);
  console.log(`  pnpm db:migrate:local`);
  console.log(`  pnpm db:seed:local`);
  console.log(`  pnpm db:reset:local`);
  console.log(`  pnpm db:baseline:mark:prod\n`);
  process.exit(1);
}

if (!action || !VALID_ACTIONS.includes(action)) {
  printHelpAndExit(
    `Invalid or missing action "${action}". Allowed: ${VALID_ACTIONS.join(", ")}`,
  );
}

// For 'generate', target is not needed (schema only)
if (action === "generate") {
  const result = spawnSync(
    "pnpm",
    ["exec", "drizzle-kit", "generate", ...process.argv.slice(3)],
    {
      stdio: "inherit",
      env: process.env,
    },
  );
  process.exit(result.status ?? 0);
}

if (!target || !VALID_TARGETS.includes(target)) {
  printHelpAndExit(
    `Database target is required for "${action}"! Please specify "local", "test", or "prod".`,
  );
}

// Block destructive commands on production
if (action === "push" && target === "prod") {
  console.error(
    "\n🚨 FORBIDDEN: 'drizzle-kit push' is strictly forbidden on PRODUCTION.\n" +
      "Production must always use versioned migrations: pnpm db:migrate:prod\n",
  );
  process.exit(1);
}

if (action === "reset" && target === "prod") {
  console.error(
    "\n🚨 FORBIDDEN: Database reset is strictly forbidden on PRODUCTION.\n",
  );
  process.exit(1);
}

if (action === "seed" && target !== "local") {
  console.error(
    "\n🚨 FORBIDDEN: Database seeding is strictly forbidden on non-local databases (prod/test).\n" +
      "Seeding is only allowed on target 'local'.\n",
  );
  process.exit(1);
}

// Load env files based on target
const envFilesByTarget = {
  prod: [".env.prod", ".env.production", ".env.local", ".env"],
  test: [".env.test.local", ".env.local", ".env.test", ".env"],
  local: [".env.development.local", ".env.local", ".env.development", ".env"],
};

for (const file of envFilesByTarget[target]) {
  const filePath = resolve(root, file);
  if (existsSync(filePath)) {
    loadEnv({ path: filePath, override: false });
  }
}

// Resolve the target connection string
let targetDbUrl = "";
if (target === "prod") {
  targetDbUrl = (
    process.env.DATABASE_URL_PROD ||
    process.env.DATABASE_URL ||
    ""
  ).trim();
} else if (target === "test") {
  targetDbUrl = (
    process.env.DATABASE_URL_TEST ||
    process.env.DATABASE_URL_LOCAL ||
    process.env.DATABASE_URL ||
    ""
  ).trim();
} else if (target === "local") {
  targetDbUrl = (
    process.env.DATABASE_URL_LOCAL ||
    process.env.DATABASE_URL ||
    ""
  ).trim();
}

if (!targetDbUrl) {
  const expectedVar =
    target === "prod"
      ? "DATABASE_URL_PROD"
      : target === "test"
        ? "DATABASE_URL_TEST"
        : "DATABASE_URL_LOCAL (or DATABASE_URL)";
  console.error(
    `\n❌ Error: No database URL found for target "${target}".\n` +
      `Please set ${expectedVar} in your .env.local file.\n`,
  );
  process.exit(1);
}

function maskDbUrl(url) {
  return url.replace(/:([^:@]+)@/, ":****@");
}

async function confirmIfProd() {
  if (target !== "prod") return;

  const hasYesFlag = extraArgs.includes("-y") || extraArgs.includes("--yes");
  if (hasYesFlag) return;

  console.warn("\n" + "=".repeat(70));
  console.warn("⚠️  WARNING: YOU ARE TARGETING THE PRODUCTION DATABASE!");
  console.warn(`Action: ${action.toUpperCase()}`);
  console.warn(`Database: ${maskDbUrl(targetDbUrl)}`);
  console.warn("=".repeat(70) + "\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolvePrompt) => {
    rl.question(
      'Type "production" to confirm and proceed (or Ctrl+C to abort): ',
      (answer) => {
        rl.close();
        if (answer.trim().toLowerCase() !== "production") {
          console.error("\n❌ Aborted by user. No changes were made.\n");
          process.exit(1);
        }
        resolvePrompt();
      },
    );
  });
}

function createPgClient() {
  return new Client({
    connectionString: targetDbUrl,
    ssl: targetDbUrl.includes("sslmode=")
      ? { rejectUnauthorized: false }
      : undefined,
  });
}

async function handleReset() {
  console.log(
    `\n⚠️  Resetting [${target.toUpperCase()}] database: dropping and recreating public schema...`,
  );
  const client = createPgClient();
  await client.connect();

  try {
    await client.query(
      "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;",
    );
    await client.query("DROP SCHEMA IF EXISTS drizzle CASCADE;");
    console.log("✅ Public schema reset successfully.");
  } finally {
    await client.end();
  }

  console.log(
    `\n🚀 Applying migrations fresh to [${target.toUpperCase()}] database...`,
  );
  const nodeEnv = target === "test" ? "test" : "development";
  const result = spawnSync("pnpm", ["exec", "drizzle-kit", "migrate"], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: nodeEnv,
      DATABASE_URL: targetDbUrl,
    },
  });

  process.exit(result.status ?? 0);
}

async function handleBaseline() {
  const journalPath = resolve(root, "drizzle/meta/_journal.json");
  if (!existsSync(journalPath)) {
    console.error(
      "❌ drizzle/meta/_journal.json not found. Run pnpm db:squash first.",
    );
    process.exit(1);
  }

  const journal = JSON.parse(readFileSync(journalPath, "utf-8"));
  if (!journal.entries || journal.entries.length === 0) {
    console.error(
      "❌ No migration entries found in drizzle/meta/_journal.json",
    );
    process.exit(1);
  }

  const firstEntry = journal.entries[0];
  const migrationFile = resolve(root, `drizzle/${firstEntry.tag}.sql`);
  if (!existsSync(migrationFile)) {
    console.error(`❌ Migration file ${migrationFile} not found.`);
    process.exit(1);
  }

  const sqlContent = readFileSync(migrationFile, "utf-8");
  const hash = crypto.createHash("sha256").update(sqlContent).digest("hex");
  const folderMillis = firstEntry.when;

  // 1. Extract expected tables from baseline migration SQL
  const tableMatches = [
    ...sqlContent.matchAll(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([a-zA-Z0-9_]+)"?/gi,
    ),
  ];
  const expectedTables = [...new Set(tableMatches.map((m) => m[1]))];

  console.log(
    `\n🔍 Verifying schema on [${target.toUpperCase()}] database before baselining...`,
  );

  const client = createPgClient();
  await client.connect();

  try {
    // 2. Query actual existing tables in target database
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    const existingTables = new Set(tableRes.rows.map((r) => r.table_name));

    const missingTables = expectedTables.filter((t) => !existingTables.has(t));
    if (missingTables.length > 0) {
      console.error(
        `\n❌ SAFETY CHECK FAILED! Cannot mark baseline on [${target.toUpperCase()}].`,
      );
      console.error(
        `The database is missing ${missingTables.length} of ${expectedTables.length} expected tables:`,
      );
      missingTables.forEach((t) => console.error(`   • ${t}`));
      console.error(
        `\n💡 Aborting: Do not baseline an out-of-sync database. The missing tables must exist first.\n`,
      );
      process.exit(1);
    }

    console.log(
      `✅ Pre-verification passed: all ${expectedTables.length} baseline tables exist in [${target.toUpperCase()}].`,
    );

    // 3. Prompt user if targeting production
    await confirmIfProd();

    console.log(
      `\n📝 Recording baseline migration (${firstEntry.tag}) in drizzle.__drizzle_migrations...`,
    );

    await client.query("CREATE SCHEMA IF NOT EXISTS drizzle;");
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id serial primary key,
        hash text not null,
        created_at bigint
      );
    `);
    await client.query("TRUNCATE TABLE drizzle.__drizzle_migrations;");
    await client.query(
      "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2);",
      [hash, folderMillis],
    );

    console.log(`✅ Baseline checkpoint recorded successfully!`);
    console.log(
      `Database [${target.toUpperCase()}] is now aligned with ${firstEntry.tag}.\n`,
    );
  } finally {
    await client.end();
  }

  process.exit(0);
}

async function handleVerify() {
  const snapshotPath = resolve(root, "drizzle/meta/0000_snapshot.json");
  const baselinePath = resolve(root, "drizzle/0000_baseline.sql");

  if (!existsSync(snapshotPath)) {
    console.error(
      "❌ drizzle/meta/0000_snapshot.json not found. Run pnpm db:squash or pnpm db:generate first.",
    );
    process.exit(1);
  }

  const snapshot = JSON.parse(readFileSync(snapshotPath, "utf-8"));
  const baselineSql = existsSync(baselinePath)
    ? readFileSync(baselinePath, "utf-8")
    : "";

  console.log(
    `\n🔍 Auditing schema on [${target.toUpperCase()}] database against code schema (.entity.ts)...`,
  );

  const client = createPgClient();
  await client.connect();

  try {
    // 1. Fetch live DB metadata
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    const existingTables = new Set(tableRes.rows.map((r) => r.table_name));

    const colRes = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public';
    `);
    const existingColumns = new Set(
      colRes.rows.map((r) => `${r.table_name}.${r.column_name}`),
    );

    const idxRes = await client.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public';
    `);
    const existingIndexes = new Set(idxRes.rows.map((r) => r.indexname));

    const fkRes = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY';
    `);
    const existingFks = new Set(fkRes.rows.map((r) => r.constraint_name));

    const enumRes = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e';
    `);
    const existingEnums = new Set(enumRes.rows.map((r) => r.typname));

    // 2. Diff against snapshot
    const missingTables = [];
    const missingColumns = [];
    const missingIndexes = [];
    const missingFks = [];
    const missingEnums = [];

    // Check enums
    for (const [, enumData] of Object.entries(snapshot.enums || {})) {
      if (!existingEnums.has(enumData.name)) {
        missingEnums.push(enumData.name);
      }
    }

    // Check tables, columns, indexes, foreign keys
    let totalTables = 0;
    let totalColumns = 0;
    let totalIndexes = 0;
    let totalFks = 0;

    for (const [, tableData] of Object.entries(snapshot.tables || {})) {
      totalTables++;
      const tableName = tableData.name;
      if (!existingTables.has(tableName)) {
        missingTables.push(tableName);
        continue;
      }

      for (const [, colData] of Object.entries(tableData.columns || {})) {
        totalColumns++;
        const colIdentifier = `${tableName}.${colData.name}`;
        if (!existingColumns.has(colIdentifier)) {
          missingColumns.push(colIdentifier);
        }
      }

      for (const [, idxData] of Object.entries(tableData.indexes || {})) {
        totalIndexes++;
        const truncatedIdxName = idxData.name.slice(0, 63);
        if (
          !existingIndexes.has(idxData.name) &&
          !existingIndexes.has(truncatedIdxName)
        ) {
          missingIndexes.push({ table: tableName, index: idxData.name });
        }
      }

      for (const [, fkData] of Object.entries(tableData.foreignKeys || {})) {
        totalFks++;
        const truncatedFkName = fkData.name.slice(0, 63);
        if (
          !existingFks.has(fkData.name) &&
          !existingFks.has(truncatedFkName)
        ) {
          missingFks.push({ table: tableName, fk: fkData.name });
        }
      }
    }

    const hasDrift =
      missingTables.length > 0 ||
      missingColumns.length > 0 ||
      missingIndexes.length > 0 ||
      missingFks.length > 0 ||
      missingEnums.length > 0;

    if (!hasDrift) {
      console.log(`\n🎉 100% SCHEMA ALIGNMENT CONFIRMED!`);
      console.log(
        `Database [${target.toUpperCase()}] is fully in sync with your codebase:`,
      );
      console.log(`  • Tables: ${totalTables} / ${totalTables} present`);
      console.log(`  • Columns: ${totalColumns} / ${totalColumns} present`);
      console.log(`  • Indexes: ${totalIndexes} / ${totalIndexes} present`);
      console.log(`  • Foreign Keys: ${totalFks} / ${totalFks} present`);
      console.log(
        `  • Enums: ${existingEnums.size} verified in public schema\n`,
      );
      process.exit(0);
    }

    console.error(
      `\n🚨 SCHEMA DRIFT DETECTED on [${target.toUpperCase()}] database:\n`,
    );

    if (missingTables.length > 0) {
      console.error(`❌ Missing Tables (${missingTables.length}):`);
      missingTables.forEach((t) => console.error(`   • ${t}`));
      console.error();
    }

    if (missingColumns.length > 0) {
      console.error(`❌ Missing Columns (${missingColumns.length}):`);
      missingColumns.forEach((c) => console.error(`   • ${c}`));
      console.error();
    }

    if (missingIndexes.length > 0) {
      console.error(`❌ Missing Indexes (${missingIndexes.length}):`);
      missingIndexes.forEach((i) =>
        console.error(`   • ${i.index} (on table ${i.table})`),
      );
      console.error();
    }

    if (missingFks.length > 0) {
      console.error(`❌ Missing Foreign Keys (${missingFks.length}):`);
      missingFks.forEach((f) =>
        console.error(`   • ${f.fk} (on table ${f.table})`),
      );
      console.error();
    }

    if (missingEnums.length > 0) {
      console.error(`❌ Missing Enums (${missingEnums.length}):`);
      missingEnums.forEach((e) => console.error(`   • ${e}`));
      console.error();
    }

    // Try to extract exact SQL statements from baselineSql to fix missing items
    if (baselineSql && missingIndexes.length > 0) {
      console.log(`💡 Suggested SQL to restore missing index(es):`);
      for (const { index } of missingIndexes) {
        const regex = new RegExp(
          `CREATE\\s+(?:UNIQUE\\s+)?INDEX\\s+"?${index}"?[^;]+;`,
          "i",
        );
        const match = baselineSql.match(regex);
        if (match) {
          console.log(`   ${match[0]}`);
        }
      }
      console.log();
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

async function run() {
  if (action === "verify") {
    await handleVerify();
    return;
  }

  if (action === "reset") {
    await handleReset();
    return;
  }

  if (action === "baseline") {
    await handleBaseline();
    return;
  }

  if (action === "seed") {
    const prodUrl = (process.env.DATABASE_URL_PROD || "").trim();
    if (prodUrl && targetDbUrl === prodUrl) {
      console.error(
        "\n🚨 FORBIDDEN: Cannot seed database: target database matches DATABASE_URL_PROD.\n" +
          "Seeding is strictly forbidden on production databases.\n",
      );
      process.exit(1);
    }

    const result = spawnSync(
      "./node_modules/.bin/tsx",
      ["scripts/seed.ts", ...extraArgs],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          NODE_ENV: "development",
          DATABASE_URL: targetDbUrl,
        },
      },
    );
    process.exit(result.status ?? 0);
  }

  await confirmIfProd();

  console.log(
    `\n🚀 Running drizzle-kit ${action} against [${target.toUpperCase()}] database: ${maskDbUrl(targetDbUrl)}\n`,
  );

  const forwardedArgs = extraArgs.filter(
    (arg) => arg !== "-y" && arg !== "--yes",
  );
  const drizzleArgs = ["exec", "drizzle-kit", action, ...forwardedArgs];

  const nodeEnv =
    target === "prod"
      ? "production"
      : target === "test"
        ? "test"
        : "development";

  const result = spawnSync("pnpm", drizzleArgs, {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: nodeEnv,
      DATABASE_URL: targetDbUrl,
    },
  });

  if (result.error) {
    console.error(
      `Failed to execute drizzle-kit ${action}:`,
      result.error.message,
    );
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}

run().catch((err) => {
  console.error("Unexpected error in db runner:", err);
  process.exit(1);
});
