import { request, requestWithMeta } from "@/lib/api/api-core";
import type { CouponDTO } from "@/shared/types/coupon.types";
import type { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";
import type { CouponDiscountTypeEnum } from "@/shared/enums/coupon-discount-type.enum";
import type { CouponTypeEnum } from "@/shared/enums/coupon-type.enum";
import type { InvoiceCurrencyEnum } from "@/shared/enums/invoice-currency.enum";

type RedeemGiftCouponResult = {
  redeemed: true;
  couponId: string;
  code: string;
  giftPlan: SubscriptionPlanEnum;
  giftDuration: number;
  subscriptionId: string;
  invoiceId: string;
  previousExpiresAt: string | null;
  newExpiresAt: string;
};

type ListAdminCouponsParams = {
  q?: string;
  type?: CouponTypeEnum;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

export type AdminCreateCouponPayload = {
  code?: string;
  description?: string | null;
  type: CouponTypeEnum;
  usageLimit?: number | null;
  perUserLimit?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  // gift
  giftPlan?: SubscriptionPlanEnum;
  giftDuration?: number;
  // discount
  discountType?: CouponDiscountTypeEnum;
  discountValue?: number;
  currency?: InvoiceCurrencyEnum | null;
  applicablePlans?: SubscriptionPlanEnum[] | null;
};

export type AdminUpdateCouponPayload = {
  description?: string | null;
  usageLimit?: number | null;
  perUserLimit?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  giftDuration?: number;
  discountType?: CouponDiscountTypeEnum;
  discountValue?: number;
  currency?: InvoiceCurrencyEnum | null;
  applicablePlans?: SubscriptionPlanEnum[] | null;
};

export const couponsApi = {
  redeemGift: (payload: { code: string }) =>
    request<RedeemGiftCouponResult>("/coupons/redeem/gift", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const adminCouponsApi = {
  list: (query?: ListAdminCouponsParams) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<CouponDTO>(
      `/admin/coupons${params.size ? `?${params.toString()}` : ""}`,
    );
  },

  getById: (id: string) => request<CouponDTO>(`/admin/coupons/${id}`),

  create: (data: AdminCreateCouponPayload) =>
    request<CouponDTO>("/admin/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: AdminUpdateCouponPayload) =>
    request<CouponDTO>(`/admin/coupons/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<null>(`/admin/coupons/${id}`, {
      method: "DELETE",
    }),
};
