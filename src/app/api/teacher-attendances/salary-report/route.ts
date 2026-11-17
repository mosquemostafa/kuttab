/**
 * @swagger
 * /api/teacher-attendances/salary-report:
 *   get:
 *     summary: Get the monthly salary report for all active teachers
 *     tags:
 *       - Teacher Attendances
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema: { type: string, pattern: "^(?:[1-9]\\d{3})-(0[1-9]|1[0-2])$", example: "2026-11" }
 *         description: Report month in YYYY-MM format
 *     responses:
 *       200:
 *         description: Monthly salary report based on configured working days, absences, and attendance deductions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     month: { type: string, example: "2026-11" }
 *                     startDate: { type: string, format: date }
 *                     endDate: { type: string, format: date }
 *                     workingDays:
 *                       type: array
 *                       items: { type: integer, minimum: 0, maximum: 6 }
 *                     workingDates:
 *                       type: array
 *                       items: { type: string, format: date }
 *                     teachers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           teacherId: { type: string }
 *                           teacherName: { type: string }
 *                           monthlySalary: { type: number, nullable: true }
 *                           expectedWorkingDays: { type: integer }
 *                           attendedDays: { type: integer }
 *                           absentDays: { type: integer }
 *                           deductionTypeOccurrences: { type: integer }
 *                           deductionDays: { type: number }
 *                           totalDeductionDays: { type: number }
 *                           dailyRate: { type: number, nullable: true }
 *                           absenceDeductionAmount: { type: number, nullable: true }
 *                           deductionAmount: { type: number, nullable: true }
 *                           totalDeductionAmount: { type: number, nullable: true }
 *                           netSalary: { type: number, nullable: true }
 *                     summary:
 *                       type: object
 *                       properties:
 *                         teacherCount: { type: integer }
 *                         missingSalaryCount: { type: integer }
 *                         totalMonthlySalaries: { type: number }
 *                         totalDeductions: { type: number }
 *                         totalNetSalaries: { type: number }
 *                 timestamp: { type: string, format: date-time }
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */

import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { getTeacherSalaryReport } from "@/server/modules/teacher-attendances/teacher-attendance.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const GET = wrap(getTeacherSalaryReport);
