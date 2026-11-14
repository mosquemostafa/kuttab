/**
 * @swagger
 * /api/blogs/slugs:
 *   get:
 *     summary: List published blog slugs
 *     tags:
 *       - Blogs
 *     responses:
 *       200:
 *         description: Published blog slugs list
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { blogController } from "@/server/modules/blogs/blog.controller";

const wrap = compose(withErrorHandler);

export const GET = wrap(() => blogController.listPublishedSlugs());
