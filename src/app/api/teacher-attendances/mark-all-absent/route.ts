/**
 * @swagger
 * /api/teacher-attendances/mark-all-absent:
 *   post:
 *     summary: Mark all teachers as absent for a specific day
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
 *               - date
 *             properties:
 *               date: { type: string, format: date, example: "2026-11-17" }
 *     responses:
 *       200:
 *         description: All teachers marked as absent (attendance removed)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     affectedCount: { type: integer }
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

export const POST = wrap((req) => teacherAttendanceController.markAllAbsent(req));
