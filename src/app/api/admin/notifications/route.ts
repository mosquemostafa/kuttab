/**
 * @swagger
 * /api/admin/notifications:
 *   post:
 *     summary: Create an in-app notification for a user
 *     tags:
 *       - Notifications
 *       - Admin
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, type, title, message]
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum:
 *                   - system
 *                   - social
 *                   - announcement_reference
 *                   - support_ticket
 *                   - feedback
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               link:
 *                 type: string
 *                 nullable: true
 *               metadata:
 *                 type: object
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Notification created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       422:
 *         description: Validation error
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { notificationController } from "@/server/modules/notifications/notification.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const POST = wrap((req) => notificationController.adminCreate(req));
