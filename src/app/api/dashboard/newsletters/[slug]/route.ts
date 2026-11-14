/**
 * @swagger
 * /api/dashboard/newsletters/{slug}:
 *   get:
 *     summary: Get a website-public completed newsletter article by slug (includes both bodies)
 *     tags:
 *       - Dashboard
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bilingual article payload for dashboard reading
 *       404:
 *         description: Not found or not public
 */

import type { NextRequest } from "next/server";

import {
  compose,
  resolveRouteParams,
  type RouteContext,
} from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { dashboardNewslettersController } from "@/server/modules/dashboard-newsletter/dashboard-newsletters.controller";

const wrap = compose(withErrorHandler, withAuth);

const getHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return dashboardNewslettersController.getBySlug(req, params.slug ?? "");
});

export const GET = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => getHandler(req, ctx);
