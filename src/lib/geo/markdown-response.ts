import { NextResponse } from "next/server";

import { env } from "@/server/lib/env";

export function getAppUrlFromRequest(request: Request): string {
  const configured = env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
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

export function markdownResponse(
  markdown: string,
  {
    canonicalUrl,
    varyAccept = true,
  }: {
    canonicalUrl: string;
    varyAccept?: boolean;
  },
): NextResponse {
  const res = new NextResponse(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      ...(varyAccept ? { Vary: "Accept" } : {}),
      Link: `<${canonicalUrl}>; rel="canonical"`,
      "x-markdown-tokens": String(approxMarkdownTokens(markdown)),
    },
  });

  return res;
}
