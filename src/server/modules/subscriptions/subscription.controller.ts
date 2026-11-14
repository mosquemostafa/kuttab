import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import type { ApiSuccess } from "@/shared/types/api-response.types";
import type { PaginationMeta } from "@/shared/types/pagination.types";
import { getUserId } from "@/server/utils/request-user";
import { validateBody } from "@/server/pipes/validate.pipe";
import {
  adminActivateSubscriptionSchema,
  adminCancelSubscriptionSchema,
  adminChangePlanSchema,
  adminExtendSubscriptionSchema,
  adminInvoiceRefundSchema,
  adminRenewSubscriptionSchema,
  adminUpdateSubscriptionNotesSchema,
  checkoutSchema,
  listAdminSubscriptionsQuerySchema,
} from "@/server/modules/subscriptions/subscription.dto";
import { subscriptionService } from "@/server/modules/subscriptions/subscription.service";

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

export const subscriptionController = {
  async getPlans(): Promise<NextResponse> {
    const result = await subscriptionService.getPlans();
    return ok(result);
  },

  async getCurrentSubscription(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const result = await subscriptionService.getSubscription(userId);
    return ok(result);
  },

  async getCurrentEntitlements(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const result = await subscriptionService.getEntitlements(userId);
    return ok(result);
  },

  async getCurrentInvoices(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const result = await subscriptionService.listCurrentUserInvoices(userId);
    return ok(result);
  },

  async checkout(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const body = await req.json();
    const input = validateBody(checkoutSchema, body);
    const result = await subscriptionService.createCheckout(userId, input);
    return ok(result, undefined, 201);
  },

  async cancel(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const result = await subscriptionService.cancelAtPeriodEnd(userId);
    return ok(result);
  },

  async resume(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const result = await subscriptionService.resumeSubscription(userId);
    return ok(result);
  },

  async startTrial(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const result = await subscriptionService.startTrial(userId);
    return ok(result, undefined, 201);
  },

  async handlePaymobWebhook(req: NextRequest): Promise<NextResponse> {
    const payload = await req.json();
    const result = await subscriptionService.handlePaymobWebhook(payload);
    return ok(result);
  },

  async handleKashierWebhook(req: NextRequest): Promise<NextResponse> {
    const payload = await req.json();
    const result = await subscriptionService.handleKashierWebhook(payload);
    return ok(result);
  },

  async listAdminSubscriptions(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const query = listAdminSubscriptionsQuerySchema.parse({
      plan: searchParams.get("plan") ?? undefined,
      activatedBy: searchParams.get("activatedBy") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const result = await subscriptionService.listAdminSubscriptions(query);
    return ok(result.items, result.meta);
  },

  async getAdminSubscriptionById(
    _req: NextRequest,
    subscriptionId: string,
  ): Promise<NextResponse> {
    const result =
      await subscriptionService.getAdminSubscriptionById(subscriptionId);
    return ok(result);
  },

  async getAdminSubscriptionByUserId(
    _req: NextRequest,
    userId: string,
  ): Promise<NextResponse> {
    const result =
      await subscriptionService.getAdminSubscriptionByUserId(userId);
    return ok(result.subscription);
  },

  async activateByAdmin(req: NextRequest): Promise<NextResponse> {
    const actorId = getUserId(req);
    const body = await req.json();
    const input = validateBody(adminActivateSubscriptionSchema, body);
    const result = await subscriptionService.activateSubscription(
      actorId,
      input,
    );
    return ok(result, undefined, 201);
  },

  async extendByAdmin(req: NextRequest, id: string): Promise<NextResponse> {
    const actorId = getUserId(req);
    const body = await req.json();
    const input = validateBody(adminExtendSubscriptionSchema, body);
    const result = await subscriptionService.extendSubscription(
      actorId,
      id,
      input,
    );
    return ok(result);
  },

  async renewByAdmin(req: NextRequest, id: string): Promise<NextResponse> {
    const actorId = getUserId(req);
    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const input = validateBody(adminRenewSubscriptionSchema, body);
    const result = await subscriptionService.renewSubscription(
      actorId,
      id,
      input,
    );
    return ok(result);
  },

  async changePlanByAdmin(req: NextRequest, id: string): Promise<NextResponse> {
    const actorId = getUserId(req);
    const body = await req.json();
    const input = validateBody(adminChangePlanSchema, body);
    const result = await subscriptionService.changeSubscriptionPlan(
      actorId,
      id,
      input,
    );
    return ok(result);
  },

  async cancelByAdmin(req: NextRequest, id: string): Promise<NextResponse> {
    const actorId = getUserId(req);
    const body = await req.json();
    const input = validateBody(adminCancelSubscriptionSchema, body);
    const result = await subscriptionService.cancelSubscriptionByAdmin(
      actorId,
      id,
      input,
    );
    return ok(result);
  },

  async refundInvoiceByAdmin(
    req: NextRequest,
    id: string,
  ): Promise<NextResponse> {
    const actorId = getUserId(req);
    const body = await req.json();
    const input = validateBody(adminInvoiceRefundSchema, body);
    const result = await subscriptionService.refundInvoiceByAdmin(
      actorId,
      id,
      input,
    );
    return ok(result);
  },

  async listEventsByAdmin(
    _req: NextRequest,
    id: string,
  ): Promise<NextResponse> {
    const result = await subscriptionService.listSubscriptionEventsByAdmin(id);
    return ok(result);
  },

  async listInvoicesByAdmin(
    _req: NextRequest,
    id: string,
  ): Promise<NextResponse> {
    const result =
      await subscriptionService.listSubscriptionInvoicesByAdmin(id);
    return ok(result);
  },

  async getInvoiceByIdByAdmin(
    _req: NextRequest,
    id: string,
  ): Promise<NextResponse> {
    const result = await subscriptionService.getInvoiceByIdByAdmin(id);
    return ok(result);
  },

  async getEventByIdByAdmin(
    _req: NextRequest,
    id: string,
  ): Promise<NextResponse> {
    const result = await subscriptionService.getEventByIdByAdmin(id);
    return ok(result);
  },

  async updateSubscriptionNotesByAdmin(
    req: NextRequest,
    id: string,
  ): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(adminUpdateSubscriptionNotesSchema, body);
    const result = await subscriptionService.updateSubscriptionNotesByAdmin(
      id,
      input,
    );
    return ok(result);
  },
};
