import { z } from "zod";

export const workingDaySchema = z.number().int().min(0).max(6);

export const updateAppSettingsSchema = z.object({
  organizationName: z.string().min(1).max(255).optional(),
  allowSelfRegistration: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  sendSupportTicketConfirmationEmail: z.boolean().optional(),
  sendFeedbackConfirmationEmail: z.boolean().optional(),
  forceSingleActiveSession: z.boolean().optional(),
  sendNewsletterWelcomeEmail: z.boolean().optional(),
  workingDays: z
    .array(workingDaySchema)
    .min(1)
    .max(7)
    .transform((days) => Array.from(new Set(days)).sort((a, b) => a - b))
    .optional(),
});
