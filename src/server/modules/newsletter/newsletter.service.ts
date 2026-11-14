import { randomBytes } from "node:crypto";

import { createId } from "@paralleldrive/cuid2";

import { env, newsletterDeliveryEnabled } from "@/server/lib/env";
import { appSettingsService } from "@/server/modules/app-settings/app-settings.service";
import { enqueueCampaignPlannerJob } from "@/server/queues/newsletter.queue";
import {
  buildUnsubscribeUrl,
  resolveFooterLocale,
} from "./newsletter-render.helper";
import { sendNewsletterEmail } from "@/server/lib/resend";
import {
  ConflictException,
  NewsletterDisabledException,
  NotFoundException,
  ValidationException,
} from "@/server/exceptions/exceptions";
import { newsletterRepository } from "@/server/modules/newsletter/newsletter.repository";
import { buildWelcomeEmailBundle } from "@/server/modules/newsletter/newsletter-welcome-template";
import type {
  CreateNewsletterCampaignDTO,
  NewsletterSubscribeDTO,
  UpdateNewsletterCampaignDTO,
} from "@/server/modules/newsletter/newsletter.dto";
import type { NewsletterCampaignRow } from "@/server/modules/newsletter/newsletter.repository";

function normalizeNullableText(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = s.trim();
  return t === "" ? null : t;
}

function assertWebsitePublicDraftMerged(
  row: Pick<
    NewsletterCampaignRow,
    "isWebsitePublic" | "slug" | "excerptAr" | "excerptEn" | "coverImageUrl"
  >,
) {
  if (!row.isWebsitePublic) return;
  const fieldErrors: Record<string, string[]> = {};
  if (!row.slug?.trim()) {
    fieldErrors.slug = [
      "Slug is required when the campaign is public on the website",
    ];
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug.trim())) {
    fieldErrors.slug = [
      "Slug must be lowercase letters, numbers, and single hyphens between segments",
    ];
  }
  if (!row.excerptAr?.trim()) {
    fieldErrors.excerptAr = [
      "Arabic excerpt is required for a public campaign",
    ];
  }
  if (!row.excerptEn?.trim()) {
    fieldErrors.excerptEn = [
      "English excerpt is required for a public campaign",
    ];
  }
  if (!row.coverImageUrl?.trim()) {
    fieldErrors.coverImageUrl = [
      "Cover image URL is required for a public campaign",
    ];
  }
  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationException(fieldErrors);
  }
}

function newUnsubscribeToken(): string {
  /** v1: plain stored token for low-sensitivity unsubscribe links (not auth-grade). */
  return randomBytes(32).toString("hex");
}

