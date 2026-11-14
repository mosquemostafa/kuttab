/**
 * @swagger
 * /api/support/staff/tickets:
 *   get:
 *     summary: List all support tickets (support desk)
 *     description: |
 *       Paginated list of every support ticket. Restricted to admin and support roles.
 *     tags:
 *       - Support
 *     security:
 *       - sessionAuth: []
 *   post:
 *     summary: Staff initiates a new support ticket/chat with a user
 *     description: |
 *       Restricted to admin and support roles. Creates a new ticket assigned to the target user and notifies them.
 *     tags:
 *       - Support
 *     security:
 *       - sessionAuth: []
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withSupportStaff } from "@/server/guards/support-staff.guard";
import { supportTicketController } from "@/server/modules/support-tickets/support-ticket.controller";

const wrap = compose(withErrorHandler, withSupportStaff);

export const GET = wrap((req) => supportTicketController.listAllForStaff(req));
export const POST = wrap((req) => supportTicketController.createByStaff(req));
