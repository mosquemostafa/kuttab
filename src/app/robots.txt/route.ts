import { NextResponse } from "next/server";

import { SUPPORTED_LOCALES } from "@/lib/locale-config";
import { env } from "@/server/lib/env";

const PRIVATE_PATH_SEGMENTS = [
  "auth",
  "dashboard",
  "admin",
  "content",
  "support",
  "docs",
  "help",
] as const;

function buildLocalePrivatePaths(): string[] {
  return SUPPORTED_LOCALES.flatMap((locale) =>
    PRIVATE_PATH_SEGMENTS.map((segment) => `/${locale}/${segment}`),
  );
}

function renderGroup({
  userAgents,
  allow,
  disallow,
}: {
  userAgents: string[];
  allow: string[];
  disallow: string[];
}): string {
  const lines: string[] = [];
  for (const ua of userAgents) lines.push(`User-agent: ${ua}`);
  for (const path of allow) lines.push(`Allow: ${path}`);
  for (const path of disallow) lines.push(`Disallow: ${path}`);
  return `${lines.join("\n")}\n`;
}

export async function GET() {
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  const disallow = ["/api/", ...buildLocalePrivatePaths()];
  const allow = ["/"];

  const body = [
    "# robots.txt",
    "# GEO: make the site discoverable by AI search agents while keeping private surfaces disallowed.",
    "",
    renderGroup({ userAgents: ["*"], allow, disallow }),
    renderGroup({ userAgents: ["Googlebot"], allow, disallow }),
    renderGroup({ userAgents: ["Google-Extended"], allow, disallow }),
    renderGroup({ userAgents: ["GoogleOther"], allow, disallow }),
    renderGroup({ userAgents: ["OAI-SearchBot"], allow, disallow }),
    renderGroup({ userAgents: ["ChatGPT-User"], allow, disallow }),
    renderGroup({
      userAgents: ["Claude-Search", "Claude-User"],
      allow,
      disallow,
    }),
    renderGroup({ userAgents: ["GPTBot"], allow: [], disallow: ["/"] }),
    renderGroup({
      userAgents: ["ClaudeBot", "Claude-Web"],
      allow: [],
      disallow: ["/"],
    }),
    `Sitemap: ${appUrl}/sitemap.xml`,
    "",
    "# Content Signals (used by AI search & answer agents)",
    "Content-Signal: search=yes, ai-input=yes, ai-train=no, use=reference",
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
