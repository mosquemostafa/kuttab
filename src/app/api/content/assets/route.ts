/**
 * @swagger
 * /api/content/assets:
 *   get:
 *     summary: List/search assets
 *     description: Content manager/admin only. Returns paginated assets with optional filters.
 *     tags:
 *       - Content Assets
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Text search (ILIKE on filename then public_id)
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *         description: Exact folder filter
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *           enum: [image, video, raw]
 *         description: Exact resource type filter
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *         description: Exact format filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated assets list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       publicId: { type: string }
 *                       cloudinaryUrl: { type: string }
 *                       secureUrl: { type: string }
 *                       resourceType:
 *                         type: string
 *                         enum: [image, video, raw]
 *                       format: { type: string, nullable: true }
 *                       width: { type: integer, nullable: true }
 *                       height: { type: integer, nullable: true }
 *                       bytes: { type: integer }
 *                       folder: { type: string }
 *                       filename: { type: string }
 *                       originalFilename: { type: string, nullable: true }
 *                       tags:
 *                         type: array
 *                         items: { type: string }
 *                       uploadedBy: { type: string }
 *                       createdAt: { type: string, format: date-time }
 *                       updatedAt: { type: string, format: date-time }
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
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

export const GET = wrap((req) => assetController.list(req));
