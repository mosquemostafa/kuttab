/**
 * @swagger
 * /api/teacher-attendances/{id}:
 *   get:
 *     summary: Get teacher attendance by ID
 *     tags:
 *       - Teacher Attendances
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attendance record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 *                 timestamp: { type: string, format: date-time }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Not found
 *   patch:
 *     summary: Update attendance details (e.g. attendance deduction type)
 *     tags:
 *       - Teacher Attendances
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attendanceDeductionType
 *             properties:
 *               attendanceDeductionType:
 *                 type: string
 *                 nullable: true
 *                 enum: [from_35_to_45_min, from_45_to_60_min, more_than_60_min, excused_absence]
 *     responses:
 *       200:
 *         description: Updated attendance record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 *                 timestamp: { type: string, format: date-time }
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete attendance record
 *     tags:
 *       - Teacher Attendances
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Not found
 */

import type { NextRequest } from "next/server";

import {
  compose,
  resolveRouteParams,
  type RouteContext,
} from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { teacherAttendanceController } from "@/server/modules/teacher-attendances/teacher-attendance.controller";

const wrap = compose(withErrorHandler, withAdmin);

const getHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return teacherAttendanceController.getById(req, params.id ?? "");
});

const patchHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return teacherAttendanceController.update(req, params.id ?? "");
});

const deleteHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return teacherAttendanceController.delete(req, params.id ?? "");
});

export const GET = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => getHandler(req, ctx);
export const PATCH = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => patchHandler(req, ctx);
export const DELETE = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => deleteHandler(req, ctx);
