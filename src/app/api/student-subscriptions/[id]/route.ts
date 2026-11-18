/**
 * @swagger
 * /api/student-subscriptions/{id}:
 *   get:
 *     summary: Get a student subscription by ID (Admin only)
 *     tags: [Student Subscriptions]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Student subscription found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/StudentSubscription'
 *                 timestamp: { type: string, format: date-time }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Student subscription not found
 *   put:
 *     summary: Update a student subscription by ID (Admin only)
 *     tags: [Student Subscriptions]
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
 *             properties:
 *               studentId: { type: string }
 *               amount: { type: integer, minimum: 0 }
 *               date: { type: string, format: date }
 *               type:
 *                 type: string
 *                 enum: [exempt_poor, installments, exempt_staff_kids, special, monthly, yearly, sponsored]
 *     responses:
 *       200:
 *         description: Student subscription updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/StudentSubscription'
 *                 timestamp: { type: string, format: date-time }
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Student or student subscription not found
 *   delete:
 *     summary: Delete a student subscription by ID (Admin only)
 *     tags: [Student Subscriptions]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Student subscription deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Student subscription not found
 */

import type { NextRequest } from "next/server";

import {
  compose,
  resolveRouteParams,
  type RouteContext,
} from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { studentSubscriptionController } from "@/server/modules/student-subscriptions/student-subscription.controller";

const wrap = compose(withErrorHandler, withAdmin);

const getHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return studentSubscriptionController.getById(req, params.id ?? "");
});

const putHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return studentSubscriptionController.update(req, params.id ?? "");
});

const deleteHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return studentSubscriptionController.delete(req, params.id ?? "");
});

export const GET = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => getHandler(req, ctx);

export const PUT = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => putHandler(req, ctx);

export const DELETE = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => deleteHandler(req, ctx);
