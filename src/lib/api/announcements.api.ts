import type { CreateAnnouncementDTO } from "@/server/modules/announcements/announcement.dto";
import type { AdminAnnouncementAnalyticsDTO } from "@/shared/types/admin-announcement-analytics.types";
import type {
  AdminAnnouncementDTO,
  AnnouncementDTO,
  AnnouncementHistoryItemDTO,
} from "@/shared/types/announcement.types";
import { request, requestNoStore, requestWithMeta } from "@/lib/api/api-core";

export const announcementsApi = {
  unseenCount: () =>
    requestNoStore<{ count: number }>("/announcements/unseen-count"),
  unseen: () => requestNoStore<AnnouncementDTO[]>("/announcements/unseen"),
  markSeen: (announcementIds: string[]) =>
    request<{ marked: number }>("/announcements/mark-seen", {
      method: "POST",
      body: JSON.stringify({ announcementIds }),
    }),
  list: (query?: { page?: number; limit?: number }) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<AnnouncementHistoryItemDTO>(
      `/announcements${params.size ? `?${params.toString()}` : ""}`,
    );
  },
};

export const adminAnnouncementsApi = {
  list: (query?: { page?: number; limit?: number }) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<AdminAnnouncementDTO>(
      `/admin/announcements${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  create: (data: CreateAnnouncementDTO) =>
    request<AdminAnnouncementDTO>("/admin/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (
    id: string,
    data: {
      titleAr: string;
      titleEn: string;
      contentAr: string;
      contentEn: string;
      publishedAt: string | null;
      expiresAt: string | null;
    },
  ) =>
    request<AdminAnnouncementDTO>(`/admin/announcements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<null>(`/admin/announcements/${id}`, {
      method: "DELETE",
    }),
  analytics: () =>
    requestNoStore<AdminAnnouncementAnalyticsDTO>(
      "/admin/announcements/analytics",
    ),
};
