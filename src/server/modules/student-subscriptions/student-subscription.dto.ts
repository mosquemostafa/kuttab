import { z } from "zod";

import { StudentSubscriptionType } from "@/shared/enums/student-subscription-type.enum";

export const studentSubscriptionTypeValues = [
  StudentSubscriptionType.MONTHLY,
  StudentSubscriptionType.YEARLY,
  StudentSubscriptionType.INSTALLMENTS,
] as const;

export const studentSubscriptionTypeSchema = z.enum(
  studentSubscriptionTypeValues,
);

export const createStudentSubscriptionSchema = z.object({
  studentId: z.string().trim().min(1, "Student ID is required").max(255),
  amount: z.coerce
    .number()
    .int("Amount must be a whole number")
    .min(0, "Amount must be at least 0"),
  date: z.iso.date(),
  type: studentSubscriptionTypeSchema,
});

export const updateStudentSubscriptionSchema =
  createStudentSubscriptionSchema.partial();

export const listStudentSubscriptionsQuerySchema = z
  .object({
    studentId: z.string().trim().max(255).optional(),
    type: studentSubscriptionTypeSchema.optional(),
    date: z.iso.date().optional(),
    startDate: z.iso.date().optional(),
    endDate: z.iso.date().optional(),
    minAmount: z.coerce.number().int().min(0).optional(),
    maxAmount: z.coerce.number().int().min(0).optional(),
    sortBy: z.enum(["date", "amount", "createdAt"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .refine(
    ({ startDate, endDate }) => !startDate || !endDate || startDate <= endDate,
    {
      message: "startDate must be before or equal to endDate",
      path: ["endDate"],
    },
  )
  .refine(
    ({ minAmount, maxAmount }) =>
      minAmount === undefined ||
      maxAmount === undefined ||
      minAmount <= maxAmount,
    {
      message: "minAmount must be less than or equal to maxAmount",
      path: ["maxAmount"],
    },
  );

export type CreateStudentSubscriptionDTO = z.infer<
  typeof createStudentSubscriptionSchema
>;
export type UpdateStudentSubscriptionDTO = z.infer<
  typeof updateStudentSubscriptionSchema
>;
export type ListStudentSubscriptionsQueryDTO = z.infer<
  typeof listStudentSubscriptionsQuerySchema
>;
