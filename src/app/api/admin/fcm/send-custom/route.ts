/**
 * @swagger
 * /api/admin/fcm/send-custom:
 *   post:
 *     summary: Send push notification to a custom topic
 *     description: Admin only. Sends a notification to a user-opt-in custom FCM topic (for example `product_updates`).
 *     tags:
 *       - FCM
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FcmSendCustomTopicRequest'
 *     responses:
 *       200:
 *         description: Send completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FcmSendTopicResponse'
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { fcmController } from "@/server/modules/fcm/fcm.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const POST = wrap((req) => fcmController.sendToCustomTopic(req));
