import { and, count, desc, eq, type SQL } from "drizzle-orm";

import { db } from "@/server/db";
import {
  invoice,
  subscription,
  subscriptionEvent,
} from "@/server/modules/subscriptions/subscription.entity";
import { user } from "@/server/modules/users/user.entity";
import type {
  InvoiceDTO,
  SubscriptionDTO,
  SubscriptionEventDTO,
} from "@/shared/types/subscription.types";
import type { ListAdminSubscriptionsQueryDTO } from "@/server/modules/subscriptions/subscription.dto";

type SubscriptionRow = {
  id: string;
  userId: string;
  plan: SubscriptionDTO["plan"];
  planStartedAt: Date;
  planExpiresAt: Date;
  autoRenew: boolean;
  trialUsed: boolean;
  activatedBy: SubscriptionDTO["activatedBy"];
  activatedByUserId: string | null;
  activatedAt: Date;
  notes: string | null;
  gateway: SubscriptionDTO["gateway"];
  gatewaySubscriptionId: string | null;
  gatewayCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type InvoiceRow = {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: InvoiceDTO["currency"];
  status: InvoiceDTO["status"];
  refundedAmount: number | null;
  refundReason: string | null;
  paymentMethod: InvoiceDTO["paymentMethod"];
  gateway: InvoiceDTO["gateway"];
  gatewayPaymentId: string | null;
  paymentReference: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  paidAt: Date | null;
  createdAt: Date;
};

type SubscriptionEventRow = {
  id: string;
  subscriptionId: string;
  eventType: string;
  gateway: SubscriptionEventDTO["gateway"];
  gatewayEventId: string | null;
  notes: string | null;
  payload: Record<string, unknown>;
  createdAt: Date;
  actorId: string | null;
  actorName: string | null;
};

function mapSubscriptionRow(row: SubscriptionRow): SubscriptionDTO {
  return {
    id: row.id,
    userId: row.userId,
    plan: row.plan,
    planStartedAt: row.planStartedAt.toISOString(),
    planExpiresAt: row.planExpiresAt.toISOString(),
    autoRenew: row.autoRenew,
    trialUsed: row.trialUsed,
    activatedBy: row.activatedBy,
    activatedByUserId: row.activatedByUserId,
    activatedAt: row.activatedAt.toISOString(),
    notes: row.notes,
    gateway: row.gateway,
    gatewaySubscriptionId: row.gatewaySubscriptionId,
    gatewayCustomerId: row.gatewayCustomerId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapInvoiceRow(row: InvoiceRow): InvoiceDTO {
  return {
    id: row.id,
    subscriptionId: row.subscriptionId,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    refundedAmount: row.refundedAmount,
    refundReason: row.refundReason,
    paymentMethod: row.paymentMethod,
    gateway: row.gateway,
    gatewayPaymentId: row.gatewayPaymentId,
    paymentReference: row.paymentReference,
    periodStart: row.periodStart ? row.periodStart.toISOString() : null,
    periodEnd: row.periodEnd ? row.periodEnd.toISOString() : null,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapSubscriptionEventRow(
  row: SubscriptionEventRow,
): SubscriptionEventDTO {
  return {
    id: row.id,
    subscriptionId: row.subscriptionId,
    eventType: row.eventType as SubscriptionEventDTO["eventType"],
    gateway: row.gateway,
    gatewayEventId: row.gatewayEventId,
    notes: row.notes,
    payload: row.payload,
    createdAt: row.createdAt.toISOString(),
    actorId: row.actorId
      ? {
          id: row.actorId,
          name: row.actorName ?? row.actorId,
        }
      : null,
  };
}

export const subscriptionRepository = {
  async findByUserId(userId: string): Promise<SubscriptionDTO | null> {
    const [row] = await db
      .select({
        id: subscription.id,
        userId: subscription.userId,
        plan: subscription.plan,
        planStartedAt: subscription.planStartedAt,
        planExpiresAt: subscription.planExpiresAt,
        autoRenew: subscription.autoRenew,
        trialUsed: subscription.trialUsed,
        activatedBy: subscription.activatedBy,
        activatedByUserId: subscription.activatedByUserId,
        activatedAt: subscription.activatedAt,
        notes: subscription.notes,
        gateway: subscription.gateway,
        gatewaySubscriptionId: subscription.gatewaySubscriptionId,
        gatewayCustomerId: subscription.gatewayCustomerId,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (!row) {
      return null;
    }

    return mapSubscriptionRow(row);
  },

  async findById(id: string): Promise<SubscriptionDTO | null> {
    const [row] = await db
      .select({
        id: subscription.id,
        userId: subscription.userId,
        plan: subscription.plan,
        planStartedAt: subscription.planStartedAt,
        planExpiresAt: subscription.planExpiresAt,
        autoRenew: subscription.autoRenew,
        trialUsed: subscription.trialUsed,
        activatedBy: subscription.activatedBy,
        activatedByUserId: subscription.activatedByUserId,
        activatedAt: subscription.activatedAt,
        notes: subscription.notes,
        gateway: subscription.gateway,
        gatewaySubscriptionId: subscription.gatewaySubscriptionId,
        gatewayCustomerId: subscription.gatewayCustomerId,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      })
      .from(subscription)
      .where(eq(subscription.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return mapSubscriptionRow(row);
  },

  async listInvoicesByUserId(userId: string): Promise<InvoiceDTO[]> {
    const rows = await db
      .select({
        id: invoice.id,
        subscriptionId: invoice.subscriptionId,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        refundedAmount: invoice.refundedAmount,
        refundReason: invoice.refundReason,
        paymentMethod: invoice.paymentMethod,
        gateway: invoice.gateway,
        gatewayPaymentId: invoice.gatewayPaymentId,
        paymentReference: invoice.paymentReference,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        paidAt: invoice.paidAt,
        createdAt: invoice.createdAt,
      })
      .from(invoice)
      .innerJoin(subscription, eq(invoice.subscriptionId, subscription.id))
      .where(eq(subscription.userId, userId))
      .orderBy(desc(invoice.createdAt));

    return rows.map((row) => ({
      id: row.id,
      subscriptionId: row.subscriptionId,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      refundedAmount: row.refundedAmount,
      refundReason: row.refundReason,
      paymentMethod: row.paymentMethod,
      gateway: row.gateway,
      gatewayPaymentId: row.gatewayPaymentId,
      paymentReference: row.paymentReference,
      periodStart: row.periodStart ? row.periodStart.toISOString() : null,
      periodEnd: row.periodEnd ? row.periodEnd.toISOString() : null,
      paidAt: row.paidAt ? row.paidAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    }));
  },

  async listInvoicesBySubscriptionId(
    subscriptionId: string,
  ): Promise<InvoiceDTO[]> {
    const rows = await db
      .select({
        id: invoice.id,
        subscriptionId: invoice.subscriptionId,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        refundedAmount: invoice.refundedAmount,
        refundReason: invoice.refundReason,
        paymentMethod: invoice.paymentMethod,
        gateway: invoice.gateway,
        gatewayPaymentId: invoice.gatewayPaymentId,
        paymentReference: invoice.paymentReference,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        paidAt: invoice.paidAt,
        createdAt: invoice.createdAt,
      })
      .from(invoice)
      .where(eq(invoice.subscriptionId, subscriptionId))
      .orderBy(desc(invoice.createdAt));

    return rows.map(mapInvoiceRow);
  },

  async findInvoiceById(invoiceId: string): Promise<InvoiceDTO | null> {
    const [row] = await db
      .select({
        id: invoice.id,
        subscriptionId: invoice.subscriptionId,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        refundedAmount: invoice.refundedAmount,
        refundReason: invoice.refundReason,
        paymentMethod: invoice.paymentMethod,
        gateway: invoice.gateway,
        gatewayPaymentId: invoice.gatewayPaymentId,
        paymentReference: invoice.paymentReference,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        paidAt: invoice.paidAt,
        createdAt: invoice.createdAt,
      })
      .from(invoice)
      .where(eq(invoice.id, invoiceId))
      .limit(1);

    if (!row) {
      return null;
    }

    return mapInvoiceRow(row);
  },

  async listAdminSubscriptions(
    query: ListAdminSubscriptionsQueryDTO,
  ): Promise<{ items: SubscriptionDTO[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (query.plan !== undefined) {
      conditions.push(eq(subscription.plan, query.plan));
    }

    if (query.activatedBy !== undefined) {
      conditions.push(eq(subscription.activatedBy, query.activatedBy));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: subscription.id,
          userId: subscription.userId,
          plan: subscription.plan,
          planStartedAt: subscription.planStartedAt,
          planExpiresAt: subscription.planExpiresAt,
          autoRenew: subscription.autoRenew,
          trialUsed: subscription.trialUsed,
          activatedBy: subscription.activatedBy,
          activatedByUserId: subscription.activatedByUserId,
          activatedAt: subscription.activatedAt,
          notes: subscription.notes,
          gateway: subscription.gateway,
          gatewaySubscriptionId: subscription.gatewaySubscriptionId,
          gatewayCustomerId: subscription.gatewayCustomerId,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
        })
        .from(subscription)
        .where(whereClause)
        .orderBy(desc(subscription.updatedAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(subscription).where(whereClause),
    ]);

    const total = Number(totalRows[0]?.total ?? 0);

    return {
      items: rows.map(mapSubscriptionRow),
      total,
    };
  },

  async listEventsBySubscriptionId(
    subscriptionId: string,
  ): Promise<SubscriptionEventDTO[]> {
    const rows = await db
      .select({
        id: subscriptionEvent.id,
        subscriptionId: subscriptionEvent.subscriptionId,
        eventType: subscriptionEvent.eventType,
        gateway: subscriptionEvent.gateway,
        gatewayEventId: subscriptionEvent.gatewayEventId,
        notes: subscriptionEvent.notes,
        payload: subscriptionEvent.payload,
        createdAt: subscriptionEvent.createdAt,
        actorId: subscriptionEvent.actorId,
        actorName: user.name,
      })
      .from(subscriptionEvent)
      .leftJoin(user, eq(subscriptionEvent.actorId, user.id))
      .where(eq(subscriptionEvent.subscriptionId, subscriptionId))
      .orderBy(desc(subscriptionEvent.createdAt));

    return rows.map(mapSubscriptionEventRow);
  },

  async findEventById(eventId: string): Promise<SubscriptionEventDTO | null> {
    const [row] = await db
      .select({
        id: subscriptionEvent.id,
        subscriptionId: subscriptionEvent.subscriptionId,
        eventType: subscriptionEvent.eventType,
        gateway: subscriptionEvent.gateway,
        gatewayEventId: subscriptionEvent.gatewayEventId,
        notes: subscriptionEvent.notes,
        payload: subscriptionEvent.payload,
        createdAt: subscriptionEvent.createdAt,
        actorId: subscriptionEvent.actorId,
        actorName: user.name,
      })
      .from(subscriptionEvent)
      .leftJoin(user, eq(subscriptionEvent.actorId, user.id))
      .where(eq(subscriptionEvent.id, eventId))
      .limit(1);

    if (!row) {
      return null;
    }

    return mapSubscriptionEventRow(row);
  },
};
