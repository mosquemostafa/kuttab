"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import useSWR from "swr";

import { apiClient } from "@/lib/api/api-client";
import {
  getSessionCache,
  setSessionCache,
  SESSION_SWR_OPTIONS,
} from "@/lib/session-cache";

const SESSION_NOTIFICATIONS_KEY = "session_notifications_unread_count";

type NotificationContextValue = {
  unreadCount: number;
  mutateUnreadCount: () => Promise<number | undefined>;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: unreadCount = 0, mutate } = useSWR<number>(
    "notifications-unread-count",
    async () => {
      const cached = getSessionCache<number>(SESSION_NOTIFICATIONS_KEY);
      if (cached.hit && typeof cached.data === "number") {
        return cached.data;
      }
      const count = await apiClient.notifications.unreadCount();
      setSessionCache(SESSION_NOTIFICATIONS_KEY, count);
      return count;
    },
    SESSION_SWR_OPTIONS,
  );

  const mutateUnreadCount = useCallback(async () => {
    try {
      const count = await apiClient.notifications.unreadCount();
      setSessionCache(SESSION_NOTIFICATIONS_KEY, count);
      await mutate(count, false);
      return count;
    } catch {
      return unreadCount;
    }
  }, [mutate, unreadCount]);

  const value = useMemo(
    () => ({ unreadCount, mutateUnreadCount }),
    [unreadCount, mutateUnreadCount],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

const fallback: NotificationContextValue = {
  unreadCount: 0,
  mutateUnreadCount: async () => undefined,
};

export function useNotifications(): NotificationContextValue {
  return useContext(NotificationContext) ?? fallback;
}
