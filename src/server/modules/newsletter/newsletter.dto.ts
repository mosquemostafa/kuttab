import { z } from "zod";

import { isRichTextEmpty } from "@/lib/rich-text-empty";
import { SUPPORTED_LOCALES } from "@/lib/locale-config";
import {
  NEWSLETTER_BODY_MAX_CHARS,
  NEWSLETTER_EXCERPT_MAX_CHARS,
  NEWSLETTER_SLUG_MAX_CHARS,
  NEWSLETTER_SUBJECT_MAX_CHARS,
} from "@/shared/constants/newsletter";

const localeEnum = z.enum(SUPPORTED_LOCALES);

const campaignBodyField = z
  .string()
  .max(
    NEWSLETTER_BODY_MAX_CHARS,
    `Body must be at most ${NEWSLETTER_BODY_MAX_CHARS} characters`,
  );

const campaignSubjectField = z
  .string()
  .trim()
  .min(1, "Subject is required")
  .max(
    NEWSLETTER_SUBJECT_MAX_CHARS,
    `Subject must be at most ${NEWSLETTER_SUBJECT_MAX_CHARS} characters`,
  );

const campaignExcerptField = z
  .string()
  .trim()
  .max(
    NEWSLETTER_EXCERPT_MAX_CHARS,
    `Excerpt must be at most ${NEWSLETTER_EXCERPT_MAX_CHARS} characters`,
  );

const coverImageUrlField = z
  .string()
  .trim()
  .max(2000)
  .url("Cover image must be a valid URL")
  .optional()
  .or(z.literal(""))
  .transform((s) => (s === "" ? undefined : s));

export const newsletterSubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((e) => e.toLowerCase()),
  locale: localeEnum.optional(),
});

export type NewsletterSubscribeDTO = z.infer<typeof newsletterSubscribeSchema>;

export const newsletterUnsubscribeSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const createNewsletterCampaignSchema = z
  .object({
    subjectAr: campaignSubjectField,
    subjectEn: campaignSubjectField,
    bodyAr: campaignBodyField,
    bodyEn: campaignBodyField,
    coverImageUrl: coverImageUrlField.optional(),
    isWebsitePublic: z.boolean().optional().default(false),
    slug: z
      .string()
      .max(NEWSLETTER_SLUG_MAX_CHARS)
      .optional()
      .transform((s) => {
        if (s == null) return undefined;
        const t = s.trim().toLowerCase();
        return t === "" ? undefined : t;
      }),
    excerptAr: campaignExcerptField.optional(),
    excerptEn: campaignExcerptField.optional(),
  })
  .refine((d) => !isRichTextEmpty(d.bodyAr), {
    message: "Arabic body cannot be empty",
    path: ["bodyAr"],
  })
  .refine((d) => !isRichTextEmpty(d.bodyEn), {
    message: "English body cannot be empty",
    path: ["bodyEn"],
  })
  .refine((d) => !d.slug || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug), {
    message:
      "Slug must be lowercase letters, numbers, and single hyphens between segments",
    path: ["slug"],
  })
  .superRefine((d, ctx) => {
    if (!d.isWebsitePublic) return;
    const slug = typeof d.slug === "string" ? d.slug.trim() : "";
    if (!slug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Slug is required when the campaign is public on the website",
        path: ["slug"],
      });
    }
    const exAr = typeof d.excerptAr === "string" ? d.excerptAr.trim() : "";
    const exEn = typeof d.excerptEn === "string" ? d.excerptEn.trim() : "";
    if (!exAr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Arabic excerpt is required for a public campaign",
        path: ["excerptAr"],
      });
    }
    if (!exEn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "English excerpt is required for a public campaign",
        path: ["excerptEn"],
      });
    }
    if (!d.coverImageUrl?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cover image URL is required for a public campaign",
        path: ["coverImageUrl"],
      });
    }
  });

export type CreateNewsletterCampaignDTO = z.infer<
  typeof createNewsletterCampaignSchema
>;

export const updateNewsletterCampaignSchema = z
  .object({
    subjectAr: campaignSubjectField.optional(),
    subjectEn: campaignSubjectField.optional(),
    bodyAr: campaignBodyField.optional(),
    bodyEn: campaignBodyField.optional(),
    coverImageUrl: coverImageUrlField.optional(),
    isWebsitePublic: z.boolean().optional(),
    slug: z
      .string()
      .max(NEWSLETTER_SLUG_MAX_CHARS)
      .optional()
      .transform((s) => {
        if (s === undefined) return undefined;
        const t = s.trim().toLowerCase();
        return t === "" ? undefined : t;
      }),
    excerptAr: campaignExcerptField.optional(),
    excerptEn: campaignExcerptField.optional(),
  })
  .refine(
    (data) =>
      data.subjectAr !== undefined ||
      data.subjectEn !== undefined ||
      data.bodyAr !== undefined ||
      data.bodyEn !== undefined ||
      data.coverImageUrl !== undefined ||
      data.isWebsitePublic !== undefined ||
      data.slug !== undefined ||
      data.excerptAr !== undefined ||
      data.excerptEn !== undefined,
    { message: "At least one field is required to update" },
  )
  .refine(
    (data) => data.bodyAr === undefined || !isRichTextEmpty(data.bodyAr),
    {
      message: "Arabic body cannot be empty",
      path: ["bodyAr"],
    },
  )
  .refine(
    (data) => data.bodyEn === undefined || !isRichTextEmpty(data.bodyEn),
    {
      message: "English body cannot be empty",
      path: ["bodyEn"],
    },
  )
  .refine(
    (d) =>
      d.slug === undefined ||
      !d.slug ||
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug),
    {
      message:
        "Slug must be lowercase letters, numbers, and single hyphens between segments",
      path: ["slug"],
    },
  );

export type UpdateNewsletterCampaignDTO = z.infer<
  typeof updateNewsletterCampaignSchema
>;

export const listDashboardNewslettersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export const listNewsletterSubscribersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const listNewsletterCampaignsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});
