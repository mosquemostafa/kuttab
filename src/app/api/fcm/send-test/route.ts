/**
 * @swagger
 * /api/fcm/send-test:
 *   post:
 *     summary: Send a test push notification to current user
 *     description: |
 *       Authenticated endpoint. Sends a predefined test push notification
 *       to the currently authenticated user only.
 *     tags:
 *       - FCM
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Test notification send attempted
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

export const POST = wrap((req) => fcmController.sendTestToSelf(req));
