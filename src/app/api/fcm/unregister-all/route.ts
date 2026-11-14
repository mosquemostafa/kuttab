/**
 * @swagger
 * /api/fcm/unregister-all:
 *   post:
 *     summary: Unregister all current user FCM tokens
 *     tags:
 *       - FCM
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: All tokens removed for authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FcmUnregisterAllResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { fcmController } from "@/server/modules/fcm/fcm.controller";

const wrap = compose(withErrorHandler, withAuth);

export const POST = wrap((req) => fcmController.unregisterAll(req));
