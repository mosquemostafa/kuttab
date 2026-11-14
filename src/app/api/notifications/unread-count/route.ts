/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: In-app unread notification count
 *     tags:
 *       - Notifications
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Unread count for the current user
 *       401:
 *         description: Unauthorized
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { notificationController } from "@/server/modules/notifications/notification.controller";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) => notificationController.unreadCount(req));
