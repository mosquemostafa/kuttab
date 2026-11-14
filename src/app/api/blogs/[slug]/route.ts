/**
 * @swagger
 * /api/blogs/{slug}:
 *   get:
 *     summary: Get published blog by slug
 *     tags:
 *       - Blogs
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Blog details
 *       404:
 *         description: Blog not found
 */
import type { NextRequest } from "next/server";

import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { blogController } from "@/server/modules/blogs/blog.controller";

const wrap = compose(withErrorHandler);

const getHandler = wrap(async (_req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return blogController.getPublishedBySlug(params.slug ?? "");
});

export const GET = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => getHandler(req, ctx);
