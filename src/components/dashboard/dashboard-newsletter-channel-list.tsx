"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/api-client";
import type { NewsletterChannelListItemDTO } from "@/shared/types/newsletter.types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const defaultLimit = 10;

export function DashboardNewsletterChannelList() {
  const t = useTranslations("newsletterChannel.list");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? arSA : enUS;
  const [page, setPage] = useState(1);

  const swrKey = useMemo(
    () => ["dashboard-newsletter-channel", page, defaultLimit] as const,
    [page],
  );

  const { data, error, isLoading } = useSWR(
    swrKey,
    ([, p, l]) => apiClient.dashboardNewsletters.list({ page: p, limit: l }),
    { revalidateOnFocus: false, dedupingInterval: 2000 },
  );

  const items = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 0;

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const headline = useCallback(
    (row: NewsletterChannelListItemDTO) =>
      locale === "ar" ? row.subjectAr : row.subjectEn,
    [locale],
  );

  const excerpt = useCallback(
    (row: NewsletterChannelListItemDTO) =>
      locale === "ar" ? row.excerptAr : row.excerptEn,
    [locale],
  );

  const publishedLine = useCallback(
    (row: NewsletterChannelListItemDTO) => {
      const raw = row.startedAt ?? row.completedAt ?? row.createdAt;
      if (!raw) return "—";
      return format(new Date(raw), "PP", { locale: dateLocale });
    },
    [dateLocale],
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pageNumbers: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);
    if (endPage - startPage < maxPagesToShow - 1) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-disabled={page === 1}
              tabIndex={page === 1 ? -1 : 0}
              className={page === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
              </PaginationItem>
              {startPage > 2 && <PaginationEllipsis />}
            </>
          )}
          {pageNumbers.map((pNum) => (
            <PaginationItem key={pNum}>
              <PaginationLink
                isActive={pNum === page}
                onClick={() => setPage(pNum)}
              >
                {pNum}
              </PaginationLink>
            </PaginationItem>
          ))}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationLink onClick={() => setPage(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-disabled={page === totalPages}
              tabIndex={page === totalPages ? -1 : 0}
              className={
                page === totalPages ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (error) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {t("loadError")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {!error && data ? (
        <p className="text-muted-foreground text-sm">
          {t("summary", { count: items.length, total })}
        </p>
      ) : null}

      <ul className="divide-y rounded-xl border border-border bg-card">
        {isLoading && !data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex gap-4 p-4">
              <Skeleton className="size-20 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="h-3 max-w-lg w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </li>
          ))
        ) : !items.length ? (
          <li className="text-muted-foreground px-4 py-10 text-center text-sm">
            {t("empty")}
          </li>
        ) : (
          items.map((row) => (
            <li key={row.id}>
              <Link
                href={`/dashboard/newsletter/${row.slug}`}
                className="hover:bg-muted/40 flex gap-4 p-4 transition-colors"
              >
                {row.coverImageUrl ? (
                  <img
                    src={row.coverImageUrl}
                    alt=""
                    className="size-20 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="bg-muted size-20 shrink-0 rounded-lg"
                    aria-hidden
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className="font-medium leading-snug tracking-tight"
                    dir={locale === "ar" ? "rtl" : "ltr"}
                  >
                    {headline(row)}
                  </p>
                  {excerpt(row) ? (
                    <p
                      className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-relaxed"
                      dir={locale === "ar" ? "rtl" : "ltr"}
                    >
                      {excerpt(row)}
                    </p>
                  ) : null}
                  <p className="text-muted-foreground mt-2 text-xs">
                    {t("dateLabel")}: {publishedLine(row)}
                  </p>
                </div>
                <ChevronRight
                  className="text-muted-foreground mt-1 size-5 shrink-0 rtl:rotate-180"
                  aria-hidden
                />
              </Link>
            </li>
          ))
        )}
      </ul>

      <div className="flex justify-end pt-2">{renderPagination()}</div>
    </div>
  );
}
