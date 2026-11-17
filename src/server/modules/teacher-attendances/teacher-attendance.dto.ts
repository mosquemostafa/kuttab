import { z } from "zod";

import { LatenessPeriod } from "@/shared/types/teacher-attendance.types";

export const latenessPeriodValues = [
  LatenessPeriod.FROM_35_TO_45_MIN,
  LatenessPeriod.FROM_45_TO_60_MIN,
  LatenessPeriod.MORE_THAN_60_MIN,
] as const;

export const latenessPeriodSchema = z.enum(latenessPeriodValues);

// YYYY-MM-DD date regex
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const listTeacherAttendancesQuerySchema = z.object({
  teacherId: z.string().trim().min(1).optional(),
  date: z
    .string()
    .trim()
    .regex(dateRegex, "Date must be in YYYY-MM-DD format")
    .optional(),
  startDate: z
    .string()
    .trim()
    .regex(dateRegex, "startDate must be in YYYY-MM-DD format")
    .optional(),
  endDate: z
    .string()
    .trim()
    .regex(dateRegex, "endDate must be in YYYY-MM-DD format")
    .optional(),
  latenessPeriod: latenessPeriodSchema.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const dailyAttendanceQuerySchema = z.object({
  date: z
    .string()
    .trim()
    .regex(dateRegex, "Date must be in YYYY-MM-DD format"),
});

export const toggleTeacherAttendanceSchema = z.object({
  teacherId: z.string().trim().min(1, "teacherId is required"),
  attendanceDate: z
    .string()
    .trim()
    .regex(dateRegex, "attendanceDate must be in YYYY-MM-DD format"),
  latenessPeriod: latenessPeriodSchema.nullable().optional(),
});

export const updateTeacherAttendanceSchema = z.object({
  latenessPeriod: latenessPeriodSchema.nullable(),
});

export const bulkAttendanceActionSchema = z.object({
  date: z
    .string()
    .trim()
    .regex(dateRegex, "Date must be in YYYY-MM-DD format"),
});

export type ListTeacherAttendancesQueryDTO = z.infer<
  typeof listTeacherAttendancesQuerySchema
>;
export type DailyAttendanceQueryDTO = z.infer<
  typeof dailyAttendanceQuerySchema
>;
export type ToggleTeacherAttendanceDTO = z.infer<
  typeof toggleTeacherAttendanceSchema
>;
export type UpdateTeacherAttendanceDTO = z.infer<
  typeof updateTeacherAttendanceSchema
>;
export type BulkAttendanceActionDTO = z.infer<
  typeof bulkAttendanceActionSchema
>;
