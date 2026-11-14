import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  flushRateLimitPending,
  getClientIpFromRequest,
  rateLimiters,
} from "@/lib/ratelimit";
import { RateLimitException } from "@/server/exceptions/exceptions";
import {
  createNewsletterCampaignSchema,
  listNewsletterCampaignsQuerySchema,
  listNewsletterSubscribersQuerySchema,
  newsletterSubscribeSchema,
  newsletterUnsubscribeSchema,
  updateNewsletterCampaignSchema,
} from "@/server/modules/newsletter/newsletter.dto";
import { newsletterService } from "@/server/modules/newsletter/newsletter.service";
import { parsePagination } from "@/server/pipes/parse-pagination.pipe";
import { validateBody } from "@/server/pipes/validate.pipe";
import type { ApiSuccess } from "@/shared/types/api-response.types";
import type { PaginationMeta } from "@/shared/types/pagination.types";

type AdminRequest = NextRequest & {
  session: { user: { id: string } };
};

function ok<T>(
  data: T,
  meta?: PaginationMeta,
  status = 200,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export const newsletterController = {
  async subscribe(req: NextRequest): Promise<NextResponse> {
    const ip = getClientIpFromRequest(req);
    const byIp = await rateLimiters.subscribe.limit(`ip:${ip}`);
    await flushRateLimitPending(byIp);
    if (!byIp.success) {
      throw new RateLimitException();
    }

    const body = await req.json();
    const input = validateBody(newsletterSubscribeSchema, body);
    const emailKey = input.email.trim().toLowerCase();
    const byEmail = await rateLimiters.subscribe.limit(`email:${emailKey}`);
    await flushRateLimitPending(byEmail);
    if (!byEmail.success) {
      throw new RateLimitException();
    }
    const data = await newsletterService.subscribe(input);
    return ok(data, undefined, 201);
  },

  async unsubscribePost(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const { token } = validateBody(newsletterUnsubscribeSchema, body);
    await newsletterService.unsubscribeByToken(token);
    return ok({ ok: true });
  },

  async listSubscribers(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    listNewsletterSubscribersQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const pagination = parsePagination(searchParams);
    const result = await newsletterService.listSubscribersForAdmin({
      page: pagination.page,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    const totalPages = Math.max(1, Math.ceil(result.total / pagination.limit));
    const meta: PaginationMeta = {
      page: pagination.page,
      limit: pagination.limit,
      total: result.total,
      totalPages,
    };
    const safeItems = result.items.map(
      ({ unsubscribeToken: _t, ...rest }) => rest,
    );
    return ok(safeItems, meta);
  },

  async listCampaigns(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    listNewsletterCampaignsQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const pagination = parsePagination(searchParams);
    const result = await newsletterService.listCampaignsForAdmin({
      page: pagination.page,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    const totalPages = Math.max(1, Math.ceil(result.total / pagination.limit));
    const meta: PaginationMeta = {
      page: pagination.page,
      limit: pagination.limit,
      total: result.total,
      totalPages,
    };
    return ok(result.items, meta);
  },

  async createCampaign(req: NextRequest): Promise<NextResponse> {
    const session = (req as AdminRequest).session;
    const body = await req.json();
    const input = validateBody(createNewsletterCampaignSchema, body);
    const data = await newsletterService.createCampaign(session.user.id, input);
    return ok(data, undefined, 201);
  },

  async getCampaign(_req: NextRequest, id: string): Promise<NextResponse> {
    const data = await newsletterService.getCampaignForAdmin(id);
    return ok(data);
  },

  async updateCampaign(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateNewsletterCampaignSchema, body);
    await newsletterService.updateCampaign(id, input);
    return ok({ ok: true });
  },

  async deleteDraftCampaign(
    _req: NextRequest,
    id: string,
  ): Promise<NextResponse> {
    await newsletterService.deleteDraftCampaign(id);
    return ok({ ok: true });
  },

  async sendCampaign(_req: NextRequest, id: string): Promise<NextResponse> {
    await newsletterService.startCampaignSend(id);
    return ok({ ok: true });
  },

  async resumeCampaign(_req: NextRequest, id: string): Promise<NextResponse> {
    const result = await newsletterService.resumeCampaignSend(id);
    return ok({ ok: true, resumeGeneration: result.resumeGeneration });
  },
};
