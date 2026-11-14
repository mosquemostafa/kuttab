/**
 * @swagger
 * /api/content/assets/upload/complete:
 *   post:
 *     summary: Finalize image upload and persist verified metadata
 *     description: |
 *       Content manager/admin only. Verifies the Cloudinary asset using server-side Admin API,
 *       then stores the normalized metadata in media_files.
 *     tags:
 *       - Content Assets
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [publicId, resourceType, bytes, folder]
 *             properties:
 *               publicId:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               resourceType:
 *                 type: string
 *                 enum: [image, video, raw]
 *               format:
 *                 type: string
 *               width:
 *                 type: integer
 *                 minimum: 1
 *               height:
 *                 type: integer
 *                 minimum: 1
 *               bytes:
 *                 type: integer
 *                 minimum: 0
 *               originalFilename:
 *                 type: string
 *               folder:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 120
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Asset finalized and persisted
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
 *                     cloudinaryUrl: { type: string }
 *                     secureUrl: { type: string }
 *                     resourceType:
 *                       type: string
 *                       enum: [image, video, raw]
 *                     format: { type: string, nullable: true }
 *                     width: { type: integer, nullable: true }
 *                     height: { type: integer, nullable: true }
 *                     bytes: { type: integer }
 *                     folder: { type: string }
 *                     filename: { type: string }
 *                     originalFilename: { type: string, nullable: true }
 *                     tags:
 *                       type: array
 *                       items: { type: string }
 *                     uploadedBy: { type: string }
 *                     createdAt: { type: string, format: date-time }
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
 *       422:
 *         description: Validation error
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
 *       502:
 *         description: Cloudinary upstream error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withContentManager } from "@/server/guards/content-manager.guard";
import { assetController } from "@/server/modules/assets/asset.controller";

const wrap = compose(withErrorHandler, withContentManager);

export const POST = wrap((req) => assetController.finalizeUpload(req));
