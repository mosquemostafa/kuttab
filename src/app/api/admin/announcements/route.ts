/**
 * @swagger
 * /api/admin/announcements:
 *   get:
 *     summary: List all announcements with seen stats
 *     tags:
 *       - Announcements
 *       - Admin
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated admin announcements list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   post:
 *     summary: Create announcement draft or published item
 *     tags:
 *       - Announcements
 *       - Admin
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, type, targetType]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [feature, improvement, fix, maintenance, alert, promotion]
 *               targetType:
 *                 type: string
 *                 enum: [all, role, segment]
 *               targetValue:
 *                 type: string
 *                 nullable: true
 *                 description: Required when targetType is role or segment. For role use one of user, support, admin.
 *               publish:
 *                 type: boolean
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Announcement created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { announcementController } from "@/server/modules/announcements/announcement.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const GET = wrap((req) => announcementController.listAdmin(req));
export const POST = wrap((req) => announcementController.create(req));
