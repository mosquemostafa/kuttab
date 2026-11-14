import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  adminCreateCouponSchema,
  adminUpdateCouponSchema,
  listAdminCouponsQuerySchema,
  redeemGiftCouponSchema,
} from "@/server/modules/coupons/coupon.dto";
import { couponService } from "@/server/modules/coupons/coupon.service";
import { getUserId } from "@/server/utils/request-user";
import { parsePagination } from "@/server/pipes/parse-pagination.pipe";
import { validateBody } from "@/server/pipes/validate.pipe";
import type { ApiSuccess } from "@/shared/types/api-response.types";
import type { PaginationMeta } from "@/shared/types/pagination.types";

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

export const couponController = {
  async listAdmin(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);

    const parsed = listAdminCouponsQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      isActive: searchParams.get("isActive") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const pagination = parsePagination(searchParams);

    const result = await couponService.listAdminCoupons(pagination, parsed);
    return ok(result.items, result.meta);
  },

  async getById(id: string): Promise<NextResponse> {
    const result = await couponService.getAdminCouponById(id);
    return ok(result);
  },

  async createByAdmin(req: NextRequest): Promise<NextResponse> {
    const actorId = getUserId(req);
    const body = await req.json();
    const input = validateBody(adminCreateCouponSchema, body);
    const result = await couponService.createAdminCoupon(actorId, input);
    return ok(result, undefined, 201);
  },

  async updateByAdmin(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(adminUpdateCouponSchema, body);
    const result = await couponService.updateAdminCoupon(id, input);
    return ok(result);
  },

  async deleteByAdmin(id: string): Promise<NextResponse> {
    await couponService.deleteAdminCoupon(id);
    return new NextResponse(null, { status: 204 });
  },

  async redeemGift(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const body = await req.json();
    const input = validateBody(redeemGiftCouponSchema, body);
    const result = await couponService.redeemGiftCoupon(userId, input.code);
    return ok(result);
  },
};
