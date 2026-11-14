/**
 * @swagger
 * /api/admin/overview:
 *   get:
 *     summary: Admin dashboard overview analytics
 *     description: Aggregated users and segments metrics (admin only).
 *     tags:
 *       - Admin
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [7, 30]
 *         description: Calendar days for daily signups series (default 30).
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { adminOverviewController } from "@/server/modules/admin-overview/admin-overview.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const GET = wrap((req) => adminOverviewController.getOverview(req));
