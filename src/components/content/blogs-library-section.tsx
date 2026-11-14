"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { useLocale, useTranslations } from "next-intl";
import {
  Eye,
  ImageOff,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";

import {
  BLOG_COVER_SIZES,
  BlogCoverImage,
} from "@/components/blogs/blog-cover-image";
import { Link } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/api-client";
import type { BlogListItemDTO, BlogStatus } from "@/shared/types/blog.types";
import { Badge } from "@/components/ui/badge";
import { TagLabel } from "@/components/ui/hash-tag-label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const LIMIT = 10;

type StatusFilter = "all" | BlogStatus;

function statusBadgeClass(status: BlogStatus): string {
  if (status === "published") {
    return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-700";
  }

  if (status === "archived") {
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";
  }

  return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700";
}

export function BlogsLibrarySection() {
  const t = useTranslations("blogs");
  const locale = useLocale();
  const [isHydrated, setIsHydrated] = useState(false);
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set());

  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const [pendingDelete, setPendingDelete] = useState<BlogListItemDTO | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const swrKey = useMemo(
    () => ["admin-blogs", q, tag, statusFilter, page] as const,
    [q, tag, statusFilter, page],
  );

  const { data, error, mutate, isLoading } = useSWR(
    swrKey,
    ([, searchQuery, tagQuery, statusQuery, currentPage]) =>
      apiClient.adminBlogs.list({
        q: searchQuery || undefined,
        tag: tagQuery || undefined,
        status: statusQuery === "all" ? undefined : statusQuery,
        page: currentPage,
        limit: LIMIT,
      }),
    {
      revalidateOnFocus: false,
    },
  );

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, limit: LIMIT, total: 0, totalPages: 1 };
  const displayedTotal = isHydrated ? meta.total : 0;

  const getStatusLabel = (status: BlogStatus) => {
    if (status === "draft") {
      return t("status.draft");
    }

    if (status === "published") {
      return t("status.published");
    }

    return t("status.archived");
  };

  const getLocalizedTitle = (item: BlogListItemDTO) =>
    locale.startsWith("ar") ? item.titleAr : item.titleEn;

  const getLocalizedExcerpt = (item: BlogListItemDTO) =>
    locale.startsWith("ar") ? item.excerptAr : item.excerptEn;

  const onDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiClient.adminBlogs.delete(pendingDelete.id);
      toast.success(t("toasts.deleteSuccess"));
      setPendingDelete(null);
      mutate();
    } catch (deleteError) {
      if (deleteError instanceof Error) {
        toast.error(deleteError.message);
      } else {
        toast.error(t("toasts.deleteFailed"));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (value: string | null): string => {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString(locale);
  };

  const markImageBroken = (id: string) => {
    setBrokenImageIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{t("table.title")}</CardTitle>
          <CardDescription>
            {t("table.description", { total: displayedTotal })}
          </CardDescription>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <Input
            placeholder={t("filters.search")}
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
            className="md:w-64"
          />

          <Input
            placeholder={t("filters.tag")}
            value={tag}
            onChange={(event) => {
              setTag(event.target.value);
              setPage(1);
            }}
            className="md:w-48"
          />

          <div className="w-full md:w-44">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as StatusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                <SelectItem value="draft">{t("status.draft")}</SelectItem>
                <SelectItem value="published">
                  {t("status.published")}
                </SelectItem>
                <SelectItem value="archived">{t("status.archived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="button" variant="outline" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4" />
            {t("filters.refresh")}
          </Button>

          <Button asChild>
            <Link href="/content/blogs/create">
              <Plus className="h-4 w-4" />
              {t("table.create")}
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!isHydrated || isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{t("table.loadFailed")}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("table.empty")}</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => {
                const showImage =
                  Boolean(item.coverImageUrl) && !brokenImageIds.has(item.id);

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-lg border bg-card"
                  >
                    {showImage ? (
                      <BlogCoverImage
                        src={item.coverImageUrl}
                        alt={getLocalizedTitle(item)}
                        sizes={BLOG_COVER_SIZES.contentLibrary}
                        priority={index === 0}
                        wrapperClassName="relative aspect-video w-full bg-muted"
                        onLoadError={() => markImageBroken(item.id)}
                        fallback={
                          <span className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <ImageOff className="h-5 w-5" aria-hidden />
                            <span className="text-xs">
                              {t("gallery.noImage")}
                            </span>
                          </span>
                        }
                      />
                    ) : (
                      <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
                        <ImageOff className="h-5 w-5" aria-hidden />
                        <span className="text-xs">{t("gallery.noImage")}</span>
                      </div>
                    )}

                    <div className="space-y-3 p-3">
                      <h3 className="line-clamp-2 text-sm font-semibold">
                        {getLocalizedTitle(item)}
                      </h3>

                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {getLocalizedExcerpt(item)}
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={statusBadgeClass(item.status)}
                        >
                          {getStatusLabel(item.status)}
                        </Badge>
                        {item.isFeatured ? (
                          <Star
                            className="h-4 w-4 fill-amber-400 text-amber-500"
                            aria-label={t("table.columns.featured")}
                          />
                        ) : null}
                      </div>

                      {item.tags.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.tags.map((tag) => (
                            <Badge
                              key={`${item.id}-${tag}`}
                              variant="secondary"
                            >
                              <TagLabel tag={tag} />
                            </Badge>
                          ))}
                        </div>
                      ) : null}

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>
                          {t("table.columns.publishDate")}:{" "}
                          {formatDate(item.publishDate)}
                        </p>
                        <p>
                          {t("table.columns.readingMinutes")}:{" "}
                          {item.readingMinutes} {t("public.readingMinutesUnit")}
                        </p>
                        <p>
                          {t("table.columns.updatedAt")}:{" "}
                          {formatDate(item.updatedAt)}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Button
                          asChild
                          type="button"
                          variant="outline"
                          size="icon-sm"
                        >
                          <Link href={`/blogs/${item.slug}`}>
                            <Eye className="h-4 w-4" aria-hidden />
                            <span className="sr-only">
                              {t("public.readMore")}
                            </span>
                          </Link>
                        </Button>

                        <Button
                          asChild
                          type="button"
                          variant="outline"
                          size="icon-sm"
                        >
                          <Link href={`/content/blogs/${item.slug}`}>
                            <Pencil className="h-4 w-4" aria-hidden />
                            <span className="sr-only">{t("table.edit")}</span>
                          </Link>
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => setPendingDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          <span className="sr-only">{t("table.delete")}</span>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {meta.totalPages > 1 ? (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      text={t("table.previous")}
                      ariaLabel={t("table.previous")}
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      aria-disabled={meta.page === 1}
                      tabIndex={meta.page === 1 ? -1 : 0}
                      className={
                        meta.page === 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: meta.totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          isActive={meta.page === pageNumber}
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      text={t("table.next")}
                      ariaLabel={t("table.next")}
                      onClick={() =>
                        setPage((value) => Math.min(meta.totalPages, value + 1))
                      }
                      aria-disabled={meta.page === meta.totalPages}
                      tabIndex={meta.page === meta.totalPages ? -1 : 0}
                      className={
                        meta.page === meta.totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : null}
          </div>
        )}
      </CardContent>

      <ConfirmationDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => {
          if (!isDeleting) {
            setPendingDelete(null);
          }
        }}
        onConfirm={onDelete}
        title={t("deleteDialog.title")}
        description={t("deleteDialog.description", {
          title: pendingDelete ? getLocalizedTitle(pendingDelete) : "",
        })}
        confirmText={
          isDeleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")
        }
        cancelText={t("deleteDialog.cancel")}
        confirmVariant="destructive"
      />
    </Card>
  );
}
