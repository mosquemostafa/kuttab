#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const TARGET_DIRS = ["src/components", "src/app"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"]);
const SKIP_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "build",
  ".pnpm-store",
  "coverage",
]);

const guidelineRules = [
  {
    id: "no-direct-fetch",
    description:
      "Do not use fetch() directly. Route all requests through apiClient (src/lib/api/api-client.ts).",
    pattern: /\bfetch\s*\(/g,
  },
];

async function collectFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        files.push(...(await collectFiles(fullPath)));
      }
      continue;
    }

    if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function getLineAndColumn(content, index) {
  const before = content.slice(0, index);
  const line = before.split("\n").length;
  const lineStart = before.lastIndexOf("\n") + 1;
  const column = index - lineStart + 1;
  return { line, column };
}

async function main() {
  const roots = TARGET_DIRS.map((dir) => path.join(PROJECT_ROOT, dir));
  const files = [];

  for (const root of roots) {
    try {
      files.push(...(await collectFiles(root)));
    } catch {
      // Directory may not exist in all workspaces.
    }
  }

  const findings = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");

    for (const rule of guidelineRules) {
      for (const match of content.matchAll(rule.pattern)) {
        const { line, column } = getLineAndColumn(content, match.index ?? 0);
        findings.push({
          file: path.relative(PROJECT_ROOT, file),
          line,
          column,
          ruleId: rule.id,
          description: rule.description,
        });
      }
    }
  }

  if (findings.length === 0) {
    console.log("Guidelines check passed: no violations found.");
    process.exit(0);
  }

  console.log(
    `Guidelines check failed: ${findings.length} violation(s) found.`,
  );

  let currentRule = "";
  for (const finding of findings) {
    if (currentRule !== finding.ruleId) {
      currentRule = finding.ruleId;
      console.log(`\nRule: ${finding.ruleId}`);
      console.log(`- ${finding.description}`);
    }

    console.log(`- ${finding.file}:${finding.line}:${finding.column}`);
  }

  process.exit(1);
}

main().catch((error) => {
  console.error("Failed to run guidelines check:", error);
  process.exit(2);
});
