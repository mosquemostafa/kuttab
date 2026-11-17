/**
 * @swagger
 * /api/teacher-attendances/daily:
 *   get:
 *     summary: Get all teachers and their attendance status for a specific day
 *     tags:
 *       - Teacher Attendances
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date, example: "2026-11-17" }
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: List of teachers with attendance status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       teacherId: { type: string }
 *                       teacherName: { type: string }
 *                       isAttended: { type: boolean }
 *                       attendance: { type: object, nullable: true }
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
import { teacherAttendanceController } from "@/server/modules/teacher-attendances/teacher-attendance.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const GET = wrap((req) => teacherAttendanceController.daily(req));
