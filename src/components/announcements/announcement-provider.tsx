"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSWR from "swr";

import { apiClient } from "@/lib/api/api-client";
import {
  getSessionCache,
  setSessionCache,
  SESSION_SWR_OPTIONS,
} from "@/lib/session-cache";
import type { AnnouncementDTO } from "@/shared/types/announcement.types";
import { AnnouncementCarouselModal } from "@/components/announcements/announcement-carousel-modal";

const SESSION_ANNOUNCEMENTS_COUNT_KEY = "session_announcements_unseen_count";
const SESSION_ANNOUNCEMENTS_LIST_KEY = "session_announcements_unseen_list";
const SESSION_ANNOUNCEMENTS_MODAL_SHOWN_KEY = "announcements_modal_shown";

type AnnouncementContextValue = {
  unseenCount: number;
  announcements: AnnouncementDTO[];
  markAllSeen: () => Promise<void>;
};

const AnnouncementContext = createContext<AnnouncementContextValue | null>(
  null,
);

type AnnouncementProviderProps = {
  children: React.ReactNode;
};

export function AnnouncementProvider({ children }: AnnouncementProviderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasAutoOpenedRef = useRef(false);

  const { data: unseenCount = 0, mutate: mutateUnseenCount } = useSWR<number>(
    "announcements-unseen-count",
    async () => {
      const cached = getSessionCache<number>(SESSION_ANNOUNCEMENTS_COUNT_KEY);
      if (cached.hit && typeof cached.data === "number") {
        return cached.data;
      }
      try {
        const { count } = await apiClient.announcements.unseenCount();
        const finalCount = count ?? 0;
        setSessionCache(SESSION_ANNOUNCEMENTS_COUNT_KEY, finalCount);
        return finalCount;
      } catch {
        return 0;
      }
    },
    SESSION_SWR_OPTIONS,
  );

  const { data: announcements = [], mutate: mutateAnnouncements } = useSWR<
    AnnouncementDTO[]
  >(
    unseenCount > 0 ? "announcements-unseen-list" : null,
    async () => {
      const cached = getSessionCache<AnnouncementDTO[]>(
        SESSION_ANNOUNCEMENTS_LIST_KEY,
      );
      if (cached.hit && Array.isArray(cached.data)) {
        return cached.data;
      }
      const initialAnnouncements = await apiClient.announcements.unseen();
      setSessionCache(SESSION_ANNOUNCEMENTS_LIST_KEY, initialAnnouncements);
      return initialAnnouncements;
    },
    SESSION_SWR_OPTIONS,
  );

  useEffect(() => {
    if (hasAutoOpenedRef.current) return;
    if (
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(SESSION_ANNOUNCEMENTS_MODAL_SHOWN_KEY)
    ) {
      return;
    }

    if (announcements.length > 0) {
      hasAutoOpenedRef.current = true;
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          SESSION_ANNOUNCEMENTS_MODAL_SHOWN_KEY,
          "true",
        );
      }
      setIsModalOpen(true);
    }
  }, [announcements.length]);

  const markAllSeen = useCallback(async () => {
    const ids = announcements.map((item) => item.id);

    if (ids.length > 0) {
      try {
        await apiClient.announcements.markSeen(ids);
      } catch {
        // ignore
      }
    }

    setSessionCache(SESSION_ANNOUNCEMENTS_COUNT_KEY, 0);
    setSessionCache(SESSION_ANNOUNCEMENTS_LIST_KEY, []);
    void mutateUnseenCount(0, false);
    void mutateAnnouncements([], false);
    setIsModalOpen(false);
  }, [announcements, mutateUnseenCount, mutateAnnouncements]);

  const value = useMemo(
    () => ({ unseenCount, announcements, markAllSeen }),
    [unseenCount, announcements, markAllSeen],
  );

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
      <AnnouncementCarouselModal
        announcements={announcements}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onClose={markAllSeen}
      />
    </AnnouncementContext.Provider>
  );
}
