/**
 * @swagger
 * /api/blogs/related/{id}:
 *   get:
 *     summary: List related published blogs by shared tags
 *     description: >
 *       Returns up to three published blogs that share tags with the given post,
 *       ordered by how many tags overlap (then newest first). Empty list when the
 *       source has no tags or no overlaps. 404 if the blog id is missing or not public.
 *     tags:
 *       - Blogs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of related blog list items (may be empty)
 *       404:
 *         description: Blog not found or not publicly visible
 */
import type { NextRequest } from "next/server";

import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { blogController } from "@/server/modules/blogs/blog.controller";

const wrap = compose(withErrorHandler);

const getHandler = wrap(async (_req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  const id = params.id ?? "";
  return blogController.listPublishedRelatedByBlogId(id);
});

export const GET = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => getHandler(req, ctx);
