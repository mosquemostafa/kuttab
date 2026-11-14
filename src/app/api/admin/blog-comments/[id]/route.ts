/**
 * @swagger
 * /api/admin/blog-comments/{id}:
 *   patch:
 *     summary: Update any blog comment (admin or content manager)
 *     tags:
 *       - Blogs
 *       - Admin
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *       200:
 *         description: Comment updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin or content manager role required
 *       404:
 *         description: Comment not found
 *   delete:
 *     summary: Delete any blog comment (admin or content manager)
 *     tags:
 *       - Blogs
 *       - Admin
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Comment deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin or content manager role required
 *       404:
 *         description: Comment not found
 */
import type { NextRequest } from "next/server";

import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withContentManager } from "@/server/guards/content-manager.guard";
import { blogCommentController } from "@/server/modules/blog-comments/blog-comment.controller";

const wrap = compose(withErrorHandler, withContentManager);

const patchHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return blogCommentController.updateAsAdmin(req, params.id ?? "");
});

const deleteHandler = wrap(async (_req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return blogCommentController.deleteAsAdmin(_req, params.id ?? "");
});

export const PATCH = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => patchHandler(req, ctx);

export const DELETE = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => deleteHandler(req, ctx);
