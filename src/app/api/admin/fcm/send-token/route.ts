/**
 * @swagger
 * /api/admin/fcm/send-token:
 *   post:
 *     summary: Send push notification to a specific token
 *     description: Admin only. Sends a push notification to one FCM token.
 *     tags:
 *       - FCM
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FcmSendTokenRequest'
 *     responses:
 *       200:
 *         description: Send completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FcmSendTokenResponse'
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

export const POST = wrap((req) => fcmController.sendToToken(req));
