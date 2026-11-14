import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";

import { InvoiceCurrencyEnum } from "@/shared/enums/invoice-currency.enum";
import { InvoicePaymentMethodEnum } from "@/shared/enums/invoice-payment-method.enum";
import { InvoiceStatusEnum } from "@/shared/enums/invoice-status.enum";
import { PaymentGatewayEnum } from "@/shared/enums/payment-gateway.enum";
import { SubscriptionActivatedByEnum } from "@/shared/enums/subscription-activated-by.enum";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";
import { user } from "@/server/modules/users/user.entity";

const subscriptionPlanValues = Object.values(SubscriptionPlanEnum) as [
  SubscriptionPlanEnum,
  ...SubscriptionPlanEnum[],
];

export const subscriptionPlanEnum = pgEnum(
  "subscription_plan",
  subscriptionPlanValues,
);

export const subscriptionActivatedByEnum = pgEnum("subscription_activated_by", [
  "gateway",
  "manual",
  "trial",
]);

export const paymentGatewayEnum = pgEnum("payment_gateway", [
  "paymob",
  "kashier",
]);

export const subscriptionEventTypeEnum = pgEnum("subscription_event_type", [
  "trial_started",
  "manually_activated",
  "subscription_created",
  "subscription_renewed",
  "subscription_cancelled",
  "subscription_past_due",
  "subscription_expired",
  "subscription_paused",
  "subscription_resumed",
  "payment_success",
  "payment_failed",
  "payment_refunded",
  "card_updated",
  "card_expiring_soon",
  "dispute_created",
  "admin_extended",
  "admin_plan_changed",
  "admin_cancelled",
]);

export const invoiceCurrencyEnum = pgEnum("invoice_currency", ["EGP", "USD"]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "paid",
  "pending",
  "failed",
  "refunded",
  "partially_refunded",
]);

export const invoicePaymentMethodEnum = pgEnum("invoice_payment_method", [
  "gateway",
  "bank_transfer",
  "vodafone_cash",
  "instapay",
  "complimentary",
  "fix",
]);

export const subscription = pgTable(
  "subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    plan: subscriptionPlanEnum("plan").$type<SubscriptionPlanEnum>().notNull(),
    planStartedAt: timestamp("plan_started_at").notNull(),
    planExpiresAt: timestamp("plan_expires_at").notNull(),
    autoRenew: boolean("auto_renew").notNull().default(true),
    trialUsed: boolean("trial_used").notNull().default(false),
    activatedBy: subscriptionActivatedByEnum("activated_by")
      .$type<SubscriptionActivatedByEnum>()
      .notNull(),
    activatedByUserId: text("activated_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    activatedAt: timestamp("activated_at").notNull(),
    notes: text("notes"),
    gateway: paymentGatewayEnum("gateway").$type<PaymentGatewayEnum>(),
    gatewaySubscriptionId: text("gateway_subscription_id"),
    gatewayCustomerId: text("gateway_customer_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("subscriptions_user_id_unique").on(table.userId),
    index("subscriptions_plan_idx").on(table.plan),
    index("subscriptions_plan_expires_at_idx").on(table.planExpiresAt),
    index("subscriptions_gateway_subscription_id_idx").on(
      table.gatewaySubscriptionId,
    ),
    check(
      "subscriptions_manual_activation_requires_admin_ck",
      sql`${table.activatedBy} != 'manual' OR ${table.activatedByUserId} IS NOT NULL`,
    ),
  ],
);

export const subscriptionEvent = pgTable(
  "subscription_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscription.id, { onDelete: "cascade" }),
    eventType: subscriptionEventTypeEnum("event_type").notNull(),
    gateway: paymentGatewayEnum("gateway").$type<PaymentGatewayEnum>(),
    gatewayEventId: text("gateway_event_id"),
    notes: text("notes"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    actorId: text("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("subscription_events_subscription_id_created_at_idx").on(
      table.subscriptionId,
      table.createdAt,
    ),
    index("subscription_events_event_type_idx").on(table.eventType),
    uniqueIndex("subscription_events_gateway_event_unique")
      .on(table.gateway, table.gatewayEventId)
      .where(
        sql`${table.gateway} IS NOT NULL AND ${table.gatewayEventId} IS NOT NULL`,
      ),
  ],
);

export const invoice = pgTable(
  "invoices",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscription.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    currency: invoiceCurrencyEnum("currency")
      .$type<InvoiceCurrencyEnum>()
      .notNull()
      .default(InvoiceCurrencyEnum.EGP),
    status: invoiceStatusEnum("status").$type<InvoiceStatusEnum>().notNull(),
    refundedAmount: integer("refunded_amount"),
    refundReason: text("refund_reason"),
    paymentMethod: invoicePaymentMethodEnum("payment_method")
      .$type<InvoicePaymentMethodEnum>()
      .notNull(),
    gateway: paymentGatewayEnum("gateway").$type<PaymentGatewayEnum>(),
    gatewayPaymentId: text("gateway_payment_id"),
    paymentReference: text("payment_reference"),
    periodStart: timestamp("period_start"),
    periodEnd: timestamp("period_end"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("invoices_subscription_id_created_at_idx").on(
      table.subscriptionId,
      table.createdAt,
    ),
    index("invoices_status_idx").on(table.status),
    index("invoices_payment_method_idx").on(table.paymentMethod),
    uniqueIndex("invoices_gateway_payment_unique")
      .on(table.gateway, table.gatewayPaymentId)
      .where(
        sql`${table.gateway} IS NOT NULL AND ${table.gatewayPaymentId} IS NOT NULL`,
      ),
    check(
      "invoices_refunded_amount_required_when_refunded_ck",
      sql`${table.status} NOT IN ('refunded', 'partially_refunded') OR ${table.refundedAmount} IS NOT NULL`,
    ),
    check(
      "invoices_refund_reason_required_when_refunded_ck",
      sql`${table.status} NOT IN ('refunded', 'partially_refunded') OR ${table.refundReason} IS NOT NULL`,
    ),
    check("invoices_amount_non_negative_ck", sql`${table.amount} >= 0`),
    check(
      "invoices_refunded_amount_non_negative_ck",
      sql`${table.refundedAmount} IS NULL OR ${table.refundedAmount} >= 0`,
    ),
    check(
      "invoices_refunded_amount_lte_amount_ck",
      sql`${table.refundedAmount} IS NULL OR ${table.refundedAmount} <= ${table.amount}`,
    ),
  ],
);
