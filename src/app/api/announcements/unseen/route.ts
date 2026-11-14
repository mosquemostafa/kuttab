/**
 * @swagger
 * /api/announcements/unseen:
 *   get:
 *     summary: List unseen targeted announcements
 *     tags:
 *       - Announcements
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Unseen announcements
 *       401:
 *         description: Unauthorized
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { announcementController } from "@/server/modules/announcements/announcement.controller";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) => announcementController.unseen(req));
