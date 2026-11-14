/**
 * @swagger
 * /api/admin/users/{id}/segment:
 *   patch:
 *     summary: Update user segment
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
 *               segmentId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Segment updated for user
 */
import type { NextRequest } from "next/server";

import { adminUserController } from "@/server/modules/users/admin-user.controller";
import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";

const wrap = compose(withErrorHandler, withAdmin);

const patchHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return adminUserController.updateUserSegment(req, params.id ?? "");
});

export const PATCH = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => patchHandler(req, ctx);
