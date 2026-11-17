import { z } from "zod";

import { AttendanceDeductionType } from "@/shared/types/teacher-attendance.types";

export const attendanceDeductionTypeValues = [
  AttendanceDeductionType.FROM_35_TO_45_MIN,
  AttendanceDeductionType.FROM_45_TO_60_MIN,
  AttendanceDeductionType.MORE_THAN_60_MIN,
  AttendanceDeductionType.EXCUSED_ABSENCE,
] as const;

export const attendanceDeductionTypeSchema = z.enum(attendanceDeductionTypeValues);

// YYYY-MM-DD date regex
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const monthRegex = /^(?:[1-9]\d{3})-(0[1-9]|1[0-2])$/;

function isValidDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

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
  attendanceDeductionType: attendanceDeductionTypeSchema.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const dailyAttendanceQuerySchema = z.object({
  date: z
    .string()
    .trim()
    .regex(dateRegex, "Date must be in YYYY-MM-DD format"),
});

export const weeklyAttendanceQuerySchema = z.object({
  startDate: z
    .string()
    .trim()
    .regex(dateRegex, "startDate must be in YYYY-MM-DD format")
    .refine(isValidDate, "startDate must be a valid date"),
});

export const salaryReportQuerySchema = z.object({
  month: z
    .string()
    .trim()
    .regex(monthRegex, "month must be in YYYY-MM format"),
});

export const toggleTeacherAttendanceSchema = z.object({
  teacherId: z.string().trim().min(1, "teacherId is required"),
  attendanceDate: z
    .string()
    .trim()
    .regex(dateRegex, "attendanceDate must be in YYYY-MM-DD format"),
  attendanceDeductionType: attendanceDeductionTypeSchema.nullable().optional(),
});

export const updateTeacherAttendanceSchema = z.object({
  attendanceDeductionType: attendanceDeductionTypeSchema.nullable(),
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
export type WeeklyAttendanceQueryDTO = z.infer<
  typeof weeklyAttendanceQuerySchema
>;
export type SalaryReportQueryDTO = z.infer<typeof salaryReportQuerySchema>;
export type ToggleTeacherAttendanceDTO = z.infer<
  typeof toggleTeacherAttendanceSchema
>;
export type UpdateTeacherAttendanceDTO = z.infer<
  typeof updateTeacherAttendanceSchema
>;
export type BulkAttendanceActionDTO = z.infer<
  typeof bulkAttendanceActionSchema
>;
