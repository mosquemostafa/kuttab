import { randomBytes } from "crypto";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/server/db";
import type {
  AdminCreateCouponDTO,
  AdminUpdateCouponDTO,
  ListAdminCouponsQueryDTO,
} from "@/server/modules/coupons/coupon.dto";
import { couponRepository } from "@/server/modules/coupons/coupon.repository";
import { coupon, couponUsage } from "@/server/modules/coupons/coupon.entity";
import {
  ConflictException,
  NotFoundException,
  ValidationException,
} from "@/server/exceptions/exceptions";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import type { PaginatedResponse } from "@/shared/types/pagination.types";
import type { CouponDTO } from "@/shared/types/coupon.types";
import { CouponDiscountTypeEnum } from "@/shared/enums/coupon-discount-type.enum";
import { CouponTypeEnum } from "@/shared/enums/coupon-type.enum";
import { InvoiceCurrencyEnum } from "@/shared/enums/invoice-currency.enum";
import { InvoicePaymentMethodEnum } from "@/shared/enums/invoice-payment-method.enum";
import { InvoiceStatusEnum } from "@/shared/enums/invoice-status.enum";
import { SubscriptionActivatedByEnum } from "@/shared/enums/subscription-activated-by.enum";
import { SubscriptionEventTypeEnum } from "@/shared/enums/subscription-event-type.enum";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";
import {
  invoice,
  subscription,
  subscriptionEvent,
} from "@/server/modules/subscriptions/subscription.entity";

type CouponRow =
  Awaited<ReturnType<typeof couponRepository.findById>> extends infer T
    ? NonNullable<T>
    : never;

function toDTO(row: CouponRow): CouponDTO {
  return {
    id: row.id,
    code: row.code,
    description: row.description ?? null,
    type: row.type,

    discountType: row.discountType ?? null,
    discountValue: row.discountValue ?? null,
    currency: row.currency ?? null,

    giftPlan: row.giftPlan ?? null,
    giftDuration: row.giftDuration ?? null,

    usageLimit: row.usageLimit ?? null,
    usageCount: row.usageCount,
    perUserLimit: row.perUserLimit,

    startsAt: row.startsAt ? row.startsAt.toISOString() : null,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,

    applicablePlans: row.applicablePlans ?? null,

    isActive: row.isActive,
    createdByUserId: row.createdByUserId,

    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("coupons_code_unique") ||
    error.message.includes("duplicate key")
  );
}

function parseOptionalDate(value: string | null | undefined): Date | null {
  if (value === undefined) {
    return undefined as never;
  }

  if (value === null) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationException({
      date: "Invalid date format",
    });
  }

  return date;
}

function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

function generateCouponCode(length = 10): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);

  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }

  return out;
}

function assertCouponIntegrity(candidate: {
  type: CouponTypeEnum;
  discountType: CouponDiscountTypeEnum | null;
  discountValue: number | null;
  currency: unknown;
  giftPlan: SubscriptionPlanEnum | null;
  giftDuration: number | null;
  startsAt: Date | null;
  expiresAt: Date | null;
}): void {
  if (
    candidate.startsAt &&
    candidate.expiresAt &&
    candidate.startsAt >= candidate.expiresAt
  ) {
    throw new ValidationException({
      expiresAt: "expiresAt must be after startsAt",
    });
  }

  if (candidate.type === CouponTypeEnum.GIFT) {
    if (!candidate.giftPlan || !candidate.giftDuration) {
      throw new ValidationException({
        giftPlan: "giftPlan is required for gift coupons",
        giftDuration: "giftDuration is required for gift coupons",
      });
    }

    if (candidate.giftPlan !== SubscriptionPlanEnum.PRO) {
      throw new ValidationException({
        giftPlan: "Only pro giftPlan is supported",
      });
    }

    return;
  }

  // discount
  if (!candidate.discountType || !candidate.discountValue) {
    throw new ValidationException({
      discountType: "discountType is required for discount coupons",
      discountValue: "discountValue is required for discount coupons",
    });
  }

  if (
    candidate.discountType === CouponDiscountTypeEnum.PERCENTAGE &&
    candidate.discountValue > 100
  ) {
    throw new ValidationException({
      discountValue: "percentage discountValue cannot exceed 100",
    });
  }

  if (
    candidate.discountType === CouponDiscountTypeEnum.FIXED &&
    !candidate.currency
  ) {
    throw new ValidationException({
      currency: "currency is required for fixed discounts",
    });
  }
}

