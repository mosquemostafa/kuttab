/**
 * @swagger
 * /api/content/blogs/{id}:
 *   get:
 *     summary: Get blog by id for content staff
 *     tags:
 *       - Blogs
 *       - Content
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Blog details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Blog not found
 *   patch:
 *     summary: Update blog by id
 *     tags:
 *       - Blogs
 *       - Content
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Blog updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Blog not found
 *   delete:
 *     summary: Delete blog by id
 *     tags:
 *       - Blogs
 *       - Content
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Blog deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Blog not found
 */
import type { NextRequest } from "next/server";

import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withContentManager } from "@/server/guards/content-manager.guard";
import { blogController } from "@/server/modules/blogs/blog.controller";

const wrap = compose(withErrorHandler, withContentManager);

const getHandler = wrap(async (_req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return blogController.getById(params.id ?? "");
});

const patchHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return blogController.update(req, params.id ?? "");
});

const deleteHandler = wrap(async (_req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return blogController.delete(params.id ?? "");
});

export const GET = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => getHandler(req, ctx);

export const PATCH = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => patchHandler(req, ctx);

export const DELETE = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => deleteHandler(req, ctx);
