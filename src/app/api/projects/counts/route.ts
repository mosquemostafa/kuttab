/**
 * @swagger
 * /api/projects/counts:
 *   get:
 *     summary: Return fast project count for current user
 *     tags:
 *       - Projects
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Optional case-insensitive name search filter.
 *       - in: query
 *         name: isArchived
 *         schema: { type: boolean }
 *         description: Optional archive-state filter.
 *     responses:
 *       200:
 *         description: Aggregate project count only
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
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 6
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { projectController } from "@/server/modules/projects/project.controller";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) => projectController.counts(req));
