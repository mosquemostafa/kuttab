/**
 * @swagger
 * /api/admin/subscriptions/{id}/extend:
 *   patch:
 *     summary: Extend subscription period (admin)
 *     description: Extends subscription expiry by added days. If current expiry is in the past, extension starts from now.
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
 *         description: Subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addedDays
 *             properties:
 *               addedDays:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of days to add to subscription period.
 *     responses:
 *       200:
 *         description: Subscription extended successfully
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
 *                     extended:
 *                       type: boolean
 *                       example: true
 *                     subscriptionId:
 *                       type: string
 *                     planStartedAt:
 *                       type: string
 *                       format: date-time
 *                     previousExpiresAt:
 *                       type: string
 *                       format: date-time
 *                     newExpiresAt:
 *                       type: string
 *                       format: date-time
 *                     addedDays:
 *                       type: integer
 *                       minimum: 1
 *                     eventId:
 *                       type: string
 *                       nullable: true
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
  return subscriptionController.extendByAdmin(req, params.id ?? "");
});

export const PATCH = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => patchHandler(req, ctx);
