/**
 * @swagger
 * /api/admin/announcements/analytics:
 *   get:
 *     summary: Announcements analytics ratios
 *     description: Simple announcement ratios by type, active state, and status (admin only).
 *     tags:
 *       - Announcements
 *       - Admin
 *     security:
 *       - sessionAuth: []
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { announcementController } from "@/server/modules/announcements/announcement.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const GET = wrap((req) => announcementController.analytics(req));
