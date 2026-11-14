"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Eye, PenSquare, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { Link } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/api-client";
import type { NewsletterCampaignListItemDTO } from "@/shared/types/newsletter.types";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

const CAMPAIGN_PAGE_PARAM = "cPage";
const CAMPAIGN_LIMIT_PARAM = "cLimit";
const defaultLimit = 10;

export function NewsletterCampaignsTable({
  deliveryEnabled,
}: {
  deliveryEnabled: boolean;
}) {
  const t = useTranslations("contentNewsletter");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isHydrated, setIsHydrated] = useState(false);
  const [page, setPage] = useState(
    Number(searchParams.get(CAMPAIGN_PAGE_PARAM)) || 1,
  );
  const [limit] = useState(
    Math.min(
      50,
      Math.max(
        1,
        Number(searchParams.get(CAMPAIGN_LIMIT_PARAM)) || defaultLimit,
      ),
    ),
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const nextPage = String(page);
    const nextLimit = String(limit);
    if (
      searchParams.get(CAMPAIGN_PAGE_PARAM) === nextPage &&
      searchParams.get(CAMPAIGN_LIMIT_PARAM) === nextLimit
    ) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set(CAMPAIGN_PAGE_PARAM, nextPage);
    params.set(CAMPAIGN_LIMIT_PARAM, nextLimit);
    router.replace(`?${params.toString()}`);
  }, [isHydrated, limit, page, router, searchParams]);

  const swrKey = useMemo(
    () => ["content-newsletter-campaigns", page, limit] as const,
    [page, limit],
  );

  const { data, error, mutate, isLoading } = useSWR(
    isHydrated ? swrKey : null,
    ([, p, l]) =>
      apiClient.contentNewsletter.listCampaigns({ page: p, limit: l }),
    { revalidateOnFocus: false, dedupingInterval: 2000 },
  );

  const deleteDraftCampaign = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        await apiClient.contentNewsletter.deleteDraftCampaign(id);
        toast.success(t("campaigns.deleted"));
        await mutate();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      } finally {
        setDeletingId(null);
      }
    },
    [mutate, t],
  );

  const campaigns = data?.items ?? [];
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

  const headerActions = (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <p className="text-muted-foreground text-sm">
        {!error && data
          ? t("campaigns.tableSummary", {
              count: campaigns.length,
              total,
            })
          : null}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void mutate()}
          disabled={isLoading}
        >
          <RefreshCw className="size-4" />
          {t("campaigns.refresh")}
        </Button>
        {deliveryEnabled ? (
          <Button size="sm" asChild>
            <Link href="/content/newsletter/create">
              <Plus className="size-4" />
              {t("campaigns.create")}
            </Link>
          </Button>
        ) : (
          <Button size="sm" disabled title={t("disabled")}>
            <Plus className="size-4" />
            {t("campaigns.create")}
          </Button>
        )}
      </div>
    </div>
  );

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("campaigns.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">
            {t("campaigns.loadListError")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("campaigns.heading")}</CardTitle>
        <CardDescription>{t("campaigns.tableDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {headerActions}
        <div className="overflow-hidden rounded-lg border">
          <Table className="text-sm">
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">
                  {t("campaigns.subjectArColumn")}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">
                  {t("campaigns.subjectEnColumn")}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">
                  {t("campaigns.publicOnSiteColumn")}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">
                  {t("campaigns.slugColumn")}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">
                  {t("campaigns.status")}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">
                  {t("campaigns.created")}
                </TableHead>
                <TableHead className="px-4 py-3 text-end text-xs font-medium text-muted-foreground">
                  {t("campaigns.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isHydrated || (!data && isLoading) ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end">
                      <Skeleton className="ms-auto h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !campaigns.length ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground px-4 py-6 text-center text-sm"
                  >
                    {t("campaigns.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((row: NewsletterCampaignListItemDTO) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-[min(28vw,220px)] px-4 py-3 align-top">
                      <span
                        className="line-clamp-2 wrap-break-word text-sm"
                        dir="rtl"
                        title={row.subjectAr}
                      >
                        {row.subjectAr}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[min(28vw,220px)] px-4 py-3 align-top">
                      <span
                        className="line-clamp-2 wrap-break-word text-sm"
                        dir="ltr"
                        title={row.subjectEn}
                      >
                        {row.subjectEn}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {row.isWebsitePublic ? (
                        <Badge variant="secondary">{t("campaigns.yes")}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          {t("campaigns.no")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {row.slug ? (
                        <span
                          className="font-mono text-xs wrap-break-word"
                          dir="ltr"
                        >
                          {row.slug}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">{row.status}</TableCell>
                    <TableCell className="text-muted-foreground px-4 py-3 text-xs">
                      {format(new Date(row.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {row.status === "draft" ? (
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`/content/newsletter/${row.id}`}
                              aria-label={t("campaigns.edit")}
                            >
                              <PenSquare className="size-4" />
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`/content/newsletter/${row.id}`}
                              aria-label={t("campaigns.view")}
                            >
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                        )}
                        {row.status === "draft" ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={deletingId !== null}
                                aria-label={t("campaigns.deleteDraft")}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t("campaigns.deleteDraft")}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("campaigns.deleteDraftConfirm")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {t("cancel")}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  variant="destructive"
                                  disabled={deletingId !== null}
                                  onClick={() =>
                                    void deleteDraftCampaign(row.id)
                                  }
                                >
                                  {t("campaigns.deleteDraftAction")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : null}
                      </div>
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
