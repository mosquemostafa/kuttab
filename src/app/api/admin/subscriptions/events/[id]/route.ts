/**
 * @swagger
 * /api/admin/subscriptions/events/{id}:
 *   get:
 *     summary: Get subscription event by ID (admin)
 *     description: Returns a single subscription event using event row ID (UUID).
 *     tags:
 *       - Subscriptions Admin
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription event ID (UUID)
 *     responses:
 *       200:
 *         description: Subscription event returned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Subscription event not found
 */
import type { NextRequest } from "next/server";

import { subscriptionController } from "@/server/modules/subscriptions/subscription.controller";
import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";

const wrap = compose(withErrorHandler, withAdmin);

const getHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return subscriptionController.getEventByIdByAdmin(req, params.id ?? "");
});

export const GET = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => getHandler(req, ctx);
