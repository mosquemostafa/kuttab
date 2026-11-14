"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { MessageSquarePlus, MessageCircle, SendHorizonal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import { FeedbackStatus } from "@/shared/enums/feedback-status.enum";
import { FeedbackType } from "@/shared/enums/feedback-type.enum";
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

type TypeFilter = "all" | FeedbackType;
type StatusFilter = "all" | FeedbackStatus;

function getStatusBadgeClass(status: FeedbackStatus): string {
  if (status === FeedbackStatus.NEW) {
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700";
  }

  if (status === FeedbackStatus.REVIEWED) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700";
  }

  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";
}

function getTypeBadgeClass(type: FeedbackType): string {
  if (type === FeedbackType.SUGGESTION) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700";
  }

  return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700";
}

export function FeedbacksPanel() {
  const t = useTranslations("dashboard.feedbacks");
  const locale = useLocale();
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

  const [type, setType] = useState<FeedbackType>(FeedbackType.SUGGESTION);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const swrKey = useMemo(
    () => ["feedbacks", typeFilter, statusFilter, page] as const,
    [typeFilter, statusFilter, page],
  );

  const { data, error, mutate, isLoading } = useSWR(
    swrKey,
    ([, currentType, currentStatus, currentPage]) =>
      apiClient.feedbacks.list({
        type: currentType === "all" ? undefined : currentType,
        status: currentStatus === "all" ? undefined : currentStatus,
        page: currentPage,
        limit: DEFAULT_LIMIT,
      }),
  );

  const feedbacks = data?.items ?? [];
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
      await apiClient.feedbacks.create({
        type,
        subject: trimmedSubject,
        description: trimmedDescription,
      });
      toast.success(t("messages.feedbackCreated"));
      setType(FeedbackType.SUGGESTION);
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
            <MessageSquarePlus className="h-5 w-5" aria-hidden />
            {t("create.title")}
          </CardTitle>
          <CardDescription>{t("create.description")}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-type">{t("create.typeLabel")}</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as FeedbackType)}
              >
                <SelectTrigger id="feedback-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FeedbackType.SUGGESTION}>
                    {t("types.suggestion")}
                  </SelectItem>
                  <SelectItem value={FeedbackType.COMPLAINT}>
                    {t("types.complaint")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-subject">
                {t("create.subjectLabel")}
              </Label>
              <Input
                id="feedback-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={t("create.subjectPlaceholder")}
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-description">
                {t("create.descriptionLabel")}
              </Label>
              <Textarea
                id="feedback-description"
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
              <MessageCircle className="h-5 w-5" aria-hidden />
              {t("list.title")}
            </CardTitle>
            <CardDescription>
              {t("list.description", { total: displayedTotal })}
            </CardDescription>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
            <div className="w-full md:w-52">
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value as TypeFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("list.filters.type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("list.filters.allTypes")}
                  </SelectItem>
                  <SelectItem value={FeedbackType.SUGGESTION}>
                    {t("types.suggestion")}
                  </SelectItem>
                  <SelectItem value={FeedbackType.COMPLAINT}>
                    {t("types.complaint")}
                  </SelectItem>
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
                  <SelectValue placeholder={t("list.filters.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("list.filters.allStatuses")}
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
          ) : feedbacks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("list.empty")}</p>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((item) => (
                <article key={item.id} className="rounded-md border p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium">{item.subject}</h3>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getTypeBadgeClass(item.type)}
                      >
                        {getTypeLabel(item.type)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getStatusBadgeClass(item.status)}
                      >
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                  </div>

                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {item.description}
                  </p>

                  <p className="mt-3 text-xs text-muted-foreground">
                    {t("list.createdAt", {
                      date: new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.createdAt)),
                    })}
                  </p>
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
