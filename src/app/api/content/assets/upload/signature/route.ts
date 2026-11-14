/**
 * @swagger
 * /api/content/assets/upload/signature:
 *   post:
 *     summary: Generate signed Cloudinary upload params for image/file assets
 *     description: Content manager/admin only. Validates asset metadata and returns signed upload parameters.
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
 *             required: [assetType, fileName, fileSize, mimeType, folder]
 *             properties:
 *               assetType:
 *                 type: string
 *                 enum: [image, file]
 *               fileName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               fileSize:
 *                 type: integer
 *                 minimum: 1
 *                 description: For image uses image max size; for file uses file max size.
 *               mimeType:
 *                 type: string
 *                 description: Must belong to the allowed mime set for the selected assetType.
 *               folder:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 120
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Signed upload payload generated
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
 *                         folder: { type: string }
 *                         resourceType:
 *                           type: string
 *                           enum: [image, raw]
 *                         allowedFormats:
 *                           type: array
 *                           items: { type: string }
 *                         tags: { type: string, nullable: true }
 *                     targetFolder: { type: string }
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
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withContentManager } from "@/server/guards/content-manager.guard";
import { assetController } from "@/server/modules/assets/asset.controller";

const wrap = compose(withErrorHandler, withContentManager);

export const POST = wrap((req) => assetController.generateUploadSignature(req));
