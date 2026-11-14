/**
 * @swagger
 * /api/fcm/unregister:
 *   post:
 *     summary: Unregister current user FCM token
 *     description: |
 *       Authenticated endpoint. Deletes token document at
 *       `fcm_tokens/{userId}/tokens/{token}`.
 *     tags:
 *       - FCM
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FcmUnregisterRequest'
 *     responses:
 *       200:
 *         description: Token unregistered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FcmUnregisterResponse'
 *       401:
 *         description: Unauthorized
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
import { withAuth } from "@/server/guards/auth.guard";
import { fcmController } from "@/server/modules/fcm/fcm.controller";

const wrap = compose(withErrorHandler, withAuth);

export const POST = wrap((req) => fcmController.unregister(req));
