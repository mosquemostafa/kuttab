/**
 * @swagger
 * /api/fcm/tokens:
 *   get:
 *     summary: List current user registered FCM tokens
 *     tags:
 *       - FCM
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Registered FCM tokens for authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FcmListTokensResponse'
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

export const GET = wrap((req) => fcmController.list(req));
