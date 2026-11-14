/**
 * @swagger
 * /api/announcements:
 *   get:
 *     summary: List targeted announcements history
 *     tags:
 *       - Announcements
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
 *         description: Paginated announcements history
 *       401:
 *         description: Unauthorized
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { announcementController } from "@/server/modules/announcements/announcement.controller";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) => announcementController.history(req));
