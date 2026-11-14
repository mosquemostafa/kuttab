/**
 * @swagger
 * /api/fcm/custom-topics:
 *   get:
 *     summary: List available and subscribed custom FCM topics
 *     tags:
 *       - FCM
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Available custom topics with current user subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FcmCustomTopicsListResponse'
 *   post:
 *     summary: Subscribe/unsubscribe current user to a custom topic
 *     tags:
 *       - FCM
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FcmCustomTopicSubscriptionRequest'
 *     responses:
 *       200:
 *         description: Subscription updated and user tokens resynced
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FcmCustomTopicSubscriptionResponse'
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { fcmController } from "@/server/modules/fcm/fcm.controller";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) => fcmController.listCustomTopics(req));
export const POST = wrap((req) =>
  fcmController.updateCustomTopicSubscription(req),
);
