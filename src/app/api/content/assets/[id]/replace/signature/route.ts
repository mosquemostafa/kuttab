/**
 * @swagger
 * /api/content/assets/{id}/replace/signature:
 *   post:
 *     summary: Generate signed Cloudinary params to replace an existing asset in place
 *     description: |
 *       Content manager/admin only. Uses the existing asset public_id and returns signed params
 *       with overwrite + invalidate so the asset URL/public_id remains unchanged while content is replaced.
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
 *             required: [fileName, fileSize, mimeType]
 *             properties:
 *               fileName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               fileSize:
 *                 type: integer
 *                 minimum: 1
 *               mimeType:
 *                 type: string
 *                 description: Must satisfy the same validation rules as the original asset type.
 *     responses:
 *       200:
 *         description: Signed replace upload payload generated
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
 *                     upload:
 *                       type: object
 *                       properties:
 *                         signature: { type: string }
 *                         timestamp: { type: integer }
 *                         apiKey: { type: string }
 *                         cloudName: { type: string }
 *                         publicId: { type: string }
 *                         resourceType:
 *                           type: string
 *                           enum: [image, raw]
 *                         overwrite: { type: boolean, example: true }
 *                         invalidate: { type: boolean, example: true }
 *                         type: { type: string, example: upload }
 *                         allowedFormats:
 *                           type: array
 *                           items: { type: string }
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
 *       422:
 *         description: Validation error (mime type / file size / resource type mismatch)
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
  return assetController.generateReplaceSignature(req, params.id ?? "");
});

export const POST = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => postHandler(req, ctx);
