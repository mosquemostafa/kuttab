/**
 * @swagger
 * /api/content/assets/{id}/replace/complete:
 *   post:
 *     summary: Finalize an in-place asset replacement and refresh metadata
 *     description: |
 *       Content manager/admin only. Re-fetches Cloudinary metadata by the same public_id and updates
 *       mutable metadata in DB. The asset id/public_id/URL stay unchanged after replace.
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
 *         description: Existing asset ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [publicId]
 *             properties:
 *               publicId:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Must exactly match the existing asset public_id.
 *     responses:
 *       200:
 *         description: Replacement finalized and metadata refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     publicId: { type: string }
 *                     secureUrl: { type: string }
 *                     cloudinaryUrl: { type: string }
 *                     bytes: { type: integer }
 *                     format: { type: string, nullable: true }
 *                     width: { type: integer, nullable: true }
 *                     height: { type: integer, nullable: true }
 *                     updatedAt: { type: string, format: date-time }
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden (requires content_manager/admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Asset not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Asset was not found in Cloudinary during verification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       422:
 *         description: Validation error (public_id mismatch)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       502:
 *         description: Cloudinary upstream error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
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
  return assetController.finalizeReplace(req, params.id ?? "");
});

export const POST = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => postHandler(req, ctx);
