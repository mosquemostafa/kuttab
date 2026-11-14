"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import type { NewsletterSubscriberDTO } from "@/shared/types/newsletter.types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SUB_PAGE_PARAM = "sPage";
const SUB_LIMIT_PARAM = "sLimit";
const defaultLimit = 10;

export function NewsletterSubscribersTable() {
  const t = useTranslations("contentNewsletter");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isHydrated, setIsHydrated] = useState(false);
  const [page, setPage] = useState(
    Number(searchParams.get(SUB_PAGE_PARAM)) || 1,
  );
  const [limit] = useState(
    Math.min(
      100,
      Math.max(1, Number(searchParams.get(SUB_LIMIT_PARAM)) || defaultLimit),
    ),
  );

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const nextPage = String(page);
    const nextLimit = String(limit);
    if (
      searchParams.get(SUB_PAGE_PARAM) === nextPage &&
      searchParams.get(SUB_LIMIT_PARAM) === nextLimit
    ) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set(SUB_PAGE_PARAM, nextPage);
    params.set(SUB_LIMIT_PARAM, nextLimit);
    router.replace(`?${params.toString()}`);
  }, [isHydrated, limit, page, router, searchParams]);

  const swrKey = useMemo(
    () => ["content-newsletter-subscribers", page, limit] as const,
    [page, limit],
  );

  const { data, error, mutate, isLoading } = useSWR(
    isHydrated ? swrKey : null,
    ([, p, l]) =>
      apiClient.contentNewsletter.listSubscribers({ page: p, limit: l }),
    { revalidateOnFocus: false, dedupingInterval: 2000 },
  );

  const subscribers = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 0;

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
      <Card>
        <CardHeader>
          <CardTitle>{t("subscribers.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">
            {t("subscribers.loadListError")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("subscribers.heading")}</CardTitle>
        <CardDescription>{t("subscribers.tableDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            {!error && data
              ? t("subscribers.tableSummary", {
                  count: subscribers.length,
                  total,
                })
              : null}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void mutate()}
            disabled={isLoading}
          >
            <RefreshCw className="size-4" />
            {t("subscribers.refresh")}
          </Button>
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table className="text-sm">
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">
                  {t("subscribers.email")}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">
                  {t("subscribers.status")}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">
                  {t("subscribers.locale")}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">
                  {t("subscribers.created")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isHydrated || (!data && isLoading) ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !subscribers.length ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground px-4 py-6 text-center text-sm"
                  >
                    {t("subscribers.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                subscribers.map((row: NewsletterSubscriberDTO) => (
                  <TableRow key={row.id}>
                    <TableCell className="px-4 py-3">{row.email}</TableCell>
                    <TableCell className="px-4 py-3">{row.status}</TableCell>
                    <TableCell className="px-4 py-3">
                      {row.locale ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground px-4 py-3 text-xs">
                      {format(new Date(row.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex justify-end">{renderPagination()}</div>
      </CardContent>
    </Card>
  );
}
