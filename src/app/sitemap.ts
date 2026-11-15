export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/locale-config";
import { env } from "@/server/lib/env";

const staticRoutes = ["/contact", "/privacy", "/terms"];

const trimmedAppUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

function buildUrl(locale: string, route: string) {
  const localeBase = `${trimmedAppUrl}/${locale}`;
  return route === "/" ? localeBase : `${localeBase}${route}`;
}

function hreflangLanguages(route: string): Record<string, string> {
  const languages: Record<string, string> = {
    "x-default": buildUrl(DEFAULT_LOCALE, route),
  };
  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = buildUrl(locale, route);
  }
  return languages;
}

function sitemapEntriesForRoute(
  route: string,
  opts: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap {
  return SUPPORTED_LOCALES.map((locale) => ({
    url: buildUrl(locale, route),
    ...opts,
    alternates: {
      languages: hreflangLanguages(route),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.flatMap((route) =>
    sitemapEntriesForRoute(route, {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  return staticEntries;
}
