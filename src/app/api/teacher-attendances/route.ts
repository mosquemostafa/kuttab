/**
 * @swagger
 * /api/teacher-attendances:
 *   get:
 *     summary: List teacher attendances with pagination and filters
 *     tags:
 *       - Teacher Attendances
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         schema: { type: string }
 *         description: Filter by teacher ID
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date, example: "2026-11-17" }
 *         description: Filter by specific date (YYYY-MM-DD)
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date, example: "2026-11-01" }
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date, example: "2026-11-30" }
 *         description: End date filter
 *       - in: query
 *         name: latenessPeriod
 *         schema:
 *           type: string
 *           enum: [from_35_to_45_min, from_45_to_60_min, more_than_60_min]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated list of teacher attendances
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
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *                 timestamp: { type: string, format: date-time }
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

export const GET = wrap((req) => teacherAttendanceController.list(req));
