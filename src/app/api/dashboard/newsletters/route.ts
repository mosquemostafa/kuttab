/**
 * @swagger
 * /api/dashboard/newsletters:
 *   get:
 *     summary: List website-public completed newsletter campaigns (no HTML bodies)
 *     description: Authenticated users only. Sorted newest first by startedAt (with fallbacks).
 *     tags:
 *       - Dashboard
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Paginated list of public newsletter summaries
 */

import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { dashboardNewslettersController } from "@/server/modules/dashboard-newsletter/dashboard-newsletters.controller";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) => dashboardNewslettersController.list(req));
