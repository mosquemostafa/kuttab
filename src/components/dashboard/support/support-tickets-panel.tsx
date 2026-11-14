"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  LifeBuoy,
  MessageSquare,
  MessagesSquare,
  SendHorizonal,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import { TicketStatus } from "@/shared/enums/ticket-status.enum";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const DEFAULT_LIMIT = 20;

type StatusFilter = "all" | TicketStatus;

function getBadgeClass(status: TicketStatus): string {
  if (status === TicketStatus.OPEN) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700";
  }

  if (status === TicketStatus.RESOLVED) {
    return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-700";
  }

  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";
}

export function SupportTicketsPanel() {
  const t = useTranslations("dashboard.support");
  const locale = useLocale();
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

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const swrKey = useMemo(
    () => ["support-tickets", statusFilter, page] as const,
    [statusFilter, page],
  );

  const { data, error, mutate, isLoading } = useSWR(
    swrKey,
    ([, status, currentPage]) =>
      apiClient.supportTickets.list({
        status: status === "all" ? undefined : status,
        page: currentPage,
        limit: DEFAULT_LIMIT,
      }),
  );

  const tickets = data?.items ?? [];
  const meta = data?.meta ?? {
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  };
  const displayedTotal = isHydrated ? meta.total : 0;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();

    if (!trimmedSubject || !trimmedDescription) {
      toast.error(t("messages.requiredFields"));
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.supportTickets.create({
        subject: trimmedSubject,
        description: trimmedDescription,
      });
      toast.success(t("messages.ticketCreated"));
      setSubject("");
      setDescription("");
      setPage(1);
      mutate();
    } catch (submitError) {
      if (submitError instanceof Error) {
        toast.error(submitError.message);
      } else {
        toast.error(t("messages.createFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" aria-hidden />
            {t("create.title")}
          </CardTitle>
          <CardDescription>{t("create.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="support-subject">
                {t("create.subjectLabel")}
              </Label>
              <Input
                id="support-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={t("create.subjectPlaceholder")}
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-description">
                {t("create.descriptionLabel")}
              </Label>
              <Textarea
                id="support-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("create.descriptionPlaceholder")}
                rows={6}
                maxLength={20000}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <SendHorizonal className="h-4 w-4" aria-hidden />
                {isSubmitting ? t("create.sending") : t("create.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" aria-hidden />
              {t("list.title")}
            </CardTitle>
            <CardDescription>
              {t("list.description", { total: displayedTotal })}
            </CardDescription>
          </div>

          <div className="w-full md:w-56">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as StatusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("list.filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("list.filters.all")}</SelectItem>
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
        </CardHeader>

        <CardContent>
          {!isHydrated || isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2 rounded-md border p-4">
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">
              {t("messages.loadFailed")}
            </p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("list.empty")}</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <article
                  key={ticket.id}
                  className="rounded-md border p-4 transition-colors hover:border-primary/40"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium text-base">{ticket.subject}</h3>
                    <Badge
                      variant="outline"
                      className={getBadgeClass(ticket.status)}
                    >
                      {getStatusLabel(ticket.status)}
                    </Badge>
                  </div>

                  <p className="whitespace-pre-wrap text-sm text-muted-foreground line-clamp-3">
                    {ticket.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      {t("list.createdAt", {
                        date: new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(ticket.createdAt)),
                      })}
                    </p>

                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-2"
                    >
                      <Link href={`/dashboard/support/${ticket.id}`}>
                        <MessagesSquare className="h-3.5 w-3.5" />
                        {t("list.viewConversation")}
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}

              {meta.totalPages > 1 ? (
                <div className="space-y-2">
                  <p className="text-center text-xs text-muted-foreground">
                    {t("list.pagination.page", {
                      page: meta.page,
                      totalPages: meta.totalPages,
                    })}
                  </p>

                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          text={t("list.pagination.previous")}
                          ariaLabel={t("list.pagination.previousAria")}
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

                      {Array.from({ length: meta.totalPages }).map(
                        (_, index) => {
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
                        },
                      )}

                      <PaginationItem>
                        <PaginationNext
                          text={t("list.pagination.next")}
                          ariaLabel={t("list.pagination.nextAria")}
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
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
