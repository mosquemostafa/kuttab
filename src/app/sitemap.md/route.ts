import { NextResponse } from "next/server";

import sitemap from "../sitemap";
import { env } from "@/server/lib/env";

export async function GET() {
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const entries = await sitemap();

  const urls = Array.from(new Set(entries.map((e) => e.url))).sort();

  const body = [
    "# Sitemap (Markdown)",
    "",
    `Canonical XML sitemap: ${appUrl}/sitemap.xml`,
    "",
    "## URLs (from sitemap.xml)",
    ...urls.map((url) => `- ${url}`),
    "",
  ].join("\n");

  const canonicalUrl = `${appUrl}/sitemap.xml`;
  return new NextResponse(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      Link: `<${canonicalUrl}>; rel="canonical"`,
      "x-markdown-tokens": String(approxMarkdownTokens(body)),
    },
  });
}

function approxMarkdownTokens(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .trim();

  if (!text) return 0;
  return text.split(/[\s\u00A0]+/).filter(Boolean).length;
}
