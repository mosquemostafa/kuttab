import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { ValidationException } from "@/server/exceptions/exceptions";
import { newsletterService } from "@/server/modules/newsletter/newsletter.service";
import { userRepository } from "@/server/modules/users/user.repository";
import { validateBody } from "@/server/pipes/validate.pipe";
import { getUserId } from "@/server/utils/request-user";
import type { ApiSuccess } from "@/shared/types/api-response.types";

function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

const postBodySchema = z.object({
  locale: z.enum(["en", "ar"]).optional(),
});

const patchBodySchema = z.object({
  locale: z.enum(["en", "ar"]),
});

export const dashboardNewsletterController = {
  async getStatus(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const profile = await userRepository.findProfileById(userId);
    if (!profile?.email?.trim()) {
      return ok({ subscribed: false, locale: null });
    }
    const result = await newsletterService.getSubscriptionStatusForEmail(
      profile.email,
    );
    return ok(result);
  },

  async subscribe(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const profile = await userRepository.findProfileById(userId);
    if (!profile?.email?.trim()) {
      throw new ValidationException({
        email: ["Your account does not have an email address."],
      });
    }
    const raw = await req.json().catch(() => ({}));
    const body = validateBody(postBodySchema, raw);
    await newsletterService.subscribe({
      email: profile.email.trim().toLowerCase(),
      locale: body.locale,
    });
    const after = await newsletterService.getSubscriptionStatusForEmail(
      profile.email.trim().toLowerCase(),
    );
    return ok({
      subscribed: after.subscribed,
      locale: after.locale,
    });
  },

  async unsubscribe(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const profile = await userRepository.findProfileById(userId);
    if (!profile?.email?.trim()) {
      return ok({ subscribed: false });
    }
    await newsletterService.unsubscribeByEmail(profile.email);
    return ok({ subscribed: false, locale: null });
  },

  async patchLocale(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const profile = await userRepository.findProfileById(userId);
    if (!profile?.email?.trim()) {
      throw new ValidationException({
        email: ["Your account does not have an email address."],
      });
    }
    const raw = await req.json().catch(() => ({}));
    const body = validateBody(patchBodySchema, raw);
    const result = await newsletterService.updateNewsletterLocaleForEmail(
      profile.email.trim().toLowerCase(),
      body.locale,
    );
    return ok({ subscribed: true, locale: result.locale });
  },
};
