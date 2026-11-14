export type NewsletterSubscriberDTO = {
  id: string;
  email: string;
  locale: string | null;
  status: "active" | "unsubscribed";
  createdAt: string;
  unsubscribedAt: string | null;
};

export type NewsletterCampaignDTO = {
  id: string;
  subjectAr: string;
  subjectEn: string;
  bodyAr: string;
  bodyEn: string;
  status: "draft" | "queued" | "sending" | "completed" | "failed";
  failureReason: string | null;
  createdBy: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  coverImageUrl: string | null;
  isWebsitePublic: boolean;
  slug: string | null;
  excerptAr: string | null;
  excerptEn: string | null;
};

/** GET /content/newsletter/campaigns — list rows omit HTML bodies to reduce payload size. */
export type NewsletterCampaignListItemDTO = Omit<
  NewsletterCampaignDTO,
  "bodyAr" | "bodyEn"
>;

export type NewsletterCampaignDetailDTO = NewsletterCampaignDTO & {
  sendCounts: { sent: number; failed: number; pending: number };
  activeSubscriberTotal: number;
};

/** GET /api/dashboard/newsletters — public-on-site, completed campaigns (no bodies). */
export type NewsletterChannelListItemDTO = {
  id: string;
  slug: string;
  subjectAr: string;
  subjectEn: string;
  excerptAr: string | null;
  excerptEn: string | null;
  coverImageUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

/** GET /api/dashboard/newsletters/[slug] — full bilingual bodies for article view. */
export type NewsletterChannelArticleDTO = {
  slug: string;
  subjectAr: string;
  subjectEn: string;
  excerptAr: string | null;
  excerptEn: string | null;
  bodyAr: string;
  bodyEn: string;
  coverImageUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
};
