import { z } from "zod";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";
import { SubscriptionActivatedByEnum } from "@/shared/enums/subscription-activated-by.enum";
import { PaymentGatewayEnum } from "@/shared/enums/payment-gateway.enum";
import { InvoicePaymentMethodEnum } from "@/shared/enums/invoice-payment-method.enum";

const planSchema = z.nativeEnum(SubscriptionPlanEnum);
const activatablePlanSchema = z.enum([SubscriptionPlanEnum.PRO]);
const paymentGatewaySchema = z.nativeEnum(PaymentGatewayEnum);

export const listAdminSubscriptionsQuerySchema = z.object({
  plan: planSchema.optional(),
  activatedBy: z.nativeEnum(SubscriptionActivatedByEnum).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const checkoutSchema = z.object({
  gateway: paymentGatewaySchema,
  plan: planSchema,
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const adminActivateSubscriptionSchema = z.object({
  userId: z.string().trim().min(1),
  plan: activatablePlanSchema,
  autoRenew: z.boolean().optional().default(true),
  notes: z.string().trim().max(1000).optional(),
  paymentMethod: z.nativeEnum(InvoicePaymentMethodEnum),
  paymentReference: z.string().trim().max(255).optional(),
});

export const adminExtendSubscriptionSchema = z.object({
  addedDays: z.coerce.number().int().min(1),
  notes: z.string().trim().max(1000).optional(),
});

export const adminChangePlanSchema = z.object({
  plan: activatablePlanSchema,
  notes: z.string().trim().max(1000).optional(),
  paymentMethod: z.nativeEnum(InvoicePaymentMethodEnum),
});

export const adminCancelSubscriptionSchema = z.object({
  notes: z.string().trim().max(1000).optional(),
});

export const adminRenewSubscriptionSchema = z.object({
  paymentMethod: z.nativeEnum(InvoicePaymentMethodEnum),
  paymentReference: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const adminUpdateSubscriptionNotesSchema = z.object({
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const adminInvoiceRefundSchema = z.object({
  refundedAmount: z.coerce.number().int().min(1),
  reason: z.string().trim().min(1).max(1000),
  notes: z.string().trim().max(1000).optional(),
  revokeAccess: z.boolean(),
});

export type ListAdminSubscriptionsQueryDTO = z.infer<
  typeof listAdminSubscriptionsQuerySchema
>;
export type CheckoutDTO = z.infer<typeof checkoutSchema>;
export type AdminActivateSubscriptionDTO = z.infer<
  typeof adminActivateSubscriptionSchema
>;
export type AdminExtendSubscriptionDTO = z.infer<
  typeof adminExtendSubscriptionSchema
>;
export type AdminChangePlanDTO = z.infer<typeof adminChangePlanSchema>;
export type AdminCancelSubscriptionDTO = z.infer<
  typeof adminCancelSubscriptionSchema
>;
export type AdminRenewSubscriptionDTO = z.infer<
  typeof adminRenewSubscriptionSchema
>;
export type AdminUpdateSubscriptionNotesDTO = z.infer<
  typeof adminUpdateSubscriptionNotesSchema
>;
export type AdminInvoiceRefundDTO = z.infer<typeof adminInvoiceRefundSchema>;
