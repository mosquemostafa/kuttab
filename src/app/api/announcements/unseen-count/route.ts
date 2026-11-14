/**
 * @swagger
 * /api/announcements/unseen-count:
 *   get:
 *     summary: Get unseen targeted announcements count
 *     tags:
 *       - Announcements
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Unseen announcement count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 3
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { announcementController } from "@/server/modules/announcements/announcement.controller";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap(async (req) => {
  return announcementController.unseenCount(req);
});
