import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

const root = process.cwd();

const envFiles = [".env.local", ".env"];

for (const file of envFiles) {
  const filePath = resolve(root, file);
  if (existsSync(filePath)) {
    loadEnv({ path: filePath, override: false });
  }
}
