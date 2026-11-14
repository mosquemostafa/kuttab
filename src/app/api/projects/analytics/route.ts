/**
 * @swagger
 * /api/projects/analytics:
 *   get:
 *     summary: Return fast todo/note counts for current user
 *     tags:
 *       - Projects
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema: { type: string }
 *         description: Optional project id filter. When omitted, counts across all projects.
 *     responses:
 *       200:
 *         description: Aggregate counts only (no entity payload)
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
 *                     todos:
 *                       type: integer
 *                       example: 12
 *                     notes:
 *                       type: integer
 *                       example: 4
 *                     total:
 *                       type: integer
 *                       example: 16
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

export const GET = wrap((req) => projectController.analytics(req));
