"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  Trash2,
  RefreshCw,
  LifeBuoy,
  Eye,
  MessagesSquare,
  MessageSquarePlus,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import { TicketStatus } from "@/shared/enums/ticket-status.enum";
import type { SupportTicketDTO } from "@/shared/types/support-ticket.types";
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
import { StaffCreateTicketDialog } from "@/components/support/staff-create-ticket-dialog";
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

type StatusFilter = "all" | TicketStatus;
type SortDirection = "asc" | "desc";

function getGmailComposeUrl(email: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
}

function statusBadgeClass(status: TicketStatus): string {
  if (status === TicketStatus.OPEN) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700";
  }

  if (status === TicketStatus.RESOLVED) {
    return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-700";
  }

  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";
}

export function SupportTicketsManagementTable() {
  const t = useTranslations("dashboard.supportDesk");
  const getStatusLabel = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return t("statuses.open");
      case TicketStatus.RESOLVED:
        return t("statuses.resolved");
      case TicketStatus.CLOSED:
        return t("statuses.closed");
      default:
        return t("statuses.open");
    }
  };
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<SupportTicketDTO | null>(
    null,
  );
  const [detailsTicket, setDetailsTicket] = useState<SupportTicketDTO | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const swrKey = useMemo(
    () => ["support-desk-tickets", statusFilter, sortDirection, page] as const,
    [statusFilter, sortDirection, page],
  );

  const { data, error, mutate, isLoading } = useSWR(
    swrKey,
    ([, status, sort, currentPage]) =>
      apiClient.supportTickets.listAll({
        status: status === "all" ? undefined : status,
        sortDirection: sort,
        page: currentPage,
        limit: LIMIT,
      }),
    {
      revalidateOnFocus: false,
    },
  );

  const tickets = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, limit: LIMIT, total: 0, totalPages: 1 };
  const displayedTotal = isHydrated ? meta.total : 0;

  const onStatusChange = async (ticketId: string, status: TicketStatus) => {
    try {
      setUpdatingId(ticketId);
      await apiClient.supportTickets.updateStatus(ticketId, { status });
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
      await apiClient.supportTickets.delete(pendingDelete.id);
      toast.success(t("messages.ticketDeleted"));
      setPendingDelete(null);
      mutate();
    } catch (deleteError) {
      if (deleteError instanceof Error) {
        toast.error(deleteError.message);
      } else {
        toast.error(t("messages.ticketDeleteFailed"));
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
              <LifeBuoy className="h-5 w-5" aria-hidden />
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

            <div className="w-full md:w-52">
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
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  <SelectItem value={TicketStatus.OPEN}>
                    {t("statuses.open")}
                  </SelectItem>
                  <SelectItem value={TicketStatus.RESOLVED}>
                    {t("statuses.resolved")}
                  </SelectItem>
                  <SelectItem value={TicketStatus.CLOSED}>
                    {t("statuses.closed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              className="gap-2"
              onClick={() => setShowCreateDialog(true)}
            >
              <MessageSquarePlus className="h-4 w-4" aria-hidden />
              {t("actions.startChat")}
            </Button>
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
          ) : tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.subject}</p>
                            <p
                              className="mt-1 line-clamp-2 max-w-3xs text-xs text-muted-foreground"
                              title={ticket.description}
                            >
                              {ticket.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {ticket.userId}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {ticket.userEmail ? (
                            <a
                              href={getGmailComposeUrl(ticket.userEmail)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-primary hover:underline"
                            >
                              {ticket.userEmail}
                            </a>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusBadgeClass(ticket.status)}
                          >
                            {getStatusLabel(ticket.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(
                            new Date(ticket.createdAt),
                            "MMM d, yyyy h:mm a",
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={ticket.status}
                              onValueChange={(value) =>
                                onStatusChange(ticket.id, value as TicketStatus)
                              }
                              disabled={updatingId === ticket.id}
                            >
                              <SelectTrigger className="h-8 w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={TicketStatus.OPEN}>
                                  {t("statuses.open")}
                                </SelectItem>
                                <SelectItem value={TicketStatus.RESOLVED}>
                                  {t("statuses.resolved")}
                                </SelectItem>
                                <SelectItem value={TicketStatus.CLOSED}>
                                  {t("statuses.closed")}
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              asChild
                              title="Open discussion"
                            >
                              <Link href={`/support/tickets/${ticket.id}`}>
                                <MessagesSquare
                                  className="h-4 w-4"
                                  aria-hidden
                                />
                                <span className="sr-only">Open discussion</span>
                              </Link>
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() => setDetailsTicket(ticket)}
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
                              onClick={() => setPendingDelete(ticket)}
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
        open={Boolean(detailsTicket)}
        onOpenChange={(open) => {
          if (!open) setDetailsTicket(null);
        }}
      >
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {detailsTicket?.subject ?? t("detailsDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("detailsDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {detailsTicket ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("detailsDialog.userId")}
                  </p>
                  <p className="font-mono text-xs">{detailsTicket.userId}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("detailsDialog.userEmail")}
                  </p>
                  <p className="text-xs">
                    {detailsTicket.userEmail ? (
                      <a
                        href={getGmailComposeUrl(detailsTicket.userEmail)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-primary hover:underline"
                      >
                        {detailsTicket.userEmail}
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
                    className={statusBadgeClass(detailsTicket.status)}
                  >
                    {getStatusLabel(detailsTicket.status)}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("detailsDialog.createdAt")}
                  </p>
                  <p>
                    {format(
                      new Date(detailsTicket.createdAt),
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
                      new Date(detailsTicket.updatedAt),
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
                    {detailsTicket.description}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDetailsTicket(null)}>
              {t("detailsDialog.close")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StaffCreateTicketDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          setShowCreateDialog(false);
          mutate();
        }}
      />
    </>
  );
}
