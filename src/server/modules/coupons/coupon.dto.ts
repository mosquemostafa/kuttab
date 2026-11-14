import { z } from "zod";

import { CouponDiscountTypeEnum } from "@/shared/enums/coupon-discount-type.enum";
import { CouponTypeEnum } from "@/shared/enums/coupon-type.enum";
import { InvoiceCurrencyEnum } from "@/shared/enums/invoice-currency.enum";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";

const couponTypeSchema = z.nativeEnum(CouponTypeEnum);
const couponDiscountTypeSchema = z.nativeEnum(CouponDiscountTypeEnum);

const couponCodeSchema = z
  .string()
  .trim()
  .min(4)
  .max(50)
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid coupon code format")
  .transform((value) => value.toUpperCase());

const optionalIsoDatetimeSchema = z.string().datetime().nullable().optional();

export const listAdminCouponsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  type: couponTypeSchema.optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const baseCreateCouponSchema = z
  .object({
    code: couponCodeSchema.optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    usageLimit: z.coerce.number().int().min(1).nullable().optional(),
    perUserLimit: z.coerce.number().int().min(1).optional().default(1),
    startsAt: optionalIsoDatetimeSchema,
    expiresAt: optionalIsoDatetimeSchema,
    isActive: z.boolean().optional().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.startsAt && value.expiresAt) {
      const startsAt = new Date(value.startsAt);
      const expiresAt = new Date(value.expiresAt);
      if (
        Number.isNaN(startsAt.getTime()) ||
        Number.isNaN(expiresAt.getTime())
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid startsAt/expiresAt date format",
        });
        return;
      }

      if (startsAt >= expiresAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expiresAt"],
          message: "expiresAt must be after startsAt",
        });
      }
    }
  });

const createGiftCouponSchema = z.object({
  type: z.literal(CouponTypeEnum.GIFT),
  giftPlan: z.literal(SubscriptionPlanEnum.PRO),
  giftDuration: z.coerce.number().int().min(1),
});

const createDiscountCouponSchema = z
  .object({
    type: z.literal(CouponTypeEnum.DISCOUNT),
    discountType: couponDiscountTypeSchema,
    discountValue: z.coerce.number().int().min(1),
    currency: z.nativeEnum(InvoiceCurrencyEnum).nullable().optional(),
    applicablePlans: z
      .array(z.nativeEnum(SubscriptionPlanEnum))
      .min(1)
      .nullable()
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.discountType === CouponDiscountTypeEnum.FIXED &&
      !value.currency
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currency"],
        message: "currency is required for fixed discounts",
      });
    }

    if (
      value.discountType === CouponDiscountTypeEnum.PERCENTAGE &&
      value.discountValue > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "percentage discountValue cannot exceed 100",
      });
    }
  });

export const adminCreateCouponSchema = z.intersection(
  baseCreateCouponSchema,
  z.discriminatedUnion("type", [
    createGiftCouponSchema,
    createDiscountCouponSchema,
  ]),
);

export const adminUpdateCouponSchema = z
  .object({
    description: z.string().trim().max(1000).nullable().optional(),
    usageLimit: z.coerce.number().int().min(1).nullable().optional(),
    perUserLimit: z.coerce.number().int().min(1).optional(),
    startsAt: optionalIsoDatetimeSchema,
    expiresAt: optionalIsoDatetimeSchema,
    isActive: z.boolean().optional(),

    // gift (type = gift)
    giftDuration: z.coerce.number().int().min(1).optional(),

    // discount (type = discount)
    discountType: couponDiscountTypeSchema.optional(),
    discountValue: z.coerce.number().int().min(1).optional(),
    currency: z.nativeEnum(InvoiceCurrencyEnum).nullable().optional(),
    applicablePlans: z
      .array(z.nativeEnum(SubscriptionPlanEnum))
      .min(1)
      .nullable()
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const redeemGiftCouponSchema = z.object({
  code: couponCodeSchema,
});

export type ListAdminCouponsQueryDTO = z.infer<
  typeof listAdminCouponsQuerySchema
>;
export type AdminCreateCouponDTO = z.infer<typeof adminCreateCouponSchema>;
export type AdminUpdateCouponDTO = z.infer<typeof adminUpdateCouponSchema>;