export const newsletterService = {
  async subscribe(
    input: NewsletterSubscribeDTO,
  ): Promise<{ subscriberId: string; email: string }> {
    const { sendNewsletterWelcomeEmail } =
      await appSettingsService.getSettings();
    const welcomeEmailEnabled =
      newsletterDeliveryEnabled && sendNewsletterWelcomeEmail;

    const existing = await newsletterRepository.findSubscriberByEmail(
      input.email,
    );

    if (existing?.status === "active") {
      if (
        input.locale !== undefined &&
        input.locale !== (existing.locale ?? undefined)
      ) {
        await newsletterRepository.updateSubscriberActiveResubscribe(
          existing.id,
          input.locale ?? existing.locale ?? null,
          existing.unsubscribeToken,
        );
      }
      return { subscriberId: existing.id, email: existing.email };
    }

    const token = newUnsubscribeToken();

    if (existing?.status === "unsubscribed") {
      await newsletterRepository.updateSubscriberActiveResubscribe(
        existing.id,
        input.locale ?? existing.locale ?? null,
        token,
      );
      if (welcomeEmailEnabled) {
        await this.sendWelcomeEmail(
          existing.email,
          input.locale ?? existing.locale ?? null,
          token,
        );
      }
      return { subscriberId: existing.id, email: existing.email };
    }

    const id = createId();
    await newsletterRepository.insertSubscriber({
      id,
      email: input.email,
      locale: input.locale ?? null,
      status: "active",
      unsubscribeToken: token,
    });

    if (welcomeEmailEnabled) {
      await this.sendWelcomeEmail(input.email, input.locale ?? null, token);
    }

    return { subscriberId: id, email: input.email };
  },

  /** Whether the given address has an active newsletter subscription (email is normalized). */
  async getSubscriptionStatusForEmail(
    email: string,
  ): Promise<{ subscribed: boolean; locale: string | null }> {
    const normalized = email.trim().toLowerCase();
    const row = await newsletterRepository.findSubscriberByEmail(normalized);
    if (!row || row.status !== "active") {
      return { subscribed: false, locale: null };
    }
    return { subscribed: true, locale: row.locale };
  },

  async updateNewsletterLocaleForEmail(
    email: string,
    locale: "en" | "ar",
  ): Promise<{ locale: string }> {
    const normalized = email.trim().toLowerCase();
    const row = await newsletterRepository.findSubscriberByEmail(normalized);
    if (!row || row.status !== "active") {
      throw new NotFoundException("Newsletter subscription");
    }
    await newsletterRepository.updateSubscriberLocale(row.id, locale);
    return { locale };
  },

  /** Idempotent: no-op if not subscribed. */
  async unsubscribeByEmail(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const row = await newsletterRepository.findSubscriberByEmail(normalized);
    if (!row || row.status !== "active") {
      return;
    }
    await newsletterRepository.setSubscriberUnsubscribed(row.id);
  },

  async sendWelcomeEmail(
    email: string,
    locale: string | null,
    token: string,
  ): Promise<void> {
    if (!newsletterDeliveryEnabled) return;
    const loc = resolveFooterLocale(locale) as "ar" | "en";
    const unsub = buildUnsubscribeUrl(env.NEXT_PUBLIC_APP_URL, loc, token);
    const bundle = buildWelcomeEmailBundle({
      locale: loc,
      unsubscribeUrl: unsub,
      publicAppUrl: env.NEXT_PUBLIC_APP_URL,
    });
    await sendNewsletterEmail({
      to: email,
      subject: bundle.subject,
      html: bundle.html,
      text: bundle.text,
      listUnsubscribe: bundle.listUnsubscribe,
    });
  },

  async unsubscribeByToken(token: string): Promise<void> {
    const row = await newsletterRepository.findSubscriberByToken(token);
    if (!row) {
      throw new NotFoundException("Subscriber", "token");
    }
    if (row.status === "unsubscribed") {
      return;
    }
    await newsletterRepository.setSubscriberUnsubscribed(row.id);
  },

  async getSubscriberForUnsubscribeConfirm(token: string) {
    const row = await newsletterRepository.findSubscriberByToken(token);
    if (!row) {
      return null;
    }
    return {
      emailMasked: maskEmail(row.email),
      alreadyUnsubscribed: row.status === "unsubscribed",
    };
  },

  async startCampaignSend(campaignId: string): Promise<void> {
    if (!newsletterDeliveryEnabled) {
      throw new NewsletterDisabledException();
    }

    const campaign = await newsletterRepository.getCampaignById(campaignId);
    if (!campaign) {
      throw new NotFoundException("Campaign", campaignId);
    }
    if (campaign.status !== "draft") {
      throw new ValidationException({
        status: [
          "Only draft campaigns can be sent. Create a new campaign to send again.",
        ],
      });
    }

    const ok = await newsletterRepository.markCampaignSending(campaignId);
    if (!ok) {
      throw new ValidationException({
        status: ["Campaign could not be started (wrong status)."],
      });
    }

    await enqueueCampaignPlannerJob(campaignId, campaign.resumeGeneration ?? 0);
  },

  async resumeCampaignSend(
    campaignId: string,
  ): Promise<{ resumeGeneration: number }> {
    if (!newsletterDeliveryEnabled) {
      throw new NewsletterDisabledException();
    }

    const campaign = await newsletterRepository.getCampaignById(campaignId);
    if (!campaign) {
      throw new NotFoundException("Campaign", campaignId);
    }
    if (campaign.status !== "sending") {
      throw new ValidationException({
        status: [
          "Only campaigns currently in 'sending' status can be resumed.",
        ],
      });
    }

    const nextGen =
      await newsletterRepository.incrementCampaignResumeGeneration(campaignId);
    if (nextGen == null) {
      throw new ValidationException({
        status: [
          "Could not increment resume generation (campaign not in sending status).",
        ],
      });
    }

    await enqueueCampaignPlannerJob(campaignId, nextGen);
    return { resumeGeneration: nextGen };
  },

  async createCampaign(
    createdBy: string,
    input: CreateNewsletterCampaignDTO,
  ): Promise<{ id: string }> {
    if (!newsletterDeliveryEnabled) {
      throw new NewsletterDisabledException();
    }
    if (input.slug) {
      const taken = await newsletterRepository.findCampaignIdBySlug(input.slug);
      if (taken) {
        throw new ConflictException("This newsletter slug is already in use.");
      }
    }
    const id = createId();
    await newsletterRepository.insertCampaign({
      id,
      subjectAr: input.subjectAr,
      subjectEn: input.subjectEn,
      bodyAr: input.bodyAr,
      bodyEn: input.bodyEn,
      createdBy,
      coverImageUrl: input.coverImageUrl ?? null,
      isWebsitePublic: input.isWebsitePublic ?? false,
      slug: input.slug ?? null,
      excerptAr: normalizeNullableText(input.excerptAr),
      excerptEn: normalizeNullableText(input.excerptEn),
    });
    return { id };
  },

  async updateCampaign(
    id: string,
    input: UpdateNewsletterCampaignDTO,
  ): Promise<void> {
    const c = await newsletterRepository.getCampaignById(id);
    if (!c) throw new NotFoundException("Campaign", id);
    const merged = {
      isWebsitePublic:
        input.isWebsitePublic !== undefined
          ? input.isWebsitePublic
          : c.isWebsitePublic,
      slug: input.slug !== undefined ? (input.slug ?? null) : c.slug,
      excerptAr:
        input.excerptAr !== undefined
          ? normalizeNullableText(input.excerptAr)
          : c.excerptAr,
      excerptEn:
        input.excerptEn !== undefined
          ? normalizeNullableText(input.excerptEn)
          : c.excerptEn,
      coverImageUrl:
        input.coverImageUrl !== undefined
          ? input.coverImageUrl?.trim()
            ? input.coverImageUrl.trim()
            : null
          : c.coverImageUrl,
    };
    assertWebsitePublicDraftMerged(merged);
    const nextSlug = merged.slug?.trim() ?? null;
    const currentSlug = c.slug?.trim() ?? null;
    if (nextSlug && nextSlug !== currentSlug) {
      const taken = await newsletterRepository.findCampaignIdBySlug(
        nextSlug,
        id,
      );
      if (taken) {
        throw new ConflictException("This newsletter slug is already in use.");
      }
    }
    await newsletterRepository.updateCampaignById(id, {
      ...(input.subjectAr !== undefined ? { subjectAr: input.subjectAr } : {}),
      ...(input.subjectEn !== undefined ? { subjectEn: input.subjectEn } : {}),
      ...(input.bodyAr !== undefined ? { bodyAr: input.bodyAr } : {}),
      ...(input.bodyEn !== undefined ? { bodyEn: input.bodyEn } : {}),
      ...(input.coverImageUrl !== undefined
        ? {
            coverImageUrl: input.coverImageUrl?.trim()
              ? input.coverImageUrl.trim()
              : null,
          }
        : {}),
      ...(input.isWebsitePublic !== undefined
        ? { isWebsitePublic: input.isWebsitePublic }
        : {}),
      ...(input.slug !== undefined ? { slug: input.slug ?? null } : {}),
      ...(input.excerptAr !== undefined
        ? { excerptAr: normalizeNullableText(input.excerptAr) }
        : {}),
      ...(input.excerptEn !== undefined
        ? { excerptEn: normalizeNullableText(input.excerptEn) }
        : {}),
    });
  },

  async deleteDraftCampaign(id: string): Promise<void> {
    const c = await newsletterRepository.getCampaignById(id);
    if (!c) throw new NotFoundException("Campaign", id);
    if (c.status !== "draft") {
      throw new ValidationException({
        status: ["Only draft campaigns can be deleted."],
      });
    }
    const removed = await newsletterRepository.deleteCampaignIfDraft(id);
    if (!removed) {
      throw new ValidationException({
        status: ["Campaign could not be deleted (wrong status)."],
      });
    }
  },

  async listCampaignsForAdmin(pagination: {
    page: number;
    limit: number;
    offset: number;
  }) {
    return newsletterRepository.listCampaigns(pagination);
  },

  async listSubscribersForAdmin(pagination: {
    page: number;
    limit: number;
    offset: number;
  }) {
    return newsletterRepository.listSubscribers(pagination);
  },

  async getCampaignForAdmin(id: string) {
    const c = await newsletterRepository.getCampaignById(id);
    if (!c) throw new NotFoundException("Campaign", id);
    const counts = await newsletterRepository.countSendStatuses(id);
    const activeTotal = await newsletterRepository.countActiveSubscribers();
    return { ...c, sendCounts: counts, activeSubscriberTotal: activeTotal };
  },

  async listWebsitePublicCampaignsForDashboard(pagination: {
    page: number;
    limit: number;
    offset: number;
  }) {
    return newsletterRepository.listWebsitePublicCampaignsForDashboard(
      pagination,
    );
  },

  async getWebsitePublicArticleBySlug(slug: string) {
    const row = await newsletterRepository.getWebsitePublicCompletedBySlug(
      slug.trim().toLowerCase(),
    );
    if (!row) throw new NotFoundException("Newsletter", slug);
    return row;
  },
};

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  if (local.length <= 2) return `**@${domain}`;
  return `${local[0]}***${local.at(-1)}@${domain}`;
}
