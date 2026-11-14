import { CouponDiscountTypeEnum } from "@/shared/enums/coupon-discount-type.enum";
import { CouponTypeEnum } from "@/shared/enums/coupon-type.enum";
import { InvoiceCurrencyEnum } from "@/shared/enums/invoice-currency.enum";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";

export type CouponDTO = {
  id: string;
  code: string;
  description: string | null;
  type: CouponTypeEnum;

  discountType: CouponDiscountTypeEnum | null;
  discountValue: number | null;
  currency: InvoiceCurrencyEnum | null;

  giftPlan: SubscriptionPlanEnum | null;
  giftDuration: number | null;

  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;

  startsAt: string | null;
  expiresAt: string | null;

  applicablePlans: SubscriptionPlanEnum[] | null;

  isActive: boolean;
  createdByUserId: string;

  createdAt: string;
  updatedAt: string;
};
