/**
 * @swagger
 * /api/blogs/top-tags:
 *   get:
 *     summary: Most-used tags on published blogs
 *     tags:
 *       - Blogs
 *     responses:
 *       200:
 *         description: Up to 15 tag strings (no blog bodies), cached in Redis
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { blogController } from "@/server/modules/blogs/blog.controller";

const wrap = compose(withErrorHandler);

export const GET = wrap(() => blogController.listPublishedTopTags());
