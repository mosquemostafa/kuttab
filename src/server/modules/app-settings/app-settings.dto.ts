import { z } from "zod";

import { LatenessPeriod } from "@/shared/types/teacher-attendance.types";

export const workingDaySchema = z.number().int().min(0).max(6);

const deductionDaysSchema = z.number().finite().min(0).max(30);

export const latenessDeductionDaysSchema = z.object({
  [LatenessPeriod.FROM_35_TO_45_MIN]: deductionDaysSchema,
  [LatenessPeriod.FROM_45_TO_60_MIN]: deductionDaysSchema,
  [LatenessPeriod.MORE_THAN_60_MIN]: deductionDaysSchema,
  [LatenessPeriod.EXCUSED_ABSENCE]: deductionDaysSchema,
});

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
  latenessDeductionDays: latenessDeductionDaysSchema.optional(),
});
