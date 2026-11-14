/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: List published blogs
 *     tags:
 *       - Blogs
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: tag
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated published blogs list
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { blogController } from "@/server/modules/blogs/blog.controller";

const wrap = compose(withErrorHandler);

export const GET = wrap((req) => blogController.listPublished(req));
