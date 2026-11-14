/**
 * @swagger
 * /api/admin/subscriptions:
 *   get:
 *     summary: List subscriptions (admin)
 *     tags:
 *       - Subscriptions Admin
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: plan
 *         schema:
 *           type: string
 *           enum: [free, trial, pro, business]
 *       - in: query
 *         name: activatedBy
 *         schema:
 *           type: string
 *           enum: [gateway, manual, trial]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Paginated list of subscriptions
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
 *                       id: { type: string }
 *                       userId: { type: string }
 *                       plan: { type: string, enum: [free, trial, pro, business] }
 *                       planStartedAt: { type: string, format: date-time }
 *                       planExpiresAt: { type: string, format: date-time }
 *                       autoRenew: { type: boolean }
 *                       trialUsed: { type: boolean }
 *                       activatedBy:
 *                         type: string
 *                         enum: [gateway, manual, trial]
 *                       activatedByUserId: { type: string, nullable: true }
 *                       activatedAt: { type: string, format: date-time }
 *                       notes: { type: string, nullable: true }
 *                       gateway:
 *                         type: string
 *                         enum: [paymob, kashier]
 *                         nullable: true
 *                       gatewaySubscriptionId: { type: string, nullable: true }
 *                       gatewayCustomerId: { type: string, nullable: true }
 *                       createdAt: { type: string, format: date-time }
 *                       updatedAt: { type: string, format: date-time }
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *                 timestamp: { type: string, format: date-time }
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
 */
import { subscriptionController } from "@/server/modules/subscriptions/subscription.controller";
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";

const wrap = compose(withErrorHandler, withAdmin);

export const GET = wrap((req) =>
  subscriptionController.listAdminSubscriptions(req),
);
