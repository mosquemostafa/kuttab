/**
 * @swagger
 * /api/subscription/trial/start:
 *   post:
 *     summary: Start trial plan for current user
 *     tags:
 *       - Subscriptions
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       201:
 *         description: Trial started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     started: { type: boolean, example: true }
 *                     subscriptionId: { type: string }
 *                     eventId: { type: string, nullable: true }
 *                 timestamp: { type: string, format: date-time }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Trial already used or current subscription period not expired
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

export const POST = wrap((req) => subscriptionController.startTrial(req));
