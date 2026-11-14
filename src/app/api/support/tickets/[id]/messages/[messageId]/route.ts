/**
 * @swagger
 * /api/support/tickets/{id}/messages/{messageId}:
 *   delete:
 *     summary: Delete a ticket message
 *     description: Support or Admin only. Can delete messages sent by the authenticated staff member.
 *     tags:
 *       - Support
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Support ticket ID
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       204:
 *         description: Message deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
import type { NextRequest } from "next/server";

import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withSupportStaff } from "@/server/guards/support-staff.guard";
import { supportTicketController } from "@/server/modules/support-tickets/support-ticket.controller";

const wrap = compose(withErrorHandler, withSupportStaff);

const deleteHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return supportTicketController.deleteMessage(
    req,
    params.id ?? "",
    params.messageId ?? "",
  );
});

export const DELETE = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => deleteHandler(req, ctx);
