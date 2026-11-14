import "server-only";

import type { BlogAuthorDisplay } from "@/lib/blogs/fetch-blog-author";
import { organizationNode, trimmedAppBaseUrl } from "@/lib/seo/schema-org-base";
import { env } from "@/server/lib/env";
import type { BlogDTO } from "@/shared/types/blog.types";

function absoluteCoverUrl(
  coverImageUrl: string | undefined,
): string | undefined {
  const trimmed = coverImageUrl?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

function plainTextFromMaybeHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function localizedField(locale: string, ar: string, en: string): string {
  return locale.startsWith("ar") ? ar : en;
}

export function buildBlogPostJsonLd(options: {
  locale: string;
  slug: string;
  blog: BlogDTO;
  author: BlogAuthorDisplay | null;
}): Record<string, unknown> {
  const { locale, slug, blog, author } = options;
  const base = trimmedAppBaseUrl(env.NEXT_PUBLIC_APP_URL);
  const articleUrl = `${base}/${locale}/blogs/${encodeURIComponent(slug)}`;

  const headline = localizedField(locale, blog.titleAr, blog.titleEn);
  const description = plainTextFromMaybeHtml(
    localizedField(locale, blog.descriptionAr, blog.descriptionEn),
  );
  const imageUrl = absoluteCoverUrl(blog.coverImageUrl);
  const published = blog.publishDate ?? blog.createdAt;

  const authorNode: Record<string, unknown> = author
    ? {
        "@type": "Person",
        name: author.name,
        ...(author.image ? { image: author.image } : {}),
      }
    : {
        "@type": "Organization",
        name: "SaaS Starter",
      };

  const blogPosting: Record<string, unknown> = {
    "@type": "BlogPosting",
    "@id": `${articleUrl}#article`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    url: articleUrl,
    headline,
    description,
    datePublished: published,
    dateModified: blog.updatedAt,
    author: authorNode,
    publisher: { "@id": `${base}/#organization` },
    inLanguage: locale,
    ...(blog.tags.length > 0 ? { keywords: blog.tags.join(", ") } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(blog.readingMinutes > 0
      ? { timeRequired: `PT${blog.readingMinutes}M` }
      : {}),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(env.NEXT_PUBLIC_APP_URL), blogPosting],
  };
}
