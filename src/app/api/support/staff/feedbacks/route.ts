/**
 * @swagger
 * /api/support/staff/feedbacks:
 *   get:
 *     summary: List all feedback entries (support desk)
 *     description: |
 *       Paginated list of every feedback entry. Restricted to admin and support roles.
 *     tags:
 *       - Feedbacks
 *     security:
 *       - sessionAuth: []
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withSupportStaff } from "@/server/guards/support-staff.guard";
import { feedbackController } from "@/server/modules/feedbacks/feedback.controller";

const wrap = compose(withErrorHandler, withSupportStaff);

export const GET = wrap((req) => feedbackController.listAllForStaff(req));