export const couponService = {
  async listAdminCoupons(
    pagination: ParsedPagination,
    query: ListAdminCouponsQueryDTO,
  ): Promise<PaginatedResponse<CouponDTO>> {
    const result = await couponRepository.findMany(pagination, {
      q: query.q,
      type: query.type,
      isActive: query.isActive,
    });

    return {
      items: result.items.map(toDTO),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit),
      },
    };
  },

  async getAdminCouponById(id: string): Promise<CouponDTO> {
    const existing = await couponRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("Coupon", id);
    }

    return toDTO(existing);
  },

  async createAdminCoupon(
    actorId: string,
    dto: AdminCreateCouponDTO,
  ): Promise<CouponDTO> {
    const startsAt = dto.startsAt ? parseOptionalDate(dto.startsAt) : null;
    const expiresAt = dto.expiresAt ? parseOptionalDate(dto.expiresAt) : null;

    const code = dto.code ? normalizeCouponCode(dto.code) : undefined;

    const baseValues = {
      code: code ?? "",
      description: dto.description ?? null,
      type: dto.type,
      usageLimit: dto.usageLimit ?? null,
      usageCount: 0,
      perUserLimit: dto.perUserLimit,
      startsAt,
      expiresAt,
      isActive: dto.isActive,
      createdByUserId: actorId,

      discountType: null,
      discountValue: null,
      currency: null,
      applicablePlans: null,

      giftPlan: null,
      giftDuration: null,
    } as const;

    const values =
      dto.type === CouponTypeEnum.GIFT
        ? {
            ...baseValues,
            giftPlan: dto.giftPlan,
            giftDuration: dto.giftDuration,
          }
        : {
            ...baseValues,
            discountType: dto.discountType,
            discountValue: dto.discountValue,
            currency:
              dto.discountType === CouponDiscountTypeEnum.FIXED
                ? (dto.currency ?? null)
                : null,
            applicablePlans: dto.applicablePlans ?? null,
          };

    assertCouponIntegrity({
      type: values.type,
      discountType: values.discountType,
      discountValue: values.discountValue,
      currency: values.currency,
      giftPlan: values.giftPlan,
      giftDuration: values.giftDuration,
      startsAt: values.startsAt,
      expiresAt: values.expiresAt,
    });

    if (dto.code) {
      try {
        const created = await couponRepository.create({
          ...values,
          code: normalizeCouponCode(dto.code),
        });

        return toDTO(created);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ConflictException("A coupon with this code already exists");
        }

        throw error;
      }
    }

    // auto-generate
    for (let attempt = 0; attempt < 5; attempt++) {
      const generated = generateCouponCode(10);
      try {
        const created = await couponRepository.create({
          ...values,
          code: generated,
        });
        return toDTO(created);
      } catch (error) {
        if (isUniqueViolation(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException("Failed to generate a unique coupon code");
  },

  async updateAdminCoupon(
    id: string,
    dto: AdminUpdateCouponDTO,
  ): Promise<CouponDTO> {
    const existing = await couponRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("Coupon", id);
    }

    const startsAt =
      dto.startsAt !== undefined
        ? parseOptionalDate(dto.startsAt)
        : existing.startsAt;
    const expiresAt =
      dto.expiresAt !== undefined
        ? parseOptionalDate(dto.expiresAt)
        : existing.expiresAt;

    const merged = {
      type: existing.type,
      discountType:
        dto.discountType !== undefined
          ? dto.discountType
          : existing.discountType,
      discountValue:
        dto.discountValue !== undefined
          ? dto.discountValue
          : existing.discountValue,
      currency: dto.currency !== undefined ? dto.currency : existing.currency,
      giftPlan: existing.giftPlan,
      giftDuration:
        dto.giftDuration !== undefined
          ? dto.giftDuration
          : existing.giftDuration,
      startsAt,
      expiresAt,
    };

    assertCouponIntegrity({
      type: merged.type,
      discountType: merged.discountType ?? null,
      discountValue: merged.discountValue ?? null,
      currency: merged.currency,
      giftPlan: merged.giftPlan ?? null,
      giftDuration: merged.giftDuration ?? null,
      startsAt: merged.startsAt ?? null,
      expiresAt: merged.expiresAt ?? null,
    });

    const patch: Partial<typeof existing> = {
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.usageLimit !== undefined ? { usageLimit: dto.usageLimit } : {}),
      ...(dto.perUserLimit !== undefined
        ? { perUserLimit: dto.perUserLimit }
        : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.startsAt !== undefined ? { startsAt } : {}),
      ...(dto.expiresAt !== undefined ? { expiresAt } : {}),
    };

    if (existing.type === CouponTypeEnum.GIFT) {
      if (dto.giftDuration !== undefined) {
        patch.giftDuration = dto.giftDuration;
      }

      // Ensure discount fields stay null for gift coupons
      patch.discountType = null;
      patch.discountValue = null;
      patch.currency = null;
      patch.applicablePlans = null;
    } else {
      if (dto.discountType !== undefined) {
        patch.discountType = dto.discountType;
      }
      if (dto.discountValue !== undefined) {
        patch.discountValue = dto.discountValue;
      }
      if (dto.currency !== undefined) {
        patch.currency = dto.currency;
      }
      if (dto.applicablePlans !== undefined) {
        patch.applicablePlans = dto.applicablePlans;
      }

      // Ensure gift fields stay null for discount coupons
      patch.giftPlan = null;
      patch.giftDuration = null;

      // If fixed, require currency; if percentage, null out currency
      const nextDiscountType = merged.discountType;
      if (nextDiscountType === CouponDiscountTypeEnum.PERCENTAGE) {
        patch.currency = null;
      }
    }

    const updated = await couponRepository.update(id, patch);
    if (!updated) {
      throw new NotFoundException("Coupon", id);
    }

    return toDTO(updated);
  },

  async deleteAdminCoupon(id: string): Promise<void> {
    const deleted = await couponRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException("Coupon", id);
    }
  },

  async redeemGiftCoupon(
    userId: string,
    rawCode: string,
  ): Promise<{
    redeemed: true;
    couponId: string;
    code: string;
    giftPlan: SubscriptionPlanEnum;
    giftDuration: number;
    subscriptionId: string;
    invoiceId: string;
    previousExpiresAt: string | null;
    newExpiresAt: string;
  }> {
    const now = new Date();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const code = normalizeCouponCode(rawCode);

    return db.transaction(async (tx) => {
      const [existingCoupon] = await tx
        .select()
        .from(coupon)
        .where(eq(coupon.code, code))
        .limit(1);

      if (!existingCoupon || existingCoupon.type !== CouponTypeEnum.GIFT) {
        throw new NotFoundException("Coupon", code);
      }

      if (!existingCoupon.isActive) {
        throw new NotFoundException("Coupon", code);
      }

      if (existingCoupon.startsAt && existingCoupon.startsAt > now) {
        throw new NotFoundException("Coupon", code);
      }

      if (existingCoupon.expiresAt && existingCoupon.expiresAt <= now) {
        throw new NotFoundException("Coupon", code);
      }

      const giftPlan = existingCoupon.giftPlan;
      const giftDuration = existingCoupon.giftDuration;

      if (!giftPlan || !giftDuration) {
        throw new NotFoundException("Coupon", code);
      }

      // Gift coupons are currently restricted to pro.
      if (giftPlan !== SubscriptionPlanEnum.PRO) {
        throw new ValidationException({
          giftPlan: "Only pro gift coupons are supported",
        });
      }

      if (
        existingCoupon.usageLimit !== null &&
        existingCoupon.usageCount >= existingCoupon.usageLimit
      ) {
        throw new NotFoundException("Coupon", code);
      }

      const [userUsageCountRow] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(couponUsage)
        .where(
          and(
            eq(couponUsage.couponId, existingCoupon.id),
            eq(couponUsage.userId, userId),
          ),
        );

      const userUsageCount = Number(userUsageCountRow?.count ?? 0);
      if (userUsageCount >= existingCoupon.perUserLimit) {
        throw new ConflictException("Coupon was already redeemed");
      }

      const couponUpdateWhere =
        existingCoupon.usageLimit !== null
          ? and(
              eq(coupon.id, existingCoupon.id),
              sql`${coupon.usageCount} < ${existingCoupon.usageLimit}`,
            )
          : eq(coupon.id, existingCoupon.id);

      const [updatedCouponRow] = await tx
        .update(coupon)
        .set({
          usageCount: sql`${coupon.usageCount} + 1`,
          updatedAt: now,
        })
        .where(couponUpdateWhere)
        .returning({ id: coupon.id });

      if (!updatedCouponRow) {
        throw new ConflictException("Coupon usage limit reached");
      }

      const [existingSubscription] = await tx
        .select({
          id: subscription.id,
          plan: subscription.plan,
          planStartedAt: subscription.planStartedAt,
          planExpiresAt: subscription.planExpiresAt,
          autoRenew: subscription.autoRenew,
          trialUsed: subscription.trialUsed,
          activatedBy: subscription.activatedBy,
          activatedByUserId: subscription.activatedByUserId,
          activatedAt: subscription.activatedAt,
          notes: subscription.notes,
        })
        .from(subscription)
        .where(eq(subscription.userId, userId))
        .limit(1);

      const previousExpiresAt = existingSubscription
        ? existingSubscription.planExpiresAt.toISOString()
        : null;

      const baseStart =
        existingSubscription && existingSubscription.planExpiresAt > now
          ? existingSubscription.planExpiresAt
          : now;

      const newPlanExpiresAt = new Date(
        baseStart.getTime() + giftDuration * millisecondsPerDay,
      );

      let subscriptionId: string;
      let eventType: SubscriptionEventTypeEnum;
      let periodStart: Date;

      if (!existingSubscription) {
        const [createdSubscription] = await tx
          .insert(subscription)
          .values({
            userId,
            plan: giftPlan,
            planStartedAt: now,
            planExpiresAt: newPlanExpiresAt,
            autoRenew: false,
            trialUsed: false,
            activatedBy: SubscriptionActivatedByEnum.MANUAL,
            activatedByUserId: userId,
            activatedAt: now,
            notes: null,
            gateway: null,
            gatewaySubscriptionId: null,
            gatewayCustomerId: null,
          })
          .returning({ id: subscription.id });

        if (!createdSubscription) {
          throw new Error("Failed to create subscription row.");
        }

        subscriptionId = createdSubscription.id;
        eventType = SubscriptionEventTypeEnum.SUBSCRIPTION_CREATED;
        periodStart = now;
      } else {
        const hasRemainingDays = existingSubscription.planExpiresAt > now;

        const [updatedSubscription] = await tx
          .update(subscription)
          .set({
            plan: giftPlan,
            ...(hasRemainingDays ? {} : { planStartedAt: now }),
            planExpiresAt: newPlanExpiresAt,
            updatedAt: now,
          })
          .where(eq(subscription.id, existingSubscription.id))
          .returning({ id: subscription.id });

        subscriptionId = updatedSubscription?.id ?? existingSubscription.id;
        eventType = SubscriptionEventTypeEnum.SUBSCRIPTION_RENEWED;
        periodStart = hasRemainingDays
          ? existingSubscription.planExpiresAt
          : now;
      }

      const [createdInvoice] = await tx
        .insert(invoice)
        .values({
          subscriptionId,
          amount: 0,
          currency: InvoiceCurrencyEnum.EGP,
          status: InvoiceStatusEnum.PAID,
          refundedAmount: null,
          paymentMethod: InvoicePaymentMethodEnum.COMPLIMENTARY,
          gateway: null,
          gatewayPaymentId: null,
          paymentReference: `gift-coupon:${existingCoupon.code}`,
          periodStart,
          periodEnd: newPlanExpiresAt,
          paidAt: now,
        })
        .returning({ id: invoice.id });

      if (!createdInvoice) {
        throw new Error("Failed to create invoice row.");
      }

      await tx.insert(couponUsage).values({
        couponId: existingCoupon.id,
        userId,
        invoiceId: createdInvoice.id,
      });

      await tx.insert(subscriptionEvent).values({
        subscriptionId,
        eventType,
        gateway: null,
        gatewayEventId: null,
        notes: null,
        payload: {
          source: "coupon_gift",
          couponId: existingCoupon.id,
          couponCode: existingCoupon.code,
          invoiceId: createdInvoice.id,
          giftPlan,
          giftDuration,
          previousExpiresAt,
          newExpiresAt: newPlanExpiresAt.toISOString(),
        },
        actorId: userId,
      });

      return {
        redeemed: true,
        couponId: existingCoupon.id,
        code: existingCoupon.code,
        giftPlan,
        giftDuration,
        subscriptionId,
        invoiceId: createdInvoice.id,
        previousExpiresAt,
        newExpiresAt: newPlanExpiresAt.toISOString(),
      };
    });
  },
};
