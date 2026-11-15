import { z } from "zod";

import { nextPublicSentryDsnSchema, trimEmptyToUndefined } from "@/lib/zod-env";

const optionalUrl = z.preprocess(
  trimEmptyToUndefined,
  z.string().url("Must be a valid URL when set").optional(),
);

const optionalRedisToken = z.preprocess(
  trimEmptyToUndefined,
  z.string().min(1, "Redis REST token cannot be empty").optional(),
);

const optionalNewsletterSecret = z.preprocess(
  trimEmptyToUndefined,
  z.string().min(1).optional(),
);

const envSchema = z
  .object({
    // App
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    NEXT_PUBLIC_APP_URL: z.string().url("Invalid NEXT_PUBLIC_APP_URL"),

    // CORS & External Clients
    CHROME_EXTENSION_ID: z.preprocess(
      trimEmptyToUndefined,
      z.string().min(1).optional(),
    ),
    ALLOWED_ORIGINS: z.preprocess(
      trimEmptyToUndefined,
      z.string().min(1).optional(),
    ),

    // Better Auth
    BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
    BETTER_AUTH_URL: z.string().url("Invalid BETTER_AUTH_URL"),

    // Database
    DATABASE_URL: z.string().url("Invalid DATABASE_URL"),
    DATABASE_URL_LOCAL: optionalUrl,
    DATABASE_URL_TEST: optionalUrl,
    DATABASE_URL_PROD: optionalUrl,

    // Email - Gmail SMTP
    GMAIL_FROM_EMAIL: z
      .string()
      .email("GMAIL_FROM_EMAIL must be a valid email"),
    GMAIL_FROM_NAME: z.string().min(1, "GMAIL_FROM_NAME is required"),
    GMAIL_USER: z.string().email("GMAIL_USER must be a valid email"),
    GMAIL_APP_PASSWORD: z.string().min(1, "GMAIL_APP_PASSWORD is required"),

    // Contact form email
    CONTACT_EMAIL: z.preprocess(
      trimEmptyToUndefined,
      z.string().email("CONTACT_EMAIL must be a valid email").optional(),
    ),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: z
      .string()
      .min(1, "CLOUDINARY_CLOUD_NAME is required"),
    CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
    CLOUDINARY_API_SECRET: z
      .string()
      .min(1, "CLOUDINARY_API_SECRET is required"),
    CLOUDINARY_ROOT_FOLDER: z
      .string()
      .min(1, "CLOUDINARY_ROOT_FOLDER is required"),
    ASSETS_MAX_IMAGE_UPLOAD_SIZE_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(10 * 1024 * 1024),
    ASSETS_MAX_DOCUMENT_UPLOAD_SIZE_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(50 * 1024 * 1024),

    /**
     * Cloudflare R2 (S3 API). Optional cluster — set all five to enable user avatar / journal cover uploads to R2.
     * `R2_PUBLIC_BASE_URL` must be the public origin for objects (custom domain recommended), no trailing slash.
     * `R2_S3_ENDPOINT` is optional: defaults to `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com` when unset.
     *
     * `NEXT_PUBLIC_R2_PUBLIC_URL` (optional): same **origin** as `R2_PUBLIC_BASE_URL` when both are set.
     * Use it in Docker/CI so `next.config.ts` can add `images.remotePatterns` at **build** time without putting
     * the whole R2 cluster into the build args file.
     */
    R2_ACCOUNT_ID: z.preprocess(
      trimEmptyToUndefined,
      z.string().min(1, "R2_ACCOUNT_ID cannot be empty when set").optional(),
    ),
    R2_S3_ENDPOINT: z.preprocess(
      trimEmptyToUndefined,
      z.string().url("R2_S3_ENDPOINT must be a valid URL when set").optional(),
    ),
    R2_ACCESS_KEY_ID: z.preprocess(
      trimEmptyToUndefined,
      z.string().min(1, "R2_ACCESS_KEY_ID cannot be empty when set").optional(),
    ),
    R2_SECRET_ACCESS_KEY: z.preprocess(
      trimEmptyToUndefined,
      z
        .string()
        .min(1, "R2_SECRET_ACCESS_KEY cannot be empty when set")
        .optional(),
    ),
    R2_BUCKET_NAME: z.preprocess(
      trimEmptyToUndefined,
      z.string().min(1, "R2_BUCKET_NAME cannot be empty when set").optional(),
    ),
    R2_PUBLIC_BASE_URL: z.preprocess(
      trimEmptyToUndefined,
      z
        .string()
        .url("R2_PUBLIC_BASE_URL must be a valid URL when set")
        .optional(),
    ),
    NEXT_PUBLIC_R2_PUBLIC_URL: z.preprocess(
      trimEmptyToUndefined,
      z
        .string()
        .url("NEXT_PUBLIC_R2_PUBLIC_URL must be a valid URL when set")
        .optional(),
    ),

    // Upstash Redis (optional — omit both URL and token to disable server-side Redis cache)
    UPSTASH_REDIS_REST_URL: optionalUrl,
    UPSTASH_REDIS_REST_TOKEN: optionalRedisToken,

    // Firebase Admin (Backend only)
    FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID is required"),
    FIREBASE_CLIENT_EMAIL: z
      .string()
      .email("FIREBASE_CLIENT_EMAIL must be a valid email"),
    FIREBASE_PRIVATE_KEY: z.string().min(1, "FIREBASE_PRIVATE_KEY is required"),

    // Firebase Client (Frontend)
    NEXT_PUBLIC_FIREBASE_API_KEY: z
      .string()
      .min(1, "NEXT_PUBLIC_FIREBASE_API_KEY is required"),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z
      .string()
      .min(1, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required"),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z
      .string()
      .min(1, "NEXT_PUBLIC_FIREBASE_PROJECT_ID is required"),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z
      .string()
      .min(1, "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is required"),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z
      .string()
      .min(1, "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is required"),
    NEXT_PUBLIC_FIREBASE_APP_ID: z
      .string()
      .min(1, "NEXT_PUBLIC_FIREBASE_APP_ID is required"),
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: z
      .string()
      .min(1, "NEXT_PUBLIC_FIREBASE_VAPID_KEY is required"),

    /** Google Analytics 4 measurement ID (G-xxxxxxxxxx). Omit to disable @next/third-parties GA. */
    NEXT_PUBLIC_GA_MEASUREMENT_ID: z.preprocess(
      trimEmptyToUndefined,
      z
        .string()
        .regex(/^G-[A-Z0-9]+$/i, "Must be a GA4 measurement ID (G-…)")
        .optional(),
    ),

    NEXT_PUBLIC_SENTRY_DSN: nextPublicSentryDsnSchema,

    /** YouTube Data API v3 key for searching YouTube videos */
    YOUTUBE_API_KEY: z.preprocess(
      trimEmptyToUndefined,
      z.string().min(1).optional(),
    ),

    /** Redis for BullMQ queues */
    REDIS_URL: z.preprocess(
      trimEmptyToUndefined,
      z.string().min(1).default("redis://localhost:6379"),
    ),
    REDIS_PASSWORD: z.preprocess(
      trimEmptyToUndefined,
      z.string().min(1).optional(),
    ),

    /** Dry-run mode for testing newsletter delivery without sending real emails */
    RESEND_DRY_RUN: z.preprocess(
      (val) => val === "true" || val === true || val === "1",
      z.boolean().default(false),
    ),

    /** Newsletter (Resend): omit to disable newsletter sending features. */
    RESEND_API_KEY: optionalNewsletterSecret,
    RESEND_FROM_EMAIL: z.preprocess(
      trimEmptyToUndefined,
      z.string().email("RESEND_FROM_EMAIL must be valid when set").optional(),
    ),
    RESEND_FROM_NAME: z.preprocess(
      trimEmptyToUndefined,
      z.string().min(1).optional(),
    ),
    QSTASH_URL: optionalUrl,
    QSTASH_TOKEN: optionalNewsletterSecret,
    QSTASH_CURRENT_SIGNING_KEY: optionalNewsletterSecret,
    QSTASH_NEXT_SIGNING_KEY: optionalNewsletterSecret,
  })
  .superRefine((data, ctx) => {
    const hasUrl = Boolean(data.UPSTASH_REDIS_REST_URL);
    const hasToken = Boolean(data.UPSTASH_REDIS_REST_TOKEN);
    if (hasUrl !== hasToken) {
      ctx.addIssue({
        code: "custom",
        message:
          "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must both be set or both omitted",
        path: ["UPSTASH_REDIS_REST_URL"],
      });
    }

    const r2Cluster = [
      data.R2_ACCOUNT_ID,
      data.R2_ACCESS_KEY_ID,
      data.R2_SECRET_ACCESS_KEY,
      data.R2_BUCKET_NAME,
      data.R2_PUBLIC_BASE_URL,
    ];
    const r2SetCount = r2Cluster.filter(Boolean).length;
    if (r2SetCount > 0 && r2SetCount < 5) {
      ctx.addIssue({
        code: "custom",
        message:
          "R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_BASE_URL must all be set together (or all omitted) to enable R2",
        path: ["R2_ACCOUNT_ID"],
      });
    }

    if (
      r2SetCount === 5 &&
      data.NEXT_PUBLIC_R2_PUBLIC_URL &&
      data.R2_PUBLIC_BASE_URL
    ) {
      try {
        const pub = new URL(data.R2_PUBLIC_BASE_URL);
        const np = new URL(data.NEXT_PUBLIC_R2_PUBLIC_URL);
        if (pub.origin !== np.origin) {
          ctx.addIssue({
            code: "custom",
            message:
              "NEXT_PUBLIC_R2_PUBLIC_URL must match R2_PUBLIC_BASE_URL origin (scheme + host + port) so build-time next/image allowlist matches stored object URLs",
            path: ["NEXT_PUBLIC_R2_PUBLIC_URL"],
          });
        }
      } catch {
        ctx.addIssue({
          code: "custom",
          message:
            "Could not compare R2_PUBLIC_BASE_URL and NEXT_PUBLIC_R2_PUBLIC_URL",
          path: ["NEXT_PUBLIC_R2_PUBLIC_URL"],
        });
      }
    }
  });

type EnvConfig = z.infer<typeof envSchema>;

let env: EnvConfig;

// Validate and memoize environment variables
try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVariables = error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Environment validation failed!\n${missingVariables}`);
  }
  throw error;
}

export { env };

/** True when R2 credentials and public URL are configured for user uploads (e.g. avatars). */
export const r2AvatarStorageEnabled = Boolean(
  env.R2_ACCOUNT_ID &&
  env.R2_ACCESS_KEY_ID &&
  env.R2_SECRET_ACCESS_KEY &&
  env.R2_BUCKET_NAME &&
  env.R2_PUBLIC_BASE_URL,
);

/** True when Resend credentials and from-address are configured. */
export const newsletterDeliveryEnabled = Boolean(
  env.RESEND_API_KEY && env.RESEND_FROM_EMAIL && env.RESEND_FROM_NAME,
);
