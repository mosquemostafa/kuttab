/**
 * @swagger
 * /api/teacher-attendances/toggle:
 *   post:
 *     summary: Atomically toggle teacher attendance (check-in / remove)
 *     tags:
 *       - Teacher Attendances
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacherId
 *               - attendanceDate
 *             properties:
 *               teacherId: { type: string }
 *               attendanceDate: { type: string, format: date, example: "2026-11-17" }
 *               latenessPeriod:
 *                 type: string
 *                 nullable: true
 *                 enum: [from_35_to_45_min, from_45_to_60_min, more_than_60_min]
 *     responses:
 *       200:
 *         description: Toggled attendance state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     attended: { type: boolean }
 *                     attendance: { type: object, nullable: true }
 *                 timestamp: { type: string, format: date-time }
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Teacher not found
 */

import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { teacherAttendanceController } from "@/server/modules/teacher-attendances/teacher-attendance.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const POST = wrap((req) => teacherAttendanceController.toggle(req));
