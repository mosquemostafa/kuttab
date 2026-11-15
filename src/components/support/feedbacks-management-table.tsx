"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Trash2, RefreshCw, MessageSquareQuote, Eye } from "lucide-react";
import { useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import { FeedbackStatus } from "@/shared/enums/feedback-status.enum";
import { FeedbackType } from "@/shared/enums/feedback-type.enum";
import type { FeedbackDTO } from "@/shared/types/feedback.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LIMIT = 20;

type StatusFilter = "all" | FeedbackStatus;
type TypeFilter = "all" | FeedbackType;
type SortDirection = "asc" | "desc";

function getGmailComposeUrl(email: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
}

function statusBadgeClass(status: FeedbackStatus): string {
  if (status === FeedbackStatus.NEW) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700";
  }

  if (status === FeedbackStatus.REVIEWED) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700";
  }

  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";
}

function typeBadgeClass(type: FeedbackType): string {
  if (type === FeedbackType.SUGGESTION) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700";
  }

  return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700";
}

export function FeedbacksManagementTable() {
  const t = useTranslations("dashboard.feedbackDesk");
  const getTypeLabel = (value: FeedbackType) => {
    switch (value) {
      case FeedbackType.SUGGESTION:
        return t("types.suggestion");
      case FeedbackType.COMPLAINT:
        return t("types.complaint");
      default:
        return t("types.suggestion");
    }
  };

  const getStatusLabel = (value: FeedbackStatus) => {
    switch (value) {
      case FeedbackStatus.NEW:
        return t("statuses.new");
      case FeedbackStatus.REVIEWED:
        return t("statuses.reviewed");
      case FeedbackStatus.CLOSED:
        return t("statuses.closed");
      default:
        return t("statuses.new");
    }
  };
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<FeedbackDTO | null>(null);
  const [detailsItem, setDetailsItem] = useState<FeedbackDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const swrKey = useMemo(
    () =>
      [
        "feedback-desk-items",
        typeFilter,
        statusFilter,
        sortDirection,
        page,
      ] as const,
    [typeFilter, statusFilter, sortDirection, page],
  );

  const { data, error, mutate, isLoading } = useSWR(
    swrKey,
    ([, type, status, sort, currentPage]) =>
      apiClient.feedbacks.listAll({
        type: type === "all" ? undefined : type,
        status: status === "all" ? undefined : status,
        sortDirection: sort,
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

  const onStatusChange = async (id: string, status: FeedbackStatus) => {
    try {
      setUpdatingId(id);
      await apiClient.feedbacks.updateStatus(id, { status });
      toast.success(t("messages.statusUpdated"));
      mutate();
    } catch (changeError) {
      if (changeError instanceof Error) {
        toast.error(changeError.message);
      } else {
        toast.error(t("messages.statusUpdateFailed"));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const onDelete = async () => {
    if (!pendingDelete) return;

    try {
      setIsDeleting(true);
      await apiClient.feedbacks.delete(pendingDelete.id);
      toast.success(t("messages.itemDeleted"));
      setPendingDelete(null);
      mutate();
    } catch (deleteError) {
      if (deleteError instanceof Error) {
        toast.error(deleteError.message);
      } else {
        toast.error(t("messages.itemDeleteFailed"));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareQuote className="h-5 w-5" aria-hidden />
              {t("title")}
            </CardTitle>
            <CardDescription>
              {t("description", { total: displayedTotal })}
            </CardDescription>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
            <div className="w-full md:w-44">
              <Select
                value={sortDirection}
                onValueChange={(value) => {
                  setSortDirection(value as SortDirection);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">{t("filters.newest")}</SelectItem>
                  <SelectItem value="asc">{t("filters.oldest")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-44">
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value as TypeFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                  <SelectItem value={FeedbackType.SUGGESTION}>
                    {t("types.suggestion")}
                  </SelectItem>
                  <SelectItem value={FeedbackType.COMPLAINT}>
                    {t("types.complaint")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                  <SelectItem value="all">
                    {t("filters.allStatuses")}
                  </SelectItem>
                  <SelectItem value={FeedbackStatus.NEW}>
                    {t("statuses.new")}
                  </SelectItem>
                  <SelectItem value={FeedbackStatus.REVIEWED}>
                    {t("statuses.reviewed")}
                  </SelectItem>
                  <SelectItem value={FeedbackStatus.CLOSED}>
                    {t("statuses.closed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => mutate()}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              {t("actions.refresh")}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {!isHydrated || isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2 rounded-md border p-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">
              {t("messages.loadFailed")}
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("columns.type")}</TableHead>
                      <TableHead>{t("columns.subject")}</TableHead>
                      <TableHead>{t("columns.userId")}</TableHead>
                      <TableHead>{t("columns.userEmail")}</TableHead>
                      <TableHead>{t("columns.status")}</TableHead>
                      <TableHead>{t("columns.createdAt")}</TableHead>
                      <TableHead className="w-55">
                        {t("columns.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={typeBadgeClass(item.type)}
                          >
                            {getTypeLabel(item.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.subject}</p>
                            <p
                              className="mt-1 line-clamp-2 max-w-3xs text-xs text-muted-foreground"
                              title={item.description}
                            >
                              {item.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.userId}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.userEmail ? (
                            <a
                              href={getGmailComposeUrl(item.userEmail)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-primary hover:underline"
                            >
                              {item.userEmail}
                            </a>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusBadgeClass(item.status)}
                          >
                            {getStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(
                            new Date(item.createdAt),
                            "MMM d, yyyy h:mm a",
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={item.status}
                              onValueChange={(value) =>
                                onStatusChange(item.id, value as FeedbackStatus)
                              }
                              disabled={updatingId === item.id}
                            >
                              <SelectTrigger className="h-8 w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={FeedbackStatus.NEW}>
                                  {t("statuses.new")}
                                </SelectItem>
                                <SelectItem value={FeedbackStatus.REVIEWED}>
                                  {t("statuses.reviewed")}
                                </SelectItem>
                                <SelectItem value={FeedbackStatus.CLOSED}>
                                  {t("statuses.closed")}
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() => setDetailsItem(item)}
                            >
                              <Eye className="h-4 w-4" aria-hidden />
                              <span className="sr-only">
                                {t("actions.viewDetails")}
                              </span>
                            </Button>

                            <Button
                              type="button"
                              variant="destructive"
                              size="icon-sm"
                              onClick={() => setPendingDelete(item)}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                              <span className="sr-only">
                                {t("actions.delete")}
                              </span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {meta.totalPages > 1 ? (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        text={t("pagination.previous")}
                        ariaLabel={t("pagination.previousAria")}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        aria-disabled={meta.page === 1}
                        tabIndex={meta.page === 1 ? -1 : 0}
                        className={
                          meta.page === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: meta.totalPages }).map((_, index) => {
                      const pageNumber = index + 1;
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            isActive={pageNumber === meta.page}
                            onClick={() => setPage(pageNumber)}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        text={t("pagination.next")}
                        ariaLabel={t("pagination.nextAria")}
                        onClick={() =>
                          setPage((p) => Math.min(meta.totalPages, p + 1))
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
      </Card>

      <ConfirmationDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
        onConfirm={onDelete}
        title={t("deleteDialog.title")}
        description={t("deleteDialog.description", {
          subject: pendingDelete?.subject ?? t("deleteDialog.fallbackSubject"),
        })}
        confirmText={
          isDeleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")
        }
        cancelText={t("deleteDialog.cancel")}
        confirmVariant="destructive"
      />

      <AlertDialog
        open={Boolean(detailsItem)}
        onOpenChange={(open) => {
          if (!open) setDetailsItem(null);
        }}
      >
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {detailsItem?.subject ?? t("detailsDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("detailsDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {detailsItem ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("detailsDialog.type")}
                  </p>
                  <Badge
                    variant="outline"
                    className={typeBadgeClass(detailsItem.type)}
                  >
                    {getTypeLabel(detailsItem.type)}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("detailsDialog.userId")}
                  </p>
                  <p className="font-mono text-xs">{detailsItem.userId}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("detailsDialog.userEmail")}
                  </p>
                  <p className="text-xs">
                    {detailsItem.userEmail ? (
                      <a
                        href={getGmailComposeUrl(detailsItem.userEmail)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-primary hover:underline"
                      >
                        {detailsItem.userEmail}
                      </a>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("detailsDialog.status")}
                  </p>
                  <Badge
                    variant="outline"
                    className={statusBadgeClass(detailsItem.status)}
                  >
                    {getStatusLabel(detailsItem.status)}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("detailsDialog.createdAt")}
                  </p>
                  <p>
                    {format(
                      new Date(detailsItem.createdAt),
                      "MMM d, yyyy h:mm a",
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("detailsDialog.updatedAt")}
                  </p>
                  <p>
                    {format(
                      new Date(detailsItem.updatedAt),
                      "MMM d, yyyy h:mm a",
                    )}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  {t("detailsDialog.fullDescription")}
                </p>
                <div className="mt-1 max-h-80 overflow-y-auto rounded-md border p-3">
                  <p className="whitespace-pre-wrap text-sm">
                    {detailsItem.description}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDetailsItem(null)}>
              {t("detailsDialog.close")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
