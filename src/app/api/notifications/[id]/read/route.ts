/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark one in-app notification as read (idempotent)
 *     tags:
 *       - Notifications
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Marked (or was already read)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found for this user
 */
import type { NextRequest } from "next/server";

import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { notificationController } from "@/server/modules/notifications/notification.controller";

const wrap = compose(withErrorHandler, withAuth);

const patchHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return notificationController.markRead(req, params.id ?? "");
});

export const PATCH = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => patchHandler(req, ctx);
