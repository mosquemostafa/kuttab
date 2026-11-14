import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { contactSchema } from "@/server/modules/contact/contact.dto";
import { contactService } from "@/server/modules/contact/contact.service";
import { validateBody } from "@/server/pipes/validate.pipe";
import {
  flushRateLimitPending,
  getClientIpFromHeaders,
  getRateLimiters,
} from "@/lib/ratelimit";
import { RateLimitException } from "@/server/exceptions/exceptions";
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

export const contactController = {
  async send(req: NextRequest): Promise<NextResponse> {
    const ip = getClientIpFromHeaders(req.headers);
    const { contactForm } = getRateLimiters();

    const rateResult = await contactForm.limit(`ip:${ip}`);
    await flushRateLimitPending(rateResult);

    if (!rateResult.success) {
      throw new RateLimitException();
    }

    const raw = await req.json();
    const body = validateBody(contactSchema, raw);
    await contactService.sendContactMessage(body);

    return ok({ sent: true });
  },
};
