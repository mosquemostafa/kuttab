/**
 * @swagger
 * /api/admin/subscriptions/{id}/renew:
 *   post:
 *     summary: Renew subscription by plan renewal period (admin)
 *     description: Renews a subscription using the current plan renewalDays from plan config. If current expiry is in the past, renewal starts from now.
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
 *               - paymentMethod
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [gateway, bank_transfer, vodafone_cash, instapay, complimentary, fix]
 *               paymentReference:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Subscription renewed successfully
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
 *                     renewed:
 *                       type: boolean
 *                       example: true
 *                     subscriptionId:
 *                       type: string
 *                       example: 95de6e96-fbd8-4ca9-a11e-8936f6037390
 *                     planStartedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-04-15T13:40:00.000Z
 *                     previousExpiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-04-20T13:40:00.000Z
 *                     newExpiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-05-20T13:40:00.000Z
 *                     addedDays:
 *                       type: integer
 *                       minimum: 1
 *                       example: 30
 *                     eventId:
 *                       type: string
 *                       nullable: true
 *                       example: d4dfe0d0-7fbc-4f46-8082-f818d2ecfd6e
 *                     invoiceId:
 *                       type: string
 *                       nullable: true
 *                       example: 95de6e96-fbd8-4ca9-a11e-8936f6037390
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-04-15T13:40:00.000Z
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

const postHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return subscriptionController.renewByAdmin(req, params.id ?? "");
});

export const POST = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => postHandler(req, ctx);
