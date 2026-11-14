import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BlogAuthorAvatar } from "@/components/blogs/blog-author-avatar";
import { BlogCommentsSection } from "@/components/blogs/blog-comments-section";
import { BlogCommentsTeaser } from "@/components/blogs/blog-comments-teaser";
import { BlogListCard } from "@/components/blogs/blog-list-card";
import { BlogPostShareButton } from "@/components/blogs/blog-post-share-button";
import { PublicBlogTagLinks } from "@/components/blogs/public-blog-tag-links";
import {
  BLOG_COVER_SIZES,
  BlogCoverImage,
} from "@/components/blogs/blog-cover-image";
import { ReadingProgressBar } from "@/components/blogs/reading-progress-bar";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { Link } from "@/i18n/navigation";
import {
  fetchBlogAuthorDisplay,
  type BlogAuthorDisplay,
} from "@/lib/blogs/fetch-blog-author";
import { fetchPublishedRelatedBlogs } from "@/lib/blogs/fetch-public-blogs";
import type { BlogReaderBasePath } from "@/lib/blogs/blog-reader-paths";
import { env } from "@/server/lib/env";
import type { BlogDTO } from "@/shared/types/blog.types";

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
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

type BlogPostViewProps = {
  locale: string;
  blog: BlogDTO;
  basePath: BlogReaderBasePath;
  /** When provided (including null), skips loading the author again */
  authorOverride?: BlogAuthorDisplay | null;
  /** Public: blurred teaser + sign-in CTA. Dashboard: full comments for signed-in users. */
  commentsMode?: "teaser" | "interactive";
  /** Required when `commentsMode` is `interactive` (dashboard reader). */
  sessionUser?: { id: string; role: string | null };
};

export async function BlogPostView({
  locale,
  blog,
  basePath,
  authorOverride,
  commentsMode,
  sessionUser,
}: BlogPostViewProps) {
  const t = await getTranslations({ locale, namespace: "blogs" });

  const [relatedItems, author] = await Promise.all([
    fetchPublishedRelatedBlogs(blog.id),
    authorOverride !== undefined
      ? Promise.resolve(authorOverride)
      : fetchBlogAuthorDisplay(blog.authorId),
  ]);

  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const publicShareUrl = `${appUrl}/${locale}/blogs/${blog.slug}`;

  const localizedTitle = resolveLocalizedValue(
    locale,
    blog.titleAr,
    blog.titleEn,
  );
  const localizedDescription = resolveLocalizedValue(
    locale,
    blog.descriptionAr,
    blog.descriptionEn,
  );
  const localizedContent = resolveLocalizedValue(
    locale,
    blog.contentAr,
    blog.contentEn,
  );
  const dir = locale.startsWith("ar") ? "rtl" : "ltr";

  return (
    <article id="blog-reading-article" dir={dir}>
      <header className="bg-background">
        <div className="mx-auto max-w-4xl px-4 pb-10 pt-6 md:pb-14 md:pt-10">
          <Link
            href={basePath}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-border hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            {t("public.backToList")}
          </Link>

          <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl lg:leading-[1.12]">
            {localizedTitle}
          </h1>

          <p className="mt-5 max-w-3xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed">
            {localizedDescription}
          </p>

          {author ? (
            <div className="mt-8 flex items-center gap-3 sm:gap-4">
              <BlogAuthorAvatar name={author.name} imageUrl={author.image} />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("public.author")}
                </p>
                <p className="truncate text-base font-semibold text-foreground md:text-lg">
                  {author.name}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <time
                className="font-medium text-foreground/80"
                dateTime={blog.publishDate ?? undefined}
              >
                {formatPublishDate(locale, blog.publishDate)}
              </time>
              <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
              <span>
                {blog.readingMinutes} {t("public.readingMinutesUnit")}
              </span>
            </div>
            <BlogPostShareButton
              shareUrl={publicShareUrl}
              shareTitle={localizedTitle}
            />
          </div>

          {blog.tags.length > 0 ? (
            <div className="mt-8 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("public.tags")}
              </p>
              <PublicBlogTagLinks tags={blog.tags} tagListBasePath={basePath} />
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4">
        <div className="-mt-6 md:-mt-10">
          {blog.coverImageUrl ? (
            <BlogCoverImage
              src={blog.coverImageUrl}
              alt={localizedTitle}
              sizes={BLOG_COVER_SIZES.hero}
              priority
              wrapperClassName="relative aspect-video w-full overflow-hidden rounded-lg bg-muted"
              fallback={
                <span className="px-6 text-sm text-muted-foreground">
                  {t("gallery.noImage")}
                </span>
              }
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg bg-muted px-6 text-center text-sm text-muted-foreground">
              {t("gallery.noImage")}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 md:pb-20 md:pt-14">
        <RichTextDisplay
          markdown={localizedContent}
          lang={locale}
          dir={dir}
          className="max-w-none text-[15px] leading-relaxed md:text-base md:leading-[1.75]"
        />
      </div>

      {commentsMode === "teaser" ? (
        <section className="border-t border-border/60 bg-muted/15">
          <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
            <BlogCommentsTeaser />
          </div>
        </section>
      ) : null}

      {commentsMode === "interactive" && sessionUser ? (
        <section className="border-t border-border/60 bg-muted/10">
          <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
            <BlogCommentsSection
              blogSlug={blog.slug}
              locale={locale}
              currentUserId={sessionUser.id}
              userRole={sessionUser.role}
            />
          </div>
        </section>
      ) : null}

      {relatedItems.length > 0 ? (
        <section
          className="border-t border-border/60 bg-muted/15"
          aria-labelledby="blog-related-heading"
        >
          <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
            <h2
              id="blog-related-heading"
              className="mb-8 text-xl font-bold tracking-tight md:text-2xl"
            >
              {t("public.relatedPosts")}
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 md:gap-10">
              {relatedItems.map((item, index) => (
                <BlogListCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  basePath={basePath}
                  readMoreLabel={t("public.readMore")}
                  readingMinutesUnit={t("public.readingMinutesUnit")}
                  tagsLabel={t("public.tags")}
                  noImageLabel={t("gallery.noImage")}
                  coverPriority={index === 0}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ReadingProgressBar dir={dir} />
    </article>
  );
}
