/**
 * @swagger
 * /api/todos/select:
 *   get:
 *     summary: Search and select todos
 *     tags:
 *       - Todos
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by todo title
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Compact todo options list
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { todoController } from "@/server/modules/todos/todo.controller";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) => todoController.select(req));
