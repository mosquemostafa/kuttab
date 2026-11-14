/**
 * @swagger
 * /api/blogs/{slug}/comments:
 *   get:
 *     summary: List comments for a published blog (authenticated)
 *     tags:
 *       - Blogs
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated comments
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Blog not found or not published
 *   post:
 *     summary: Create a comment on a published blog (authenticated)
 *     tags:
 *       - Blogs
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body: { type: string }
 *     responses:
 *       201:
 *         description: Comment created
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Blog not found or not published
 */
import type { NextRequest } from "next/server";

import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { blogCommentController } from "@/server/modules/blog-comments/blog-comment.controller";

const wrap = compose(withErrorHandler, withAuth);

const getHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return blogCommentController.listBySlug(req, params.slug ?? "");
});

const postHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return blogCommentController.create(req, params.slug ?? "");
});

export const GET = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => getHandler(req, ctx);

export const POST = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => postHandler(req, ctx);
