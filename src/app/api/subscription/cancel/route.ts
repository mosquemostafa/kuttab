/**
 * @swagger
 * /api/subscription/cancel:
 *   post:
 *     summary: Disable auto-renew for current user subscription
 *     description: Toggles autoRenew to false for the authenticated user's subscription.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Cancellation flag updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated:
 *                       type: boolean
 *                       example: false
 *                     subscriptionId:
 *                       type: string
 *                     autoRenew:
 *                       type: boolean
 *                       example: false
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

export const POST = wrap((req) => subscriptionController.cancel(req));
