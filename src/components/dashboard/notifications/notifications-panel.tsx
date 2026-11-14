"use client";

import { useCallback, useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { format } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import { useLocale, useTranslations } from "next-intl";
import { Inbox } from "lucide-react";
import toast from "react-hot-toast";

import { useRouter } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/api-client";
import { useNotifications } from "@/components/notifications/notification-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { NotificationDto } from "@/shared/types/notification.types";

const PAGE_LIMIT = 20;

type TabKey = "unread" | "read";

function unreadListKey(
  pageIndex: number,
  previous: Awaited<ReturnType<typeof apiClient.notifications.listPage>> | null,
) {
  if (previous && !previous.nextCursor) {
    return null;
  }
  const cursor = pageIndex === 0 ? undefined : previous?.nextCursor;
  return ["notifications-unread", cursor ?? ""] as const;
}

function readListKey(
  pageIndex: number,
  previous: Awaited<ReturnType<typeof apiClient.notifications.readPage>> | null,
) {
  if (previous && !previous.nextCursor) {
    return null;
  }
  const cursor = pageIndex === 0 ? undefined : previous?.nextCursor;
  return ["notifications-read", cursor ?? ""] as const;
}

export function NotificationsPanel() {
  const t = useTranslations("notifications");
  const [tab, setTab] = useState<TabKey>("unread");

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Inbox className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {tab === "unread" ? t("description") : t("descriptionRead")}
          </p>
        </div>
        <div
          className="flex w-full gap-1 rounded-lg border bg-muted/40 p-1 sm:inline-flex sm:w-auto"
          role="tablist"
          aria-label={t("tabsAria")}
        >
          <Button
            type="button"
            role="tab"
            aria-selected={tab === "unread"}
            variant={tab === "unread" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => setTab("unread")}
          >
            {t("tabUnread")}
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={tab === "read"}
            variant={tab === "read" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => setTab("read")}
          >
            {t("tabRead")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tab === "unread" ? (
          <UnreadNotificationsSection />
        ) : (
          <ReadNotificationsSection />
        )}
      </CardContent>
    </Card>
  );
}

function UnreadNotificationsSection() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const router = useRouter();
  const { mutateUnreadCount } = useNotifications();
  const getNotificationTypeLabel = (value: NotificationDto["type"]) => {
    switch (value) {
      case "subscription":
        return t("types.subscription");
      case "system":
        return t("types.system");
      case "social":
        return t("types.social");
      case "announcement_reference":
        return t("types.announcement_reference");
      case "support_ticket":
        return t("types.support_ticket");
      case "feedback":
        return t("types.feedback");
      default:
        return t("types.system");
    }
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(
      unreadListKey,
      ([, cursor]) =>
        apiClient.notifications.listPage({
          unreadOnly: true,
          cursor: cursor || undefined,
          limit: PAGE_LIMIT,
        }),
      { revalidateFirstPage: false },
    );

  const pages = data ?? [];
  const items = useMemo(() => pages.flatMap((p) => p.items), [pages]);
  const hasMore = Boolean(pages.length && pages[pages.length - 1]?.nextCursor);
  const isEmpty = !isLoading && !error && items.length === 0;

  const refreshAll = useCallback(async () => {
    await mutate();
    await mutateUnreadCount();
  }, [mutate, mutateUnreadCount]);

  const handleMarkAll = async () => {
    try {
      await apiClient.notifications.markAllRead();
      toast.success(t("markAllSuccess"));
      await refreshAll();
      void setSize(1);
    } catch {
      toast.error(t("markAllError"));
    }
  };

  const handleOpen = async (n: NotificationDto) => {
    try {
      await apiClient.notifications.markRead(n.id);
      void mutateUnreadCount();
      void mutate();
    } catch {
      toast.error(t("markReadError"));
      return;
    }
    if (n.link) {
      router.push(n.link);
    }
  };

  const handleMarkOne = async (n: NotificationDto) => {
    try {
      await apiClient.notifications.markRead(n.id);
      toast.success(t("markedRead"));
      await refreshAll();
    } catch {
      toast.error(t("markReadError"));
    }
  };

  return (
    <>
      {!isEmpty && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleMarkAll()}
            disabled={isValidating}
          >
            {t("markAllRead")}
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{t("loadError")}</p>}

      {isEmpty && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      )}

      {!isLoading && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id}>
              <NotificationRow
                notification={n}
                locale={locale}
                typeLabel={getNotificationTypeLabel(n.type)}
                mode="unread"
                onOpen={() => void handleOpen(n)}
                onMarkRead={() => void handleMarkOne(n)}
                openLabel={t("open")}
                markReadLabel={t("markRead")}
                readStatusLabel={t("readBadge")}
              />
            </li>
          ))}
        </ul>
      )}

      {hasMore && !isLoading && (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={isValidating}
          onClick={() => void setSize(size + 1)}
        >
          {isValidating ? t("loadingMore") : t("loadMore")}
        </Button>
      )}
    </>
  );
}

