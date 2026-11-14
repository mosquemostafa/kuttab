import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";
import { InvoiceCurrencyEnum } from "@/shared/enums/invoice-currency.enum";
import { SubscriptionActivatedByEnum } from "@/shared/enums/subscription-activated-by.enum";
import { SubscriptionEventTypeEnum } from "@/shared/enums/subscription-event-type.enum";
import { PaymentGatewayEnum } from "@/shared/enums/payment-gateway.enum";
import { InvoiceStatusEnum } from "@/shared/enums/invoice-status.enum";
import { InvoicePaymentMethodEnum } from "@/shared/enums/invoice-payment-method.enum";

export type PlanFeatures = {
  maxProjects: number | null;
  maxTodos: number | null;
  maxEditorImages: number | null;
  analytics: boolean;
  csvExport: boolean;
};

export type SubscriptionDTO = {
  id: string;
  userId: string;
  plan: SubscriptionPlanEnum;
  planStartedAt: string;
  planExpiresAt: string;
  autoRenew: boolean;
  trialUsed: boolean;
  activatedBy: SubscriptionActivatedByEnum;
  activatedByUserId: string | null;
  activatedAt: string;
  notes: string | null;
  gateway: PaymentGatewayEnum | null;
  gatewaySubscriptionId: string | null;
  gatewayCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionEventDTO = {
  id: string;
  subscriptionId: string;
  eventType: SubscriptionEventTypeEnum;
  gateway: PaymentGatewayEnum | null;
  gatewayEventId: string | null;
  notes: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  actorId:
    | {
        id: string;
        name: string;
      }
    | string
    | null;
};

export type InvoiceDTO = {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: InvoiceCurrencyEnum;
  status: InvoiceStatusEnum;
  refundedAmount: number | null;
  refundReason: string | null;
  paymentMethod: InvoicePaymentMethodEnum;
  gateway: PaymentGatewayEnum | null;
  gatewayPaymentId: string | null;
  paymentReference: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  createdAt: string;
};
