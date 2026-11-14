/**
 * @swagger
 * /api/admin/fcm/send-role:
 *   post:
 *     summary: Send push notification to all tokens in a role topic
 *     description: Admin only. Sends a notification to `role_<role>` topic.
 *     tags:
 *       - FCM
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FcmSendRoleTopicRequest'
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

export const POST = wrap((req) => fcmController.sendToRoleTopic(req));
