/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: List in-app notifications (cursor pagination)
 *     tags:
 *       - Notifications
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: When true (default), only unread items
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Exclusive cursor (createdAt of last item from previous page)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Items and nextCursor
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Invalid query
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { notificationController } from "@/server/modules/notifications/notification.controller";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) => notificationController.list(req));
