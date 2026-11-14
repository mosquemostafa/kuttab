/**
 * @swagger
 * /api/admin/fcm/send-user:
 *   post:
 *     summary: Send push notification to all active tokens of a user
 *     description: Admin only. Sends one multicast notification to all active FCM tokens for the target user.
 *     tags:
 *       - FCM
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FcmSendUserRequest'
 *     responses:
 *       200:
 *         description: Multicast send completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FcmSendUserResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden (requires admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { fcmController } from "@/server/modules/fcm/fcm.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const POST = wrap((req) => fcmController.sendToUser(req));
