/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   post:
 *     summary: Mark all in-app notifications as read for the current user
 *     tags:
 *       - Notifications
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { notificationController } from "@/server/modules/notifications/notification.controller";

const wrap = compose(withErrorHandler, withAuth);

export const POST = wrap((req) => notificationController.markAllRead(req));
