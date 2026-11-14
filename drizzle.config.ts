import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

const root = process.cwd();

// If DATABASE_URL is not already injected by scripts/db-cli.mjs, load from local env files
if (!process.env.DATABASE_URL) {
  const candidateFiles = [".env.local", ".env"];
  for (const relativePath of candidateFiles) {
    const absolutePath = resolve(root, relativePath);
    if (!existsSync(absolutePath)) continue;
    loadEnv({ path: absolutePath, override: false });
  }
}

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_LOCAL ||
  process.env.DATABASE_URL_TEST ||
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error(
    "Missing database connection string. Please use explicit scripts: pnpm db:migrate:local, :test, or :prod.",
  );
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
