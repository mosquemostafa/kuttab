/**
 * @swagger
 * /api/content/blogs:
 *   get:
 *     summary: List blogs for content staff
 *     tags:
 *       - Blogs
 *       - Content
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: tag
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, published, archived] }
 *       - in: query
 *         name: authorId
 *         schema: { type: string }
 *       - in: query
 *         name: slug
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated content blogs list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   post:
 *     summary: Create blog
 *     tags:
 *       - Blogs
 *       - Content
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titleAr, titleEn, descriptionAr, descriptionEn, slug, contentAr, contentEn, coverImageUrl, excerptAr, excerptEn, readingMinutes]
 *             properties:
 *               titleAr: { type: string }
 *               titleEn: { type: string }
 *               descriptionAr: { type: string }
 *               descriptionEn: { type: string }
 *               slug: { type: string }
 *               contentAr: { type: string }
 *               contentEn: { type: string }
 *               coverImageUrl: { type: string, format: uri }
 *               isFeatured: { type: boolean, default: false }
 *               excerptAr: { type: string }
 *               excerptEn: { type: string }
 *               readingMinutes: { type: integer, minimum: 1 }
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               publishDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Blog created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withContentManager } from "@/server/guards/content-manager.guard";
import { blogController } from "@/server/modules/blogs/blog.controller";

const wrap = compose(withErrorHandler, withContentManager);

export const GET = wrap((req) => blogController.listAdmin(req));
export const POST = wrap((req) => blogController.create(req));
