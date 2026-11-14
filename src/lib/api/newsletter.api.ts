import type {
  NewsletterCampaignDetailDTO,
  NewsletterCampaignListItemDTO,
  NewsletterChannelArticleDTO,
  NewsletterChannelListItemDTO,
  NewsletterSubscriberDTO,
} from "@/shared/types/newsletter.types";
import { request, requestNoStore, requestWithMeta } from "@/lib/api/api-core";

export const newsletterApi = {
  subscribe: (body: { email: string; locale?: string }) =>
    request<{ subscriberId: string; email: string }>("/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  unsubscribe: (token: string) =>
    request<{ ok: true }>("/newsletter/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
};

export const dashboardNewsletterApi = {
  getStatus: () =>
    requestNoStore<{ subscribed: boolean; locale: string | null }>(
      "/dashboard/newsletter",
    ),
  subscribe: (body?: { locale?: "en" | "ar" }) =>
    request<{ subscribed: boolean; locale: string | null }>(
      "/dashboard/newsletter",
      {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      },
    ),
  unsubscribe: () =>
    request<{ subscribed: boolean; locale: null }>("/dashboard/newsletter", {
      method: "DELETE",
    }),
  updateLocale: (body: { locale: "en" | "ar" }) =>
    request<{ subscribed: boolean; locale: string }>("/dashboard/newsletter", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

export const dashboardNewslettersApi = {
  list: (query?: { page?: number; limit?: number }) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );
    return requestWithMeta<NewsletterChannelListItemDTO>(
      `/dashboard/newsletters${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  getBySlug: (slug: string) =>
    requestNoStore<NewsletterChannelArticleDTO>(
      `/dashboard/newsletters/${encodeURIComponent(slug)}`,
    ),
};

export const contentNewsletterApi = {
  listSubscribers: (query?: { page?: number; limit?: number }) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );
    return requestWithMeta<NewsletterSubscriberDTO>(
      `/content/newsletter/subscribers${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  listCampaigns: (query?: { page?: number; limit?: number }) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );
    return requestWithMeta<NewsletterCampaignListItemDTO>(
      `/content/newsletter/campaigns${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  createCampaign: (body: {
    subjectAr: string;
    subjectEn: string;
    bodyAr: string;
    bodyEn: string;
    coverImageUrl?: string;
    isWebsitePublic?: boolean;
    slug?: string;
    excerptAr?: string;
    excerptEn?: string;
  }) =>
    request<{ id: string }>("/content/newsletter/campaigns", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getCampaign: (id: string) =>
    request<NewsletterCampaignDetailDTO>(`/content/newsletter/campaigns/${id}`),
  updateCampaign: (
    id: string,
    body: Partial<{
      subjectAr: string;
      subjectEn: string;
      bodyAr: string;
      bodyEn: string;
      coverImageUrl: string;
      isWebsitePublic: boolean;
      slug: string;
      excerptAr: string;
      excerptEn: string;
    }>,
  ) =>
    request<{ ok: true }>(`/content/newsletter/campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteDraftCampaign: (id: string) =>
    request<{ ok: true }>(`/content/newsletter/campaigns/${id}`, {
      method: "DELETE",
    }),
  sendCampaign: (id: string) =>
    request<{ ok: true }>(`/content/newsletter/campaigns/${id}/send`, {
      method: "POST",
    }),
  resumeCampaign: (id: string) =>
    request<{ queued: boolean; remainingSubscribers: number; message: string }>(
      `/content/newsletter/campaigns/${id}/resume`,
      {
        method: "POST",
      },
    ),
};
