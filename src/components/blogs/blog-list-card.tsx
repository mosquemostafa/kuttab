"use client";

import { ArrowRight, Calendar, Clock } from "lucide-react";

import {
  BLOG_COVER_SIZES,
  BlogCoverImage,
} from "@/components/blogs/blog-cover-image";
import { Link } from "@/i18n/navigation";
import { PublicBlogTagLinks } from "@/components/blogs/public-blog-tag-links";
import { Skeleton } from "@/components/ui/skeleton";
import {
  blogPostPath,
  type BlogReaderBasePath,
} from "@/lib/blogs/blog-reader-paths";
import type { BlogListItemDTO } from "@/shared/types/blog.types";

function resolveLocalizedValue(
  locale: string,
  arValue: string,
  enValue: string,
): string {
  return locale.startsWith("ar") ? arValue : enValue;
}

function formatPublishDate(locale: string, value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

/** Lucide glyphs sit low in the viewBox; nudge up so they optically match text-xs cap height. */
const metaRowIconClass =
  "size-3.5 shrink-0 -translate-y-[0.1em] text-muted-foreground/80";

type BlogListCardProps = {
  item: BlogListItemDTO;
  locale: string;
  basePath: BlogReaderBasePath;
  readMoreLabel: string;
  readingMinutesUnit: string;
  tagsLabel: string;
  noImageLabel: string;
  /** List index uses description; landing teasers often use excerpt. */
  summaryField?: "description" | "excerpt";
  /** First visible card on landing can set LCP priority */
  coverPriority?: boolean;
};

export function BlogListCard({
  item,
  locale,
  basePath,
  readMoreLabel,
  readingMinutesUnit,
  tagsLabel,
  noImageLabel,
  summaryField = "description",
  coverPriority = false,
}: BlogListCardProps) {
  const postHref = blogPostPath(basePath, item.slug);
  const localizedTitle = resolveLocalizedValue(
    locale,
    item.titleAr,
    item.titleEn,
  );
  const localizedSummary =
    summaryField === "excerpt"
      ? resolveLocalizedValue(locale, item.excerptAr, item.excerptEn)
      : resolveLocalizedValue(locale, item.descriptionAr, item.descriptionEn);

  const hasCoverUrl = Boolean(item.coverImageUrl?.trim());

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:border-border hover:shadow-md">
      <Link href={postHref} className="block w-full shrink-0">
        {hasCoverUrl ? (
          <BlogCoverImage
            src={item.coverImageUrl}
            alt={localizedTitle}
            sizes={BLOG_COVER_SIZES.cardGrid}
            priority={coverPriority}
            intrinsicHeight={800}
            wrapperClassName="relative aspect-16/10 w-full overflow-hidden bg-muted"
            imageClassName="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            fallback={
              <span className="px-6 text-sm text-muted-foreground">
                {noImageLabel}
              </span>
            }
          />
        ) : (
          <div className="relative flex aspect-16/10 w-full items-center justify-center bg-muted px-6 text-center text-sm text-muted-foreground">
            {noImageLabel}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        {item.tags.length > 0 ? (
          <div className="relative z-10 mb-3 shrink-0 space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {tagsLabel}
            </span>
            <PublicBlogTagLinks
              tags={item.tags}
              linkClassName="text-xs"
              tagListBasePath={basePath}
            />
          </div>
        ) : null}

        <h2 className="text-lg font-semibold leading-snug tracking-tight md:text-xl">
          <Link
            href={postHref}
            className="text-foreground decoration-primary/40 underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            {localizedTitle}
          </Link>
        </h2>

        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
          {localizedSummary}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5 leading-none">
              <Calendar className={metaRowIconClass} aria-hidden />
              <time dateTime={item.publishDate ?? undefined}>
                {formatPublishDate(locale, item.publishDate)}
              </time>
            </span>
            <span className="hidden text-border sm:inline" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1.5 leading-none">
              <Clock className={metaRowIconClass} aria-hidden />
              <span>
                {item.readingMinutes} {readingMinutesUnit}
              </span>
            </span>
          </div>
          <Link
            href={postHref}
            aria-label={`${readMoreLabel}: ${localizedTitle}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors"
          >
            <span>{readMoreLabel}</span>
            <span className="sr-only">: {localizedTitle}</span>
            <ArrowRight
              className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-out rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function BlogListCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <Skeleton className="aspect-16/10 w-full rounded-none" />
      <div className="space-y-3 p-5 md:p-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <Skeleton className="h-4 w-14 rounded-sm" />
            <Skeleton className="h-4 w-20 rounded-sm" />
          </div>
        </div>
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}
