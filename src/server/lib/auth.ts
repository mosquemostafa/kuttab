import { db } from "@/server/db";
import * as schema from "@/server/db/schema";
import { sendAuthEmail } from "@/server/lib/auth-email";
import { getVerificationEmailTemplate } from "@/server/lib/email";
import { getResetPasswordEmailTemplate } from "@/server/lib/email";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { appSettingsService } from "@/server/modules/app-settings/app-settings.service";
import {
  flushRateLimitPending,
  getClientIpFromHeaders,
  getRateLimiters,
} from "@/lib/ratelimit";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin, bearer } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getAllowedOrigins } from "@/server/lib/cors";

const getLocaleFromUrl = (url: string): string => {
  try {
    const maybeLocale = new URL(url).pathname.split("/").filter(Boolean)[0];

    return hasLocale(routing.locales, maybeLocale)
      ? maybeLocale
      : routing.defaultLocale;
  } catch {
    return routing.defaultLocale;
  }
};

/** Direct HTTP to `/api/auth/*` only; in-process `auth.api.*` has no `ctx.request`. */
const RATE_LIMITED_AUTH_POST_PATHS: Record<
  string,
  "login" | "forgotPassword" | "signUp"
> = {
  "/sign-in/email": "login",
  "/send-verification-email": "login",
  "/request-password-reset": "forgotPassword",
  "/sign-up/email": "signUp",
};

const rateLimitSensitiveAuthPostsBefore = createAuthMiddleware(async (ctx) => {
  if (ctx.method !== "POST") {
    return;
  }
  const limiterKey = RATE_LIMITED_AUTH_POST_PATHS[ctx.path];
  if (!limiterKey || !ctx.request) {
    return;
  }

  const limiter = getRateLimiters()[limiterKey];

  const email =
    ctx.body &&
    typeof ctx.body === "object" &&
    "email" in ctx.body &&
    typeof (ctx.body as { email?: unknown }).email === "string"
      ? (ctx.body as { email: string }).email.trim().toLowerCase()
      : undefined;

  if (email) {
    const byEmail = await limiter.limit(`email:${email}`);
    await flushRateLimitPending(byEmail);
    if (!byEmail.success) {
      throw new APIError("TOO_MANY_REQUESTS", {
        message: "Too many requests. Please try again later.",
      });
    }
  }

  const ip = getClientIpFromHeaders(ctx.request.headers);
  const byIp = await limiter.limit(`ip:${ip}`);
  await flushRateLimitPending(byIp);

  if (!byIp.success) {
    throw new APIError("TOO_MANY_REQUESTS", {
      message: "Too many requests. Please try again later.",
    });
  }
});

const syncAppSettingsAuthMiddleware = createAuthMiddleware(async (ctx) => {
  let settings;
  try {
    settings = await appSettingsService.getSettings();
  } catch {
    return;
  }

  if (
    ctx.path === "/sign-up/email" &&
    ctx.method === "POST" &&
    !settings.allowSelfRegistration
  ) {
    throw new APIError("FORBIDDEN", {
      message: "Self-registration is currently disabled.",
    });
  }

  if (ctx.context?.options?.emailAndPassword) {
    ctx.context.options.emailAndPassword.requireEmailVerification =
      settings.requireEmailVerification;
  }
  if (ctx.context?.options?.emailVerification) {
    ctx.context.options.emailVerification.sendOnSignUp =
      settings.requireEmailVerification;
  }

  // Also sync to the top-level auth instance
  if (auth?.options?.emailAndPassword) {
    (
      auth.options.emailAndPassword as { requireEmailVerification?: boolean }
    ).requireEmailVerification = settings.requireEmailVerification;
  }
  if (auth?.options?.emailVerification) {
    (
      auth.options.emailVerification as { sendOnSignUp?: boolean }
    ).sendOnSignUp = settings.requireEmailVerification;
  }
});

export const auth = betterAuth({
  trustHost: true,
  trustedOrigins: getAllowedOrigins(),
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      await syncAppSettingsAuthMiddleware(ctx);
      await rateLimitSensitiveAuthPostsBefore(ctx);
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          try {
            const settings = await appSettingsService.getSettings();
            if (!settings.requireEmailVerification) {
              return {
                data: {
                  ...user,
                  emailVerified: true,
                },
              };
            }
          } catch {
            // Keep user as-is if app settings cannot be fetched
          }
        },
      },
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.user,
    },
  }),
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: true,
        input: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const locale = getLocaleFromUrl(url);
      const isArabic = locale === "ar";

      await sendAuthEmail({
        to: user.email,
        subject: isArabic ? "إعادة تعيين كلمة المرور" : "Reset your password",
        html: getResetPasswordEmailTemplate({
          name: user.name,
          resetUrl: url,
          locale,
        }),
        text: isArabic
          ? `اضغط على الرابط لإعادة تعيين كلمة المرور: ${url}`
          : `Click the link to reset your password: ${url}`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const locale = getLocaleFromUrl(url);
      const isArabic = locale === "ar";

      await sendAuthEmail({
        to: user.email,
        subject: isArabic
          ? "تأكيد عنوان بريدك الإلكتروني"
          : "Verify your email address",
        html: getVerificationEmailTemplate({
          name: user.name,
          verificationUrl: url,
          locale,
        }),
        text: isArabic
          ? `اضغط على الرابط لتأكيد بريدك الإلكتروني: ${url}`
          : `Click the link to verify your email: ${url}`,
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  plugins: [
    nextCookies(),
    bearer(),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
});
