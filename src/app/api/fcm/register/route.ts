/**
 * @swagger
 * /api/fcm/register:
 *   post:
 *     summary: Register or refresh current user FCM token
 *     description: |
 *       Authenticated endpoint. Conditionally upserts a token document at
 *       `fcm_tokens/{userId}/tokens/{token}` (skip write when unchanged), syncs topic
 *       subscriptions, and updates `updatedAt` for Firestore TTL when written.
 *     tags:
 *       - FCM
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FcmRegisterRequest'
 *     responses:
 *       200:
 *         description: |
 *           Registration result. `status` is `registered` (new doc), `updated`
 *           (metadata or reactivation), or `already_registered` (no server write).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FcmRegisterResponse'
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

export const POST = wrap((req) => fcmController.register(req));
