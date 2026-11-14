#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const TARGET_DIRS = ["src", "worker"];
const MESSAGES_DIR = path.join(PROJECT_ROOT, "src", "messages");
const ALLOWED_ALIAS = "t";

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

const declarationRegex =
  /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(getTranslations|useTranslations)\s*\(/g;
const translatorInitRegex =
  /\b(?:const|let|var)\s+t\s*=\s*(?:await\s+)?(?:getTranslations|useTranslations)\s*\(/;
const translatorDeclarationAliasRegex =
  /\b(?:const|let|var)\s+t\s*=\s*(?:await\s+)?(?:getTranslations|useTranslations)\s*\(/;
const translatorCallRegex = /\b(getTranslations|useTranslations)\s*\(/g;
const tCallRegex = /\bt\s*\(/g;
const rawCallRegex = /\bt\.raw\s*\(/g;
const getMessagesCallRegex = /\bgetMessages\s*\(/g;
const conditionalTranslatorCallRegex =
  /\?\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(/g;
const asUnknownTranslatorRegex =
  /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*t\s+as\s+unknown\s+as\b/g;
const translatorParamRegexes = [
  {
    regex:
      /\bt\s*:\s*[\s\S]{0,220}?ReturnType\s*<\s*typeof\s*(getTranslations|useTranslations)\s*>/g,
    reason: "translator parameter typed via ReturnType",
  },
  {
    regex:
      /\bt\s*:\s*\(\s*key\s*:\s*string(?:\s*,\s*values\s*:\s*[^)]*)?\)\s*=>\s*string/g,
    reason: "translator parameter typed as (key: string) => string",
  },
];
const translatorArgPassRegex =
  /\b(?!t\b)[A-Za-z_$][\w$]*\s*\(\s*t\s*(?:,|\))|\b(?!t\b)[A-Za-z_$][\w$]*\s*\([^)]*,\s*t\s*(?:,|\))/g;

async function collectFiles(dir) {
  const result = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        result.push(...(await collectFiles(fullPath)));
      }
      continue;
    }

    if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      result.push(fullPath);
    }
  }

  return result;
}

function findArraysInObject(obj, currentPath = "") {
  const results = [];
  if (Array.isArray(obj)) {
    results.push(currentPath || "(root)");
    return results;
  }
  if (obj && typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      results.push(...findArraysInObject(value, nextPath));
    }
  }
  return results;
}

async function collectJsonFiles(dir) {
  const results = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          results.push(...(await collectJsonFiles(fullPath)));
        }
        continue;
      }
      if (entry.isFile() && path.extname(entry.name) === ".json") {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory might not exist
  }
  return results;
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
      // Directory might not exist in all workspaces.
    }
  }

  const aliasFindings = [];
  const nonLiteralNamespaceFindings = [];
  const dynamicTFindings = [];
  const nonLiteralTArgFindings = [];
  const translatorParamFindings = [];
  const translatorArgPassFindings = [];
  const rawCallFindings = [];
  const jsonArrayFindings = [];
  const getMessagesFindings = [];
  const conditionalTranslatorFindings = [];
  const asUnknownTranslatorFindings = [];
  const unscopedTFindings = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");
            if (!translatorInitRegex.test(content)) {
      for (const match of content.matchAll(tCallRegex)) {
        const { line, column } = getLineAndColumn(content, match.index ?? 0);
        unscopedTFindings.push({
          file: path.relative(PROJECT_ROOT, file),
          line,
          column,
        });
      }
    }
    for (const match of content.matchAll(conditionalTranslatorCallRegex)) {
      const { line, column } = getLineAndColumn(content, match.index ?? 0);
      conditionalTranslatorFindings.push({
        file: path.relative(PROJECT_ROOT, file),
        line,
        column,
      });
    }

    for (const match of content.matchAll(asUnknownTranslatorRegex)) {
      const { line, column } = getLineAndColumn(content, match.index ?? 0);
      asUnknownTranslatorFindings.push({
        file: path.relative(PROJECT_ROOT, file),
        line,
        column,
        alias: match[1],
      });
    }
    for (const match of content.matchAll(declarationRegex)) {
      const alias = match[1];
      const api = match[2];
      if (alias === ALLOWED_ALIAS) {
        continue;
      }

      const { line, column } = getLineAndColumn(content, match.index ?? 0);
      aliasFindings.push({
        file: path.relative(PROJECT_ROOT, file),
        line,
        column,
        alias,
        api,
      });
    }

    for (const match of content.matchAll(translatorCallRegex)) {
      const api = match[1];
      let argIndex = (match.index ?? 0) + match[0].length;

      while (argIndex < content.length && /\s/.test(content[argIndex])) {
        argIndex += 1;
      }

      const firstArgChar = content[argIndex];
      if (!firstArgChar || firstArgChar === ")") {
        continue;
      }

      if (firstArgChar === '"' || firstArgChar === "'") {
        continue;
      }

      if (api === "getTranslations" && firstArgChar === "{") {
        let depth = 0;
        let closingBraceIndex = -1;
        for (let i = argIndex; i < content.length; i++) {
          if (content[i] === "{") depth++;
          else if (content[i] === "}") {
            depth--;
            if (depth === 0) {
              closingBraceIndex = i;
              break;
            }
          }
        }

        if (closingBraceIndex !== -1) {
          const objectBody = content.slice(argIndex + 1, closingBraceIndex);
          const nsMatch = /\bnamespace\s*:\s*([^,\s}]+)/.exec(objectBody);
          if (nsMatch) {
            const firstValChar = nsMatch[1][0];
            if (firstValChar !== '"' && firstValChar !== "'") {
              const nsIndex = argIndex + 1 + nsMatch.index;
              const { line, column } = getLineAndColumn(content, nsIndex);
              nonLiteralNamespaceFindings.push({
                file: path.relative(PROJECT_ROOT, file),
                line,
                column,
                api,
              });
            }
          }
          continue;
        }
      }

      const { line, column } = getLineAndColumn(content, argIndex);
      nonLiteralNamespaceFindings.push({
        file: path.relative(PROJECT_ROOT, file),
        line,
        column,
        api,
      });
    }

    for (const match of content.matchAll(tCallRegex)) {
      let argIndex = (match.index ?? 0) + match[0].length;

      while (argIndex < content.length && /\s/.test(content[argIndex])) {
        argIndex += 1;
      }

      const firstArgChar = content[argIndex];
      if (!firstArgChar) {
        continue;
      }

      if (firstArgChar === '"' || firstArgChar === "'") {
        continue;
      }

      const { line, column } = getLineAndColumn(content, argIndex);
      if (firstArgChar === "`") {
        dynamicTFindings.push({
          file: path.relative(PROJECT_ROOT, file),
          line,
          column,
        });
        continue;
      }

      nonLiteralTArgFindings.push({
        file: path.relative(PROJECT_ROOT, file),
        line,
        column,
      });
    }

    for (const { regex, reason } of translatorParamRegexes) {
      for (const match of content.matchAll(regex)) {
        const api = match[1] ?? "custom function type";
        const { line, column } = getLineAndColumn(content, match.index ?? 0);
        translatorParamFindings.push({
          file: path.relative(PROJECT_ROOT, file),
          line,
          column,
          api,
          reason,
        });
      }
    }


    if (!file.endsWith("layout.tsx")) {
      for (const match of content.matchAll(getMessagesCallRegex)) {
        const { line, column } = getLineAndColumn(content, match.index ?? 0);
        getMessagesFindings.push({
          file: path.relative(PROJECT_ROOT, file),
          line,
          column,
        });
      }
    }

    for (const match of content.matchAll(rawCallRegex)) {
      const { line, column } = getLineAndColumn(content, match.index ?? 0);
      rawCallFindings.push({
        file: path.relative(PROJECT_ROOT, file),
        line,
        column,
      });
    }
    if (translatorDeclarationAliasRegex.test(content)) {
      for (const match of content.matchAll(translatorArgPassRegex)) {
        const { line, column } = getLineAndColumn(content, match.index ?? 0);
        translatorArgPassFindings.push({
          file: path.relative(PROJECT_ROOT, file),
          line,
          column,
        });
      }
    }
  }


  const jsonFiles = await collectJsonFiles(MESSAGES_DIR);
  for (const jsonFile of jsonFiles) {
    try {
      const rawJson = await readFile(jsonFile, "utf8");
      const parsed = JSON.parse(rawJson);
      const arrayPaths = findArraysInObject(parsed);
      for (const arrayPath of arrayPaths) {
        jsonArrayFindings.push({
          file: path.relative(PROJECT_ROOT, jsonFile),
          keyPath: arrayPath,
        });
      }
    } catch (err) {
      console.error(`Failed to parse JSON file: ${jsonFile}`, err);
    }
  }

  const totalFindings =
    aliasFindings.length +
    nonLiteralNamespaceFindings.length +
    dynamicTFindings.length +
    nonLiteralTArgFindings.length +
    translatorParamFindings.length +
    translatorArgPassFindings.length +
    rawCallFindings.length +
    jsonArrayFindings.length +
    getMessagesFindings.length +
    conditionalTranslatorFindings.length +
    asUnknownTranslatorFindings.length +
    unscopedTFindings.length;

  if (totalFindings === 0) {
    console.log("No i18n translator violations found.");
    process.exit(0);
  }

  console.log(`Found ${totalFindings} i18n translator violation(s).`);

      if (unscopedTFindings.length > 0) {
    console.log(
      `\nUnscoped t() call violations (${unscopedTFindings.length}) - do not create a fake t() helper in files without useTranslations/getTranslations (causes i18n-ally to report missing root keys):\n`,
    );
    for (const finding of unscopedTFindings) {
      console.log(
        `${finding.file}:${finding.line}:${finding.column} - unscoped t() call without next-intl translator initialization`,
      );
    }
  }
  if (conditionalTranslatorFindings.length > 0) {
    console.log(
      `\nConditional/ternary translator violations (${conditionalTranslatorFindings.length}) - do not assign translator conditionally (breaks i18n-ally static analysis):\n`,
    );
    for (const finding of conditionalTranslatorFindings) {
      console.log(
        `${finding.file}:${finding.line}:${finding.column} - conditional useTranslations/getTranslations call`,
      );
    }
  }

  if (asUnknownTranslatorFindings.length > 0) {
    console.log(
      `\nType-cast translator alias violations (${asUnknownTranslatorFindings.length}) - do not cast t to dynamic translator function (use static translation maps instead):\n`,
    );
    for (const finding of asUnknownTranslatorFindings) {
      console.log(
        `${finding.file}:${finding.line}:${finding.column} - alias "${finding.alias}" created by casting t`,
      );
    }
  }
  if (aliasFindings.length > 0) {
    console.log(
      `\nTranslator alias violations (${aliasFindings.length}) - allowed alias is \"${ALLOWED_ALIAS}\":`,
    );
    for (const finding of aliasFindings) {
      console.log(
        `${finding.file}:${finding.line}:${finding.column} - alias \"${finding.alias}\" with ${finding.api}()`,
      );
    }
  }

  if (nonLiteralNamespaceFindings.length > 0) {
    console.log(
      `\nDynamic namespace argument violations (${nonLiteralNamespaceFindings.length}) - translator namespace must be a string literal or omitted:`,
    );
    for (const finding of nonLiteralNamespaceFindings) {
      console.log(
        `${finding.file}:${finding.line}:${finding.column} - non-literal namespace used in ${finding.api}() call`,
      );
    }
  }

  if (dynamicTFindings.length > 0) {
    console.log(
      `\nDynamic template key violations (${dynamicTFindings.length}) - avoid t() with template literals:`,
    );
    for (const finding of dynamicTFindings) {
      console.log(
        `${finding.file}:${finding.line}:${finding.column} - dynamic template-literal used in t() call`,
      );
    }
  }

  if (nonLiteralTArgFindings.length > 0) {
    console.log(
      `\nDynamic key argument violations (${nonLiteralTArgFindings.length}) - t() first argument must be a string literal:`,
    );
    for (const finding of nonLiteralTArgFindings) {
      console.log(
        `${finding.file}:${finding.line}:${finding.column} - non-literal key used in t() call`,
      );
    }
  }

  if (translatorParamFindings.length > 0) {
    console.log(
      `\nTranslator parameter violations (${translatorParamFindings.length}) - do not pass translator function as params:`,
    );
    for (const finding of translatorParamFindings) {
      console.log(
        `${finding.file}:${finding.line}:${finding.column} - ${finding.reason} (${finding.api})`,
      );
    }
  }

  if (translatorArgPassFindings.length > 0) {
    console.log(
      `\nTranslator argument pass violations (${translatorArgPassFindings.length}) - do not pass t as argument:`,
    );
    for (const finding of translatorArgPassFindings) {
      console.log(
        `${finding.file}:${finding.line}:${finding.column} - translator alias "t" passed to another function`,
      );
    }
  }


  if (getMessagesFindings.length > 0) {
    console.log(
      `\ngetMessages() call violations (${getMessagesFindings.length}) - do not use getMessages() to bypass translation keys in components or pages; use explicit t() literals instead so i18n-ally tracks usages:`,
    );
    for (const finding of getMessagesFindings) {
      console.log(`${finding.file}:${finding.line}:${finding.column} - getMessages() call`);
    }
  }

  if (rawCallFindings.length > 0) {
    console.log(
      `\nt.raw() call violations (${rawCallFindings.length}) - do not use t.raw(); use standard t() calls instead:`,
    );
    for (const finding of rawCallFindings) {
      console.log(`${finding.file}:${finding.line}:${finding.column} - t.raw() call`);
    }
  }

  if (jsonArrayFindings.length > 0) {
    console.log(
      `\nJSON message array violations (${jsonArrayFindings.length}) - arrays are forbidden in messages JSON files; use keyed objects instead:`,
    );
    for (const finding of jsonArrayFindings) {
      console.log(`${finding.file} - array found at key: ${finding.keyPath}`);
    }
  }

  process.exit(1);
}

main().catch((error) => {
  console.error("Failed to scan translator aliases:", error);
  process.exit(2);
});
