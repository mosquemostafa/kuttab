import type {
  AdminActivateSubscriptionDTO,
  AdminCancelSubscriptionDTO,
  AdminChangePlanDTO,
  AdminExtendSubscriptionDTO,
  AdminInvoiceRefundDTO,
  AdminRenewSubscriptionDTO,
  AdminUpdateSubscriptionNotesDTO,
  CheckoutDTO,
  ListAdminSubscriptionsQueryDTO,
} from "@/server/modules/subscriptions/subscription.dto";
import { subscriptionRepository } from "@/server/modules/subscriptions/subscription.repository";
import {
  PLAN_CONFIG,
  PLAN_FEATURES,
} from "@/server/modules/subscriptions/subscription-entitlements";
import { db } from "@/server/db";
import {
  invoice,
  subscription,
  subscriptionEvent,
} from "@/server/modules/subscriptions/subscription.entity";
import {
  ConflictException,
  NotFoundException,
  ValidationException,
} from "@/server/exceptions/exceptions";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";
import { SubscriptionActivatedByEnum } from "@/shared/enums/subscription-activated-by.enum";
import { SubscriptionEventTypeEnum } from "@/shared/enums/subscription-event-type.enum";
import { InvoiceCurrencyEnum } from "@/shared/enums/invoice-currency.enum";
import { InvoiceStatusEnum } from "@/shared/enums/invoice-status.enum";
import type {
  InvoiceDTO,
  SubscriptionDTO,
  SubscriptionEventDTO,
} from "@/shared/types/subscription.types";
import type { PaginatedResponse } from "@/shared/types/pagination.types";
import { eq } from "drizzle-orm";
import { subscriptionNotifierService } from "@/server/modules/subscriptions/subscription-notifier.service";

