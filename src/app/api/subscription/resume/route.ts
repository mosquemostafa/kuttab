/**
 * @swagger
 * /api/subscription/resume:
 *   post:
 *     summary: Resume current user subscription
 *     description: Toggles autoRenew to true for the authenticated user's subscription.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Resume flag updated
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
 *                     updated:
 *                       type: boolean
 *                       example: true
 *                     subscriptionId:
 *                       type: string
 *                     autoRenew:
 *                       type: boolean
 *                       example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Subscription not found for current user
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

export const POST = wrap((req) => subscriptionController.resume(req));
