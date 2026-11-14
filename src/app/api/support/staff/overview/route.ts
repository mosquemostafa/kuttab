/**
 * @swagger
 * /api/support/staff/overview:
 *   get:
 *     summary: Support desk overview analytics
 *     description: Aggregated ticket and feedback metrics (admin/support only). Two DB round trips with single-pass counts per table.
 *     tags:
 *       - Support
 *     security:
 *       - sessionAuth: []
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withSupportStaff } from "@/server/guards/support-staff.guard";
import { supportStaffOverviewController } from "@/server/modules/support-staff-overview/support-staff-overview.controller";

const wrap = compose(withErrorHandler, withSupportStaff);

export const GET = wrap((req) =>
  supportStaffOverviewController.getOverview(req),
);
