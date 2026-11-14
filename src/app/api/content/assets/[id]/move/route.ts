/**
 * @swagger
 * /api/content/assets/{id}/move:
 *   post:
 *     summary: Move an asset to another folder
 *     description: |
 *       Content manager/admin only. Renames the asset in Cloudinary to the target folder path,
 *       then updates the database row (public id, URLs, folder label).
 *     tags:
 *       - Content Assets
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [folder]
 *             properties:
 *               folder:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 120
 *                 description: Target subfolder (predefined image or file folder)
 *     responses:
 *       200:
 *         description: Asset moved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Asset not found
 *       422:
 *         description: Validation error
 *       502:
 *         description: Cloudinary error
 */
import type { NextRequest } from "next/server";

import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withContentManager } from "@/server/guards/content-manager.guard";
import { assetController } from "@/server/modules/assets/asset.controller";

const wrap = compose(withErrorHandler, withContentManager);

const postHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return assetController.moveToFolder(req, params.id ?? "");
});

export const POST = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => postHandler(req, ctx);