export const subscriptionService = {
  async getPlans() {
    return {
      features: PLAN_FEATURES,
      config: PLAN_CONFIG,
    };
  },

  async getSubscription(userId: string): Promise<SubscriptionDTO | null> {
    return subscriptionRepository.findByUserId(userId);
  },

  async getEntitlements(userId: string) {
    const subscription = await subscriptionRepository.findByUserId(userId);
    const now = new Date();

    if (!subscription) {
      return {
        plan: SubscriptionPlanEnum.FREE,
        features: PLAN_FEATURES[SubscriptionPlanEnum.FREE],
      };
    }

    const hasActivePlanPeriod = new Date(subscription.planExpiresAt) > now;

    // Intentionally ignore status and autoRenew for entitlement resolution.
    const plan: SubscriptionPlanEnum = hasActivePlanPeriod
      ? subscription.plan
      : SubscriptionPlanEnum.FREE;

    return {
      plan,
      features: PLAN_FEATURES[plan],
    };
  },

  async listCurrentUserInvoices(userId: string): Promise<InvoiceDTO[]> {
    return subscriptionRepository.listInvoicesByUserId(userId);
  },

  async createCheckout(_userId: string, dto: CheckoutDTO) {
    // TODO: Integrate with selected payment gateway checkout/session creation.
    return {
      gateway: dto.gateway,
      plan: dto.plan,
      checkoutUrl: null as string | null,
      message: "Checkout session is not implemented yet.",
    };
  },

  async cancelAtPeriodEnd(userId: string) {
    const now = new Date();

    const [existing] = await db
      .select({ id: subscription.id })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Subscription", userId);
    }

    const [updated] = await db
      .update(subscription)
      .set({
        autoRenew: false,
        updatedAt: now,
      })
      .where(eq(subscription.id, existing.id))
      .returning({
        id: subscription.id,
        autoRenew: subscription.autoRenew,
      });

    return {
      updated: true,
      subscriptionId: updated?.id ?? existing.id,
      autoRenew: updated?.autoRenew ?? false,
    };
  },

  async resumeSubscription(userId: string) {
    const now = new Date();

    const [existing] = await db
      .select({ id: subscription.id })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Subscription", userId);
    }

    const [updated] = await db
      .update(subscription)
      .set({
        autoRenew: true,
        updatedAt: now,
      })
      .where(eq(subscription.id, existing.id))
      .returning({
        id: subscription.id,
        autoRenew: subscription.autoRenew,
      });

    return {
      updated: true,
      subscriptionId: updated?.id ?? existing.id,
      autoRenew: updated?.autoRenew ?? true,
    };
  },

  async startTrial(userId: string) {
    const plan = SubscriptionPlanEnum.TRIAL;
    const trialConfig = PLAN_CONFIG[plan];
    const now = new Date();
    const planExpiresAt = new Date(
      now.getTime() + trialConfig.renewalDays * 24 * 60 * 60 * 1000,
    );

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: subscription.id,
          trialUsed: subscription.trialUsed,
          planExpiresAt: subscription.planExpiresAt,
        })
        .from(subscription)
        .where(eq(subscription.userId, userId))
        .limit(1);

      if (!existing) {
        const [createdSubscription] = await tx
          .insert(subscription)
          .values({
            userId,
            plan,
            planStartedAt: now,
            planExpiresAt,
            autoRenew: false,
            trialUsed: true,
            activatedBy: SubscriptionActivatedByEnum.TRIAL,
            activatedByUserId: null,
            activatedAt: now,
            notes: null,
            gateway: null,
            gatewaySubscriptionId: null,
            gatewayCustomerId: null,
          })
          .returning({ id: subscription.id });

        const [createdEvent] = await tx
          .insert(subscriptionEvent)
          .values({
            subscriptionId: createdSubscription.id,
            eventType: SubscriptionEventTypeEnum.TRIAL_STARTED,
            gateway: null,
            gatewayEventId: null,
            payload: {
              plan,
              activationDays: trialConfig.renewalDays,
            },
            actorId: userId,
          })
          .returning({ id: subscriptionEvent.id });

        return {
          started: true,
          subscriptionId: createdSubscription.id,
          eventId: createdEvent?.id ?? null,
        };
      }

      if (existing.trialUsed) {
        throw new ConflictException("Trial was already used for this user.");
      }

      if (existing.planExpiresAt > now) {
        throw new ConflictException(
          "Cannot start trial before current subscription period ends.",
        );
      }

      const [updatedSubscription] = await tx
        .update(subscription)
        .set({
          plan,
          planStartedAt: now,
          planExpiresAt,
          autoRenew: false,
          trialUsed: true,
          activatedBy: SubscriptionActivatedByEnum.TRIAL,
          activatedByUserId: null,
          activatedAt: now,
          gateway: null,
          gatewaySubscriptionId: null,
          gatewayCustomerId: null,
          updatedAt: now,
        })
        .where(eq(subscription.id, existing.id))
        .returning({ id: subscription.id });

      const [createdEvent] = await tx
        .insert(subscriptionEvent)
        .values({
          subscriptionId: updatedSubscription.id,
          eventType: SubscriptionEventTypeEnum.TRIAL_STARTED,
          gateway: null,
          gatewayEventId: null,
          payload: {
            plan,
            activationDays: trialConfig.renewalDays,
          },
          actorId: userId,
        })
        .returning({ id: subscriptionEvent.id });

      return {
        started: true,
        subscriptionId: updatedSubscription.id,
        eventId: createdEvent?.id ?? null,
      };
    });

    void subscriptionNotifierService.notifySubscriptionChange({
      userId,
      action: "trial_started",
      plan,
      expiresAt: planExpiresAt,
    });

    return result;
  },

  async handlePaymobWebhook(_payload: unknown) {
    // TODO: Verify signature + idempotency + apply mutation.
    return { received: true };
  },

  async handleKashierWebhook(_payload: unknown) {
    // TODO: Verify signature + idempotency + apply mutation.
    return { received: true };
  },

  async listAdminSubscriptions(
    query: ListAdminSubscriptionsQueryDTO,
  ): Promise<PaginatedResponse<SubscriptionDTO>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { items, total } =
      await subscriptionRepository.listAdminSubscriptions(query);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getAdminSubscriptionById(subscriptionId: string): Promise<{
    subscription: SubscriptionDTO | null;
    invoices: InvoiceDTO[];
  }> {
    const [subscription, invoices] = await Promise.all([
      subscriptionRepository.findById(subscriptionId),
      subscriptionRepository.listInvoicesBySubscriptionId(subscriptionId),
    ]);

    return { subscription, invoices };
  },

  async getAdminSubscriptionByUserId(userId: string): Promise<{
    subscription: SubscriptionDTO | null;
    invoices: InvoiceDTO[];
  }> {
    const subscription = await subscriptionRepository.findByUserId(userId);

    if (!subscription) {
      return { subscription: null, invoices: [] };
    }

    const invoices = await subscriptionRepository.listInvoicesBySubscriptionId(
      subscription.id,
    );

    return { subscription, invoices };
  },

  async activateSubscription(
    actorId: string,
    dto: AdminActivateSubscriptionDTO,
  ) {
    const planConfig = PLAN_CONFIG[dto.plan];
    const now = new Date();
    const planExpiresAt = new Date(
      now.getTime() + planConfig.renewalDays * 24 * 60 * 60 * 1000,
    );

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: subscription.id })
        .from(subscription)
        .where(eq(subscription.userId, dto.userId))
        .limit(1);

      if (existing) {
        throw new ConflictException(
          "Cannot activate subscription: user already has a subscription row.",
        );
      }

      const [createdSubscription] = await tx
        .insert(subscription)
        .values({
          userId: dto.userId,
          plan: dto.plan,
          planStartedAt: now,
          planExpiresAt,
          autoRenew: dto.autoRenew,
          trialUsed: false,
          activatedBy: SubscriptionActivatedByEnum.MANUAL,
          activatedByUserId: actorId,
          activatedAt: now,
          notes: dto.notes ?? null,
          gateway: null,
          gatewaySubscriptionId: null,
          gatewayCustomerId: null,
        })
        .returning({
          id: subscription.id,
          planStartedAt: subscription.planStartedAt,
          planExpiresAt: subscription.planExpiresAt,
        });

      if (!createdSubscription) {
        throw new Error("Failed to create subscription row.");
      }

      const activationDays = planConfig.renewalDays;

      const [createdEvent] = await tx
        .insert(subscriptionEvent)
        .values({
          subscriptionId: createdSubscription.id,
          eventType: SubscriptionEventTypeEnum.MANUALLY_ACTIVATED,
          gateway: null,
          gatewayEventId: null,
          notes: dto.notes ?? null,
          payload: {
            plan: dto.plan,
            activationDays: activationDays,
          },
          actorId,
        })
        .returning({ id: subscriptionEvent.id });

      const [createdInvoice] = await tx
        .insert(invoice)
        .values({
          subscriptionId: createdSubscription.id,
          amount: planConfig.price,
          currency: InvoiceCurrencyEnum.EGP,
          status: InvoiceStatusEnum.PAID,
          refundedAmount: null,
          paymentMethod: dto.paymentMethod,
          gateway: null,
          gatewayPaymentId: null,
          paymentReference: dto.paymentReference ?? null,
          periodStart: createdSubscription.planStartedAt,
          periodEnd: createdSubscription.planExpiresAt,
          paidAt: now,
        })
        .returning({ id: invoice.id });

      return {
        activated: true,
        subscriptionId: createdSubscription.id,
        eventId: createdEvent?.id ?? null,
        invoiceId: createdInvoice?.id ?? null,
      };
    });

    void subscriptionNotifierService.notifySubscriptionChange({
      userId: dto.userId,
      action: "activated",
      plan: dto.plan,
      expiresAt: planExpiresAt,
      notes: dto.notes,
    });

    return result;
  },

  async extendSubscription(
    actorId: string,
    subscriptionId: string,
    dto: AdminExtendSubscriptionDTO,
  ) {
    const now = new Date();
    const addedDays = dto.addedDays;
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: subscription.id,
          userId: subscription.userId,
          plan: subscription.plan,
          planStartedAt: subscription.planStartedAt,
          planExpiresAt: subscription.planExpiresAt,
        })
        .from(subscription)
        .where(eq(subscription.id, subscriptionId))
        .limit(1);

      if (!existing) {
        throw new NotFoundException("Subscription", subscriptionId);
      }

      const previousExpiresAtDate = existing.planExpiresAt;
      const previousExpiresAt = previousExpiresAtDate.toISOString();
      const hasRemainingDays = previousExpiresAtDate > now;
      const newPlanExpiresAt = hasRemainingDays
        ? new Date(
            previousExpiresAtDate.getTime() + addedDays * millisecondsPerDay,
          )
        : new Date(now.getTime() + addedDays * millisecondsPerDay);

      const [updatedSubscription] = await tx
        .update(subscription)
        .set({
          ...(hasRemainingDays ? {} : { planStartedAt: now }),
          planExpiresAt: newPlanExpiresAt,
          updatedAt: now,
        })
        .where(eq(subscription.id, existing.id))
        .returning({
          id: subscription.id,
          planStartedAt: subscription.planStartedAt,
          planExpiresAt: subscription.planExpiresAt,
        });

      const [createdEvent] = await tx
        .insert(subscriptionEvent)
        .values({
          subscriptionId: existing.id,
          eventType: SubscriptionEventTypeEnum.ADMIN_EXTENDED,
          gateway: null,
          gatewayEventId: null,
          payload: {
            addedDays,
            previousExpiresAt,
            newExpiresAt: newPlanExpiresAt.toISOString(),
          },
          notes: dto.notes ?? null,
          actorId,
        })
        .returning({ id: subscriptionEvent.id });

      return {
        extended: true,
        userId: existing.userId,
        plan: existing.plan,
        subscriptionId: updatedSubscription?.id ?? existing.id,
        planStartedAt:
          updatedSubscription?.planStartedAt ?? existing.planStartedAt,
        previousExpiresAt,
        newExpiresAt: updatedSubscription?.planExpiresAt ?? newPlanExpiresAt,
        addedDays,
        eventId: createdEvent?.id ?? null,
      };
    });

    void subscriptionNotifierService.notifySubscriptionChange({
      userId: result.userId,
      action: "extended",
      plan: result.plan,
      expiresAt: result.newExpiresAt,
      notes: dto.notes,
    });

    return result;
  },

  async renewSubscription(
    actorId: string,
    subscriptionId: string,
    dto: AdminRenewSubscriptionDTO,
  ) {
    const now = new Date();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: subscription.id,
          userId: subscription.userId,
          plan: subscription.plan,
          planStartedAt: subscription.planStartedAt,
          planExpiresAt: subscription.planExpiresAt,
        })
        .from(subscription)
        .where(eq(subscription.id, subscriptionId))
        .limit(1);

      if (!existing) {
        throw new NotFoundException("Subscription", subscriptionId);
      }

      const addedDays = PLAN_CONFIG[existing.plan].renewalDays;
      const previousExpiresAtDate = existing.planExpiresAt;
      const previousExpiresAt = previousExpiresAtDate.toISOString();
      const hasRemainingDays = previousExpiresAtDate > now;
      const newPlanExpiresAt = hasRemainingDays
        ? new Date(
            previousExpiresAtDate.getTime() + addedDays * millisecondsPerDay,
          )
        : new Date(now.getTime() + addedDays * millisecondsPerDay);

      const [updatedSubscription] = await tx
        .update(subscription)
        .set({
          ...(hasRemainingDays ? {} : { planStartedAt: now }),
          planExpiresAt: newPlanExpiresAt,
          updatedAt: now,
        })
        .where(eq(subscription.id, existing.id))
        .returning({
          id: subscription.id,
          planStartedAt: subscription.planStartedAt,
          planExpiresAt: subscription.planExpiresAt,
        });

      const [createdEvent] = await tx
        .insert(subscriptionEvent)
        .values({
          subscriptionId: existing.id,
          eventType: SubscriptionEventTypeEnum.SUBSCRIPTION_RENEWED,
          gateway: null,
          gatewayEventId: null,
          payload: {
            addedDays,
            previousExpiresAt,
            newExpiresAt: newPlanExpiresAt.toISOString(),
          },
          notes: dto.notes ?? null,
          actorId,
        })
        .returning({ id: subscriptionEvent.id });

      const [createdInvoice] = await tx
        .insert(invoice)
        .values({
          subscriptionId: existing.id,
          amount: PLAN_CONFIG[existing.plan].price,
          currency: InvoiceCurrencyEnum.EGP,
          status: InvoiceStatusEnum.PAID,
          refundedAmount: null,
          paymentMethod: dto.paymentMethod,
          gateway: null,
          gatewayPaymentId: null,
          paymentReference: dto.paymentReference ?? null,
          periodStart: hasRemainingDays ? previousExpiresAtDate : now,
          periodEnd: newPlanExpiresAt,
          paidAt: now,
        })
        .returning({ id: invoice.id });

      return {
        renewed: true,
        userId: existing.userId,
        plan: existing.plan,
        subscriptionId: updatedSubscription?.id ?? existing.id,
        planStartedAt:
          updatedSubscription?.planStartedAt ?? existing.planStartedAt,
        previousExpiresAt,
        newExpiresAt: updatedSubscription?.planExpiresAt ?? newPlanExpiresAt,
        addedDays,
        eventId: createdEvent?.id ?? null,
        invoiceId: createdInvoice?.id ?? null,
      };
    });

    void subscriptionNotifierService.notifySubscriptionChange({
      userId: result.userId,
      action: "renewed",
      plan: result.plan,
      expiresAt: result.newExpiresAt,
      notes: dto.notes,
    });

    return result;
  },

  async changeSubscriptionPlan(
    actorId: string,
    subscriptionId: string,
    dto: AdminChangePlanDTO,
  ) {
    const now = new Date();
    const planConfig = PLAN_CONFIG[dto.plan];
    const newPlanExpiresAt = new Date(
      now.getTime() + planConfig.renewalDays * 24 * 60 * 60 * 1000,
    );

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: subscription.id,
          userId: subscription.userId,
          plan: subscription.plan,
        })
        .from(subscription)
        .where(eq(subscription.id, subscriptionId))
        .limit(1);

      if (!existing) {
        throw new NotFoundException("Subscription", subscriptionId);
      }

      const [updatedSubscription] = await tx
        .update(subscription)
        .set({
          plan: dto.plan,
          planStartedAt: now,
          planExpiresAt: newPlanExpiresAt,
          updatedAt: now,
        })
        .where(eq(subscription.id, existing.id))
        .returning({
          id: subscription.id,
          plan: subscription.plan,
          planStartedAt: subscription.planStartedAt,
          planExpiresAt: subscription.planExpiresAt,
        });

      const [createdEvent] = await tx
        .insert(subscriptionEvent)
        .values({
          subscriptionId: existing.id,
          eventType: SubscriptionEventTypeEnum.ADMIN_PLAN_CHANGED,
          gateway: null,
          gatewayEventId: null,
          payload: {
            fromPlan: existing.plan,
            toPlan: dto.plan,
          },
          notes: dto.notes ?? null,
          actorId,
        })
        .returning({ id: subscriptionEvent.id });

      const [createdInvoice] = await tx
        .insert(invoice)
        .values({
          subscriptionId: existing.id,
          amount: planConfig.price,
          currency: InvoiceCurrencyEnum.EGP,
          status: InvoiceStatusEnum.PAID,
          refundedAmount: null,
          paymentMethod: dto.paymentMethod,
          gateway: null,
          gatewayPaymentId: null,
          paymentReference: null,
          periodStart: now,
          periodEnd: newPlanExpiresAt,
          paidAt: now,
        })
        .returning({ id: invoice.id });

      return {
        changed: true,
        userId: existing.userId,
        subscriptionId: updatedSubscription?.id ?? existing.id,
        fromPlan: existing.plan,
        toPlan: updatedSubscription?.plan ?? dto.plan,
        planStartedAt: updatedSubscription?.planStartedAt ?? now,
        planExpiresAt: updatedSubscription?.planExpiresAt ?? newPlanExpiresAt,
        eventId: createdEvent?.id ?? null,
        invoiceId: createdInvoice?.id ?? null,
      };
    });

    void subscriptionNotifierService.notifySubscriptionChange({
      userId: result.userId,
      action: "plan_changed",
      plan: result.toPlan,
      expiresAt: result.planExpiresAt,
      notes: dto.notes,
    });

    return result;
  },

  async cancelSubscriptionByAdmin(
    actorId: string,
    subscriptionId: string,
    dto: AdminCancelSubscriptionDTO,
  ) {
    const now = new Date();

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: subscription.id,
          userId: subscription.userId,
          plan: subscription.plan,
          planExpiresAt: subscription.planExpiresAt,
        })
        .from(subscription)
        .where(eq(subscription.id, subscriptionId))
        .limit(1);

      if (!existing) {
        throw new NotFoundException("Subscription", subscriptionId);
      }

      const previousExpiresAt = existing.planExpiresAt.toISOString();
      const cancelledAt = now.toISOString();

      const [updatedSubscription] = await tx
        .update(subscription)
        .set({
          planExpiresAt: now,
          updatedAt: now,
        })
        .where(eq(subscription.id, existing.id))
        .returning({ id: subscription.id });

      const [createdEvent] = await tx
        .insert(subscriptionEvent)
        .values({
          subscriptionId: existing.id,
          eventType: SubscriptionEventTypeEnum.ADMIN_CANCELLED,
          gateway: null,
          gatewayEventId: null,
          payload: {
            previousExpiresAt,
            cancelledAt,
          },
          notes: dto.notes ?? null,
          actorId,
        })
        .returning({ id: subscriptionEvent.id });

      return {
        cancelled: true,
        userId: existing.userId,
        plan: existing.plan,
        subscriptionId: updatedSubscription?.id ?? existing.id,
        eventId: createdEvent?.id ?? null,
      };
    });

    void subscriptionNotifierService.notifySubscriptionChange({
      userId: result.userId,
      action: "cancelled",
      plan: result.plan,
      notes: dto.notes,
    });

    return result;
  },

  async refundInvoiceByAdmin(
    actorId: string,
    invoiceId: string,
    dto: AdminInvoiceRefundDTO,
  ) {
    const now = new Date();

    return db.transaction(async (tx) => {
      const [existingInvoice] = await tx
        .select({
          id: invoice.id,
          subscriptionId: invoice.subscriptionId,
          amount: invoice.amount,
          status: invoice.status,
          refundedAmount: invoice.refundedAmount,
        })
        .from(invoice)
        .where(eq(invoice.id, invoiceId))
        .limit(1);

      if (!existingInvoice) {
        throw new NotFoundException("Invoice", invoiceId);
      }

      const isRefundableStatus =
        existingInvoice.status === InvoiceStatusEnum.PAID ||
        existingInvoice.status === InvoiceStatusEnum.PARTIALLY_REFUNDED;

      if (!isRefundableStatus) {
        throw new ValidationException({
          status:
            "Refund is allowed only for paid or partially_refunded invoices.",
        });
      }

      if (dto.refundedAmount > existingInvoice.amount) {
        throw new ValidationException({
          refundedAmount: "Refunded amount cannot exceed invoice amount.",
        });
      }

      const totalRefundedAmount =
        (existingInvoice.refundedAmount ?? 0) + dto.refundedAmount;
      if (totalRefundedAmount > existingInvoice.amount) {
        throw new ValidationException({
          refundedAmount: "Total refunded amount cannot exceed invoice amount.",
        });
      }

      const nextInvoiceStatus =
        totalRefundedAmount === existingInvoice.amount
          ? InvoiceStatusEnum.REFUNDED
          : InvoiceStatusEnum.PARTIALLY_REFUNDED;

      const [updatedInvoice] = await tx
        .update(invoice)
        .set({
          refundedAmount: totalRefundedAmount,
          refundReason: dto.reason,
          status: nextInvoiceStatus,
        })
        .where(eq(invoice.id, existingInvoice.id))
        .returning({
          id: invoice.id,
          subscriptionId: invoice.subscriptionId,
          status: invoice.status,
          refundedAmount: invoice.refundedAmount,
          refundReason: invoice.refundReason,
        });

      let accessRevoked = false;

      if (dto.revokeAccess) {
        await tx
          .update(subscription)
          .set({
            planExpiresAt: now,
            updatedAt: now,
          })
          .where(eq(subscription.id, existingInvoice.subscriptionId));

        accessRevoked = true;
      }

      const [createdEvent] = await tx
        .insert(subscriptionEvent)
        .values({
          subscriptionId: existingInvoice.subscriptionId,
          eventType: SubscriptionEventTypeEnum.PAYMENT_REFUNDED,
          gateway: null,
          gatewayEventId: null,
          payload: {
            invoiceId: existingInvoice.id,
            amount: existingInvoice.amount,
            refundedAmount: dto.refundedAmount,
            reason: dto.reason,
          },
          actorId,
        })
        .returning({ id: subscriptionEvent.id });

      return {
        refunded: true,
        invoiceId: updatedInvoice?.id ?? existingInvoice.id,
        invoiceStatus: updatedInvoice?.status ?? nextInvoiceStatus,
        refundedAmount: updatedInvoice?.refundedAmount ?? totalRefundedAmount,
        refundReason: updatedInvoice?.refundReason ?? dto.reason,
        revokeAccess: dto.revokeAccess,
        accessRevoked,
        eventId: createdEvent?.id ?? null,
      };
    });
  },

  async listSubscriptionEventsByAdmin(
    subscriptionId: string,
  ): Promise<SubscriptionEventDTO[]> {
    return subscriptionRepository.listEventsBySubscriptionId(subscriptionId);
  },

  async listSubscriptionInvoicesByAdmin(
    subscriptionId: string,
  ): Promise<InvoiceDTO[]> {
    return subscriptionRepository.listInvoicesBySubscriptionId(subscriptionId);
  },

  async getInvoiceByIdByAdmin(invoiceId: string): Promise<InvoiceDTO> {
    const existingInvoice =
      await subscriptionRepository.findInvoiceById(invoiceId);
    if (!existingInvoice) {
      throw new NotFoundException("Invoice", invoiceId);
    }

    return existingInvoice;
  },

  async getEventByIdByAdmin(eventId: string): Promise<SubscriptionEventDTO> {
    const existingEvent = await subscriptionRepository.findEventById(eventId);
    if (!existingEvent) {
      throw new NotFoundException("Subscription event", eventId);
    }

    return existingEvent;
  },

  async updateSubscriptionNotesByAdmin(
    subscriptionId: string,
    dto: AdminUpdateSubscriptionNotesDTO,
  ) {
    const now = new Date();

    const [updated] = await db
      .update(subscription)
      .set({
        notes: dto.notes ?? null,
        updatedAt: now,
      })
      .where(eq(subscription.id, subscriptionId))
      .returning({
        id: subscription.id,
        notes: subscription.notes,
      });

    if (!updated) {
      throw new NotFoundException("Subscription", subscriptionId);
    }

    return {
      updated: true,
      subscriptionId: updated.id,
      notes: updated.notes,
    };
  },
};
