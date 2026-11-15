import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { BlogListCard } from "@/components/blogs/blog-list-card";
import { PublicBlogTagLinks } from "@/components/blogs/public-blog-tag-links";
import { TagLabel } from "@/components/ui/hash-tag-label";
import {
  fetchPublishedBlogList,
  fetchPublishedBlogTopTags,
} from "@/lib/blogs/fetch-public-blogs";
import {
  blogListIndexHref,
  type BlogReaderBasePath,
} from "@/lib/blogs/blog-reader-paths";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

type BlogListViewProps = {
  locale: string;
  tagFilter?: string;
  basePath: BlogReaderBasePath;
  page: number;
};

export async function BlogListView({
  locale,
  tagFilter,
  basePath,
  page,
}: BlogListViewProps) {
  const t = await getTranslations({ locale });

  const [{ items, meta, loadFailed }, topTags] = await Promise.all([
    fetchPublishedBlogList(tagFilter, page),
    fetchPublishedBlogTopTags(),
  ]);

  const isDashboard = basePath === "/dashboard/blogs";
  const homeCrumb = isDashboard
    ? {
        href: "/dashboard/overview" as const,
        label: t("dashboard.shell.dashboard"),
      }
    : { href: "/" as const, label: t("blogs.public.breadcrumbHome") };

  const dir = locale.startsWith("ar") ? "rtl" : "ltr";

  return (
    <div dir={dir}>
      <header className="border-b border-border/60 bg-background bg-islamic-stars">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14 lg:py-16">
          {tagFilter ? (
            <div className="max-w-3xl">
              <nav
                className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
                aria-label="Breadcrumb"
              >
                <Link
                  href={homeCrumb.href}
                  className="rounded-md px-1 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
                >
                  {homeCrumb.label}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50 rtl:rotate-180" />
                <Link
                  href={basePath}
                  className="rounded-md px-1 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
                >
                  {t("blogs.public.breadcrumbBlog")}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50 rtl:rotate-180" />
                <span className="truncate font-medium text-foreground">
                  <TagLabel tag={tagFilter} />
                </span>
              </nav>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                {t("blogs.public.tagFilterTitleLead")}
                <TagLabel tag={tagFilter} />
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {t("blogs.public.tagFilterDescription")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-6 rounded-full"
                asChild
              >
                <Link href={basePath}>{t("blogs.public.clearTagFilter")}</Link>
              </Button>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {t("blogs.public.listEyebrow")}
              </p>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                {t("blogs.public.listTitle")}
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {t("blogs.public.listDescription")}
              </p>
            </div>
          )}
        </div>

        {topTags.length > 0 ? (
          <div className="border-t border-border/50 bg-muted/10">
            <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
              <p
                id="blog-list-popular-tags-heading"
                className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t("blogs.public.popularTags")}
              </p>
              <nav aria-labelledby="blog-list-popular-tags-heading">
                <PublicBlogTagLinks
                  tags={topTags}
                  tagListBasePath={basePath}
                  className="gap-x-3 gap-y-1.5"
                />
              </nav>
            </div>
          </div>
        ) : null}
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14 lg:py-16">
        {loadFailed ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {t("blogs.public.loadFailed")}
          </p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
            <p className="text-muted-foreground">{t("blogs.public.empty")}</p>
            {tagFilter ? (
              <Button variant="link" className="mt-2" asChild>
                <Link href={basePath}>{t("blogs.public.clearTagFilter")}</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-3">
              {items.map((item, index) => (
                <BlogListCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  basePath={basePath}
                  readMoreLabel={t("blogs.public.readMore")}
                  readingMinutesUnit={t("blogs.public.readingMinutesUnit")}
                  tagsLabel={t("blogs.public.tags")}
                  noImageLabel={t("blogs.gallery.noImage")}
                  coverPriority={index === 0}
                />
              ))}
            </div>

            {meta.totalPages > 1 ? (
              <Pagination className="mt-12">
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      asChild
                      variant="ghost"
                      size="default"
                      className="gap-1 ps-2!"
                    >
                      <Link
                        href={blogListIndexHref(basePath, {
                          tag: tagFilter,
                          page: meta.page > 1 ? meta.page - 1 : 1,
                        })}
                        aria-label={t("blogs.table.previous")}
                        aria-disabled={meta.page <= 1}
                        tabIndex={meta.page <= 1 ? -1 : undefined}
                        className={cn(
                          meta.page <= 1 && "pointer-events-none opacity-50",
                        )}
                      >
                        <ChevronLeft
                          data-icon="inline-start"
                          className="rtl:rotate-180"
                        />
                        <span className="hidden sm:block">
                          {t("blogs.table.previous")}
                        </span>
                      </Link>
                    </Button>
                  </PaginationItem>

                  {Array.from({ length: meta.totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    const isActive = meta.page === pageNumber;
                    return (
                      <PaginationItem key={pageNumber}>
                        <Button
                          asChild
                          variant={isActive ? "outline" : "ghost"}
                          size="icon"
                        >
                          <Link
                            href={blogListIndexHref(basePath, {
                              tag: tagFilter,
                              page: pageNumber,
                            })}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {pageNumber}
                          </Link>
                        </Button>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <Button
                      asChild
                      variant="ghost"
                      size="default"
                      className="gap-1 pe-2!"
                    >
                      <Link
                        href={blogListIndexHref(basePath, {
                          tag: tagFilter,
                          page:
                            meta.page < meta.totalPages
                              ? meta.page + 1
                              : meta.totalPages,
                        })}
                        aria-label={t("blogs.table.next")}
                        aria-disabled={meta.page >= meta.totalPages}
                        tabIndex={meta.page >= meta.totalPages ? -1 : undefined}
                        className={cn(
                          meta.page >= meta.totalPages &&
                            "pointer-events-none opacity-50",
                        )}
                      >
                        <span className="hidden sm:block">
                          {t("blogs.table.next")}
                        </span>
                        <ChevronRight
                          data-icon="inline-end"
                          className="rtl:rotate-180"
                        />
                      </Link>
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
