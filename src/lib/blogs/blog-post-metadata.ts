import "server-only";

import type { Metadata } from "next";

import { env } from "@/server/lib/env";
import type { BlogDTO } from "@/shared/types/blog.types";

function localizedBlogFields(locale: string, blog: BlogDTO) {
  const useAr = locale.startsWith("ar");
  return {
    title: useAr ? blog.titleAr : blog.titleEn,
    description: useAr ? blog.descriptionAr : blog.descriptionEn,
  };
}

function localizedAppName(_locale: string): string {
  return "SaaS Starter";
}

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

type BlogPostMetadataVariant = "public" | "dashboard";

/**
 * SEO metadata for a published blog post: localized title/description,
 * keywords from tags, Open Graph + Twitter with cover image.
 */
export function buildBlogPostMetadata(options: {
  locale: string;
  slug: string;
  blog: BlogDTO;
  variant: BlogPostMetadataVariant;
}): Metadata {
  const { locale, slug, blog, variant } = options;
  const { title, description } = localizedBlogFields(locale, blog);
  const pageTitle = `${localizedAppName(locale)} | ${title}`;
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const publicPath = `/${locale}/blogs/${slug}`;
  const publicCanonical = `${appUrl}${publicPath}`;

  const ogImageUrl = absoluteCoverUrl(blog.coverImageUrl);
  const keywords = blog.tags.length > 0 ? blog.tags : undefined;

  const metadata: Metadata = {
    title: pageTitle,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: publicCanonical,
    },
    openGraph: {
      title: pageTitle,
      description,
      url: publicCanonical,
      type: "article",
      locale,
      siteName: "SaaS Starter",
      publishedTime: blog.publishDate ?? blog.createdAt,
      modifiedTime: blog.updatedAt,
      ...(blog.tags.length > 0 ? { tags: blog.tags } : {}),
      ...(ogImageUrl
        ? {
            images: [
              {
                url: ogImageUrl,
                width: 1200,
                height: 630,
                alt: title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
  };

  if (variant === "dashboard") {
    metadata.robots = { index: false, follow: false };
  }

  return metadata;
}
