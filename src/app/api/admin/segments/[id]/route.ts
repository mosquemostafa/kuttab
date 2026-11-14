/**
 * @swagger
 * /api/admin/segments/{id}:
 *   get:
 *     summary: Get segment by id
 *     tags:
 *       - Admin
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Segment details
 *   patch:
 *     summary: Update segment
 *     tags:
 *       - Admin
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               emoji:
 *                 type: string
 *     responses:
 *       200:
 *         description: Segment updated
 *   delete:
 *     summary: Delete segment
 *     tags:
 *       - Admin
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Segment deleted
 */
import type { NextRequest } from "next/server";

import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { segmentController } from "@/server/modules/segments/segment.controller";

const wrap = compose(withErrorHandler, withAdmin);

const getHandler = wrap(async (_req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return segmentController.getById(params.id ?? "");
});

const patchHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return segmentController.update(req, params.id ?? "");
});

const deleteHandler = wrap(async (_req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return segmentController.delete(params.id ?? "");
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
