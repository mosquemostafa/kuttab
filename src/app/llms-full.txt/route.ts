import { NextResponse } from "next/server";

import { SUPPORTED_LOCALES } from "@/lib/locale-config";
import { env } from "@/server/lib/env";

export async function GET() {
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  const localeHomes = SUPPORTED_LOCALES.map(
    (locale) => `- Home (${locale}): ${appUrl}/${locale}`,
  ).join("\n");

  const body = [
    "# Almostafa — Full Platform & Technical Documentation",
    "",
    "> Production-grade platform for Almostafa Islamic Institute for Quran teaching, equipped with Better Auth, PostgreSQL + Drizzle ORM, multi-tenant RBAC, bilingual Arabic RTL & English LTR localization, and a comprehensive Admin Portal.",
    "",
    "## 1. Product Overview",
    "",
    "Almostafa provides a comprehensive platform for teaching the Holy Quran, Tajweed, and Islamic studies.",
    "It follows a strict feature-first, layered architecture (Route Handler → Guard → Controller → Service → Repository → DTO/Zod).",
    "",
    "## 2. Core Modules & Capabilities",
    "",
    "### Authentication & Access Control",
    "- Better Auth integration supporting credentials (email and password)",
    "- Role-based access control with Admin, Support, and User guards",
    "- Rate-limited authentication endpoints using Upstash Redis",
    "- Secure password reset and email verification workflows",
    "",
    "### Data Layer & Storage",
    "- PostgreSQL persistence managed with type-safe Drizzle ORM",
    "- Zero-lock baseline migration tooling",
    "- Cloudflare R2 / S3-compatible asset and user-media storage",
    "",
    "### Bilingual & RTL Support",
    "- Built-in Arabic (RTL) and English (LTR) with next-intl",
    "- Automated locale routing and persistent language switching",
    "",
    "### Admin Portal",
    "- User administration: inspect users, ban/unban, impersonate, and revoke sessions",
    "- System-wide settings and marketing announcements",
    "- Interactive Swagger OpenAPI documentation",
    "",
    "",
    "## 3. Public Routes",
    localeHomes,
    `- Terms of Service: ${appUrl}/terms`,
    `- Privacy Policy: ${appUrl}/privacy`,
    `- Contact: ${appUrl}/contact`,
    `- API Documentation: ${appUrl}/docs`,
    `- Sitemap: ${appUrl}/sitemap.xml`,
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}
