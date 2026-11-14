/**
 * @swagger
 * /api/admin/subscriptions/{id}/change-plan:
 *   patch:
 *     summary: Change subscription plan (admin)
 *     tags:
 *       - Subscriptions Admin
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *               - paymentMethod
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [pro, business]
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *               paymentMethod:
 *                 type: string
 *                 enum: [gateway, bank_transfer, vodafone_cash, instapay, complimentary, fix]
 *               # amount/status/paidAt are server-derived:
 *               # - amount from PLAN_CONFIG for selected plan
 *               # - currency is always EGP for manual operations
 *               # - status is always paid
 *               # - paidAt is current server timestamp
 *     responses:
 *       200:
 *         description: Plan changed and related records created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     changed: { type: boolean, example: true }
 *                     subscriptionId: { type: string }
 *                     fromPlan: { type: string }
 *                     toPlan: { type: string }
 *                     planStartedAt: { type: string, format: date-time }
 *                     planExpiresAt: { type: string, format: date-time }
 *                     eventId: { type: string, nullable: true }
 *                     invoiceId: { type: string, nullable: true }
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Subscription not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
import type { NextRequest } from "next/server";

import { subscriptionController } from "@/server/modules/subscriptions/subscription.controller";
import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";

const wrap = compose(withErrorHandler, withAdmin);

const patchHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return subscriptionController.changePlanByAdmin(req, params.id ?? "");
});

export const PATCH = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => patchHandler(req, ctx);
