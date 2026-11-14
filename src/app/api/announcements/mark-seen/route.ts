/**
 * @swagger
 * /api/announcements/mark-seen:
 *   post:
 *     summary: Mark targeted announcements as seen
 *     tags:
 *       - Announcements
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [announcementIds]
 *             properties:
 *               announcementIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Seen rows inserted
 *       401:
 *         description: Unauthorized
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { announcementController } from "@/server/modules/announcements/announcement.controller";

const wrap = compose(withErrorHandler, withAuth);

export const POST = wrap((req) => announcementController.markSeen(req));
