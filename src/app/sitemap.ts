export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/locale-config";
import { env } from "@/server/lib/env";
import { blogService } from "@/server/modules/blogs/blog.service";

const staticRoutes = ["/", "/blogs", "/contact", "/privacy", "/terms"];

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

  const homeAlternates = hreflangLanguages("/");

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: trimmedAppUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
      alternates: { languages: homeAlternates },
    },
    ...staticRoutes.flatMap((route) =>
      sitemapEntriesForRoute(route, {
        lastModified: now,
        changeFrequency: route === "/" ? "daily" : "weekly",
        priority: route === "/" ? 1 : 0.7,
      }),
    ),
  ];

  let publishedBlogSlugs: Array<{ slug: string; updatedAt: string }> = [];

  try {
    publishedBlogSlugs = await blogService.listPublishedSlugs();
  } catch (error) {
    console.error("Failed to fetch blog slugs for sitemap:", error);
  }

  const blogEntries: MetadataRoute.Sitemap = publishedBlogSlugs.flatMap(
    (post) => {
      const route = `/blogs/${encodeURIComponent(post.slug)}`;

      return sitemapEntriesForRoute(route, {
        lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    },
  );

  return [...staticEntries, ...blogEntries];
}
