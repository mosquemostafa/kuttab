import { z } from "zod";

export const updateAppSettingsSchema = z.object({
  organizationName: z.string().min(1).max(255).optional(),
  allowSelfRegistration: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  sendSupportTicketConfirmationEmail: z.boolean().optional(),
  sendFeedbackConfirmationEmail: z.boolean().optional(),
  forceSingleActiveSession: z.boolean().optional(),
  sendNewsletterWelcomeEmail: z.boolean().optional(),
});
