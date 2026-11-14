/**
 * @swagger
 * /api/content/newsletter/campaigns/{id}/resume:
 *   post:
 *     summary: Resume sending an interrupted campaign via BullMQ
 *     description: Content manager or admin only. Re-enqueues unsent or expired-lease subscribers.
 *     tags:
 *       - Content
 *       - Newsletter
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
 *         description: Resumed
 *       503:
 *         description: Newsletter not configured
 */
import type { NextRequest } from "next/server";

import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withContentManager } from "@/server/guards/content-manager.guard";
import { newsletterController } from "@/server/modules/newsletter/newsletter.controller";

const wrap = compose(withErrorHandler, withContentManager);

const postHandler = wrap(async (_req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return newsletterController.resumeCampaign(_req, params.id ?? "");
});

export const POST = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => postHandler(req, ctx);
