/**
 * @swagger
 * /api/projects/select:
 *   get:
 *     summary: Search and select projects
 *     tags:
 *       - Projects
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by project name
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: includeArchived
 *         schema: { type: boolean, default: false }
 *     responses:
 *       200:
 *         description: Compact project options list
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { projectController } from "@/server/modules/projects/project.controller";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) => projectController.select(req));