function ReadNotificationsSection() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const router = useRouter();
  const getNotificationTypeLabel = (value: NotificationDto["type"]) => {
    switch (value) {
      case "subscription":
        return t("types.subscription");
      case "system":
        return t("types.system");
      case "social":
        return t("types.social");
      case "announcement_reference":
        return t("types.announcement_reference");
      case "support_ticket":
        return t("types.support_ticket");
      case "feedback":
        return t("types.feedback");
      default:
        return t("types.system");
    }
  };

  const { data, error, isLoading, isValidating, size, setSize } =
    useSWRInfinite(
      readListKey,
      ([, cursor]) =>
        apiClient.notifications.readPage({
          cursor: cursor || undefined,
          limit: PAGE_LIMIT,
        }),
      { revalidateFirstPage: false },
    );

  const pages = data ?? [];
  const items = useMemo(() => pages.flatMap((p) => p.items), [pages]);
  const hasMore = Boolean(pages.length && pages[pages.length - 1]?.nextCursor);
  const isEmpty = !isLoading && !error && items.length === 0;

  const handleOpenLink = (n: NotificationDto) => {
    if (n.link) {
      router.push(n.link);
    }
  };

  return (
    <>
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{t("loadError")}</p>}

      {isEmpty && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("emptyRead")}
        </p>
      )}

      {!isLoading && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id}>
              <NotificationRow
                notification={n}
                locale={locale}
                typeLabel={getNotificationTypeLabel(n.type)}
                mode="read"
                onOpen={() => handleOpenLink(n)}
                onMarkRead={() => {}}
                openLabel={t("open")}
                markReadLabel={t("markRead")}
                readStatusLabel={t("readBadge")}
              />
            </li>
          ))}
        </ul>
      )}

      {hasMore && !isLoading && (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={isValidating}
          onClick={() => void setSize(size + 1)}
        >
          {isValidating ? t("loadingMore") : t("loadMore")}
        </Button>
      )}
    </>
  );
}

function NotificationRow({
  notification: n,
  locale,
  typeLabel,
  mode,
  onOpen,
  onMarkRead,
  openLabel,
  markReadLabel,
  readStatusLabel,
}: {
  notification: NotificationDto;
  locale: string;
  typeLabel: string;
  mode: "unread" | "read";
  onOpen: () => void;
  onMarkRead: () => void;
  openLabel: string;
  markReadLabel: string;
  readStatusLabel: string;
}) {
  const dateLocale = locale.startsWith("ar") ? ar : enUS;
  const formattedDate = format(new Date(n.createdAt), "PPp", {
    locale: dateLocale,
  });

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-start transition-colors hover:bg-muted/40">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-xs font-normal">
          {typeLabel}
        </Badge>
        {mode === "read" ? (
          <Badge variant="outline" className="text-xs font-normal">
            {readStatusLabel}
          </Badge>
        ) : null}
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
      </div>
      <p className="font-medium leading-snug">{n.title}</p>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {n.message}
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        {mode === "unread" ? (
          n.link ? (
            <Button type="button" size="sm" onClick={onOpen}>
              {openLabel}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onMarkRead}
            >
              {markReadLabel}
            </Button>
          )
        ) : n.link ? (
          <Button type="button" size="sm" variant="secondary" onClick={onOpen}>
            {openLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
