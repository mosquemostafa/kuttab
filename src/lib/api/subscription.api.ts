import type {
  InvoiceDTO,
  SubscriptionDTO,
  SubscriptionEventDTO,
} from "@/shared/types/subscription.types";
import { request, requestNoStore } from "@/lib/api/api-core";

export const subscriptionApi = {
  getCurrent: () => requestNoStore<SubscriptionDTO | null>("/subscription"),
  listInvoices: () => requestNoStore<InvoiceDTO[]>("/subscription/invoices"),
  startTrial: () =>
    request<{
      started: boolean;
      subscriptionId: string;
      eventId: string | null;
    }>("/subscription/trial/start", {
      method: "POST",
    }),
  autoRenew: () =>
    request<{
      updated: boolean;
      subscriptionId: string;
      autoRenew: boolean;
    }>("/subscription/cancel", {
      method: "POST",
    }),
  resume: () =>
    request<{
      updated: boolean;
      subscriptionId: string;
      autoRenew: boolean;
    }>("/subscription/resume", {
      method: "POST",
    }),
};

export const adminSubscriptionsApi = {
  getByUserId: (userId: string) =>
    requestNoStore<SubscriptionDTO | null>(
      `/admin/subscriptions/user/${userId}`,
    ),
  activate: (payload: {
    userId: string;
    plan: "pro" | "business";
    autoRenew?: boolean;
    notes?: string;
    paymentMethod:
      | "gateway"
      | "bank_transfer"
      | "vodafone_cash"
      | "instapay"
      | "complimentary"
      | "fix";
    paymentReference?: string;
  }) =>
    request<{
      activated: boolean;
      subscriptionId: string;
      eventId: string | null;
      invoiceId: string | null;
    }>(`/admin/subscriptions/activate`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  extend: (
    subscriptionId: string,
    payload: { addedDays: number; notes?: string },
  ) =>
    request<{
      extended: boolean;
      subscriptionId: string;
      status: string;
      planStartedAt: string;
      previousExpiresAt: string;
      newExpiresAt: string;
      addedDays: number;
      eventId: string | null;
    }>(`/admin/subscriptions/${subscriptionId}/extend`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  changePlan: (
    subscriptionId: string,
    payload: {
      plan: "pro" | "business";
      notes?: string;
      paymentMethod:
        | "gateway"
        | "bank_transfer"
        | "vodafone_cash"
        | "instapay"
        | "complimentary"
        | "fix";
    },
  ) =>
    request<{
      changed: boolean;
      subscriptionId: string;
      fromPlan: string;
      toPlan: string;
      status: string;
      planStartedAt: string;
      planExpiresAt: string;
      eventId: string | null;
      invoiceId: string | null;
    }>(`/admin/subscriptions/${subscriptionId}/change-plan`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  cancel: (
    subscriptionId: string,
    payload?: {
      notes?: string;
    },
  ) =>
    request<{
      cancelled: boolean;
      subscriptionId: string;
      eventId: string | null;
    }>(`/admin/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),
  renew: (
    subscriptionId: string,
    payload: {
      paymentMethod:
        | "gateway"
        | "bank_transfer"
        | "vodafone_cash"
        | "instapay"
        | "complimentary"
        | "fix";
      paymentReference?: string;
      notes?: string;
    },
  ) =>
    request<{
      renewed: boolean;
      subscriptionId: string;
      status: string;
      planStartedAt: string;
      previousExpiresAt: string;
      newExpiresAt: string;
      addedDays: number;
      eventId: string | null;
      invoiceId: string | null;
    }>(`/admin/subscriptions/${subscriptionId}/renew`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateNotes: (
    subscriptionId: string,
    payload: {
      notes?: string | null;
    },
  ) =>
    request<{
      updated: boolean;
      subscriptionId: string;
      notes: string | null;
    }>(`/admin/subscriptions/${subscriptionId}/notes`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  refundInvoice: (
    invoiceId: string,
    payload: {
      refundedAmount: number;
      reason: string;
      notes?: string;
      revokeAccess: boolean;
    },
  ) =>
    request<{
      refunded: boolean;
      invoiceId: string;
      invoiceStatus: string;
      refundedAmount: number;
      refundReason: string;
      revokeAccess: boolean;
      accessRevoked: boolean;
      eventId: string | null;
    }>(`/admin/invoices/${invoiceId}/refund`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  listEvents: (subscriptionId: string) =>
    requestNoStore<SubscriptionEventDTO[]>(
      `/admin/subscriptions/${subscriptionId}/events`,
    ),
  listInvoices: (subscriptionId: string) =>
    requestNoStore<InvoiceDTO[]>(
      `/admin/subscriptions/${subscriptionId}/invoices`,
    ),
  getInvoiceById: (invoiceId: string) =>
    requestNoStore<InvoiceDTO>(`/admin/invoices/${invoiceId}`),
  getEventById: (eventId: string) =>
    requestNoStore<SubscriptionEventDTO>(
      `/admin/subscriptions/events/${eventId}`,
    ),
};
