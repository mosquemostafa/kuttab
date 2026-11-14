/**
 * @swagger
 * /api/subscription:
 *   get:
 *     summary: Get current user subscription
 *     tags:
 *       - Subscriptions
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Current user subscription or null if not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   nullable: true
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     userId: { type: string }
 *                     plan:
 *                       type: string
 *                       enum: [free, trial, pro, business]
 *                     planStartedAt: { type: string, format: date-time }
 *                     planExpiresAt: { type: string, format: date-time }
 *                     autoRenew: { type: boolean }
 *                     trialUsed: { type: boolean }
 *                     activatedBy:
 *                       type: string
 *                       enum: [gateway, manual, trial]
 *                     activatedByUserId: { type: string, nullable: true }
 *                     activatedAt: { type: string, format: date-time }
 *                     notes: { type: string, nullable: true }
 *                     gateway:
 *                       type: string
 *                       enum: [paymob, kashier]
 *                       nullable: true
 *                     gatewaySubscriptionId: { type: string, nullable: true }
 *                     gatewayCustomerId: { type: string, nullable: true }
 *                     createdAt: { type: string, format: date-time }
 *                     updatedAt: { type: string, format: date-time }
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
import { subscriptionController } from "@/server/modules/subscriptions/subscription.controller";
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) =>
  subscriptionController.getCurrentSubscription(req),
);
