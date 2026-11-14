/**
 * @swagger
 * /api/content/newsletter/campaigns/{id}:
 *   get:
 *     summary: Get newsletter campaign with send stats
 *     description: Content manager or admin only.
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
 *         description: Campaign
 *   patch:
 *     summary: Update newsletter campaign
 *     description: Edits bilingual content and website-channel fields at any status (e.g. fix typos or public archive settings after send).
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
 *         description: Updated
 *   delete:
 *     summary: Delete a draft campaign
 *     description: Only campaigns in `draft` status can be deleted. Content manager or admin only.
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
 *         description: Deleted
 *       400:
 *         description: Not a draft
 *       404:
 *         description: Not found
 */
import type { NextRequest } from "next/server";

import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withContentManager } from "@/server/guards/content-manager.guard";
import { newsletterController } from "@/server/modules/newsletter/newsletter.controller";

const wrap = compose(withErrorHandler, withContentManager);

const getHandler = wrap(async (_req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return newsletterController.getCampaign(_req, params.id ?? "");
});

const patchHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return newsletterController.updateCampaign(req, params.id ?? "");
});

const deleteHandler = wrap(async (_req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return newsletterController.deleteDraftCampaign(_req, params.id ?? "");
});

export const GET = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => getHandler(req, ctx);

export const PATCH = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => patchHandler(req, ctx);

export const DELETE = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => deleteHandler(req, ctx);
