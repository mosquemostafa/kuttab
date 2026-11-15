import { NextResponse } from "next/server";

import { SUPPORTED_LOCALES } from "@/lib/locale-config";
import { env } from "@/server/lib/env";

export async function GET() {
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  const localeHomes = SUPPORTED_LOCALES.map(
    (locale) => `- Home (${locale}): ${appUrl}/${locale}`,
  ).join("\n");

  const body = [
    "# Almostafa",
    "",
    "> Almostafa is an Islamic Institute for teaching the Holy Quran, Tajweed, and Islamic studies, built on Next.js 16, React 19, Better Auth, PostgreSQL, and Drizzle ORM.",
    "",
    "## Overview",
    "",
    "Almostafa provides a comprehensive platform for Quranic education, featuring structured memorization circles, student and teacher management, bilingual Arabic RTL & English LTR localization, and an administrative portal.",
    "",
    "## Core Features",
    "",
    "### Authentication & Security",
    "- Better Auth integration with email and password",
    "- Role-based access control (Admin, User)",
    "- Session management, rate limiting, and password reset workflows",
    "",
    "### Modern Data Layer",
    "- PostgreSQL with Drizzle ORM",
    "- Zero-lock baseline migration tooling",
    "- Automated database seeding utilities",
    "",
    "### Bilingual & RTL Support",
    "- First-class Arabic (RTL) and English (LTR) with next-intl",
    "- Automatic locale detection and routing",
    "",
    "### Admin Portal",
    "- User management and analytics",
    "- Global application settings",
    "- Announcement broadcasting",
    "",
    "### Architecture",
    "- Strict feature-first layered architecture (Route Handler → Guard → Controller → Service → Repository → DTO/Zod)",
    "",
    "## Public Endpoints",
    localeHomes,
    `- Terms of Service: ${appUrl}/terms`,
    `- Privacy Policy: ${appUrl}/privacy`,
    `- Contact: ${appUrl}/contact`,
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
