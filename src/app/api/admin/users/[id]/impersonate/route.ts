/**
 * @swagger
 * /api/admin/users/{id}/impersonate:
 *   post:
 *     summary: Impersonate a user (create session as user)
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
 *         description: Impersonation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 *       500:
 *         description: Internal server error
 */

import type { NextRequest } from "next/server";

import { adminUserController } from "@/server/modules/users/admin-user.controller";
import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";

const wrap = compose(withErrorHandler, withAdmin);

const postHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return adminUserController.impersonate(req, params.id ?? "");
});

export const POST = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => postHandler(req, ctx);
