/**
 * @swagger
 * /api/admin/users/select:
 *   get:
 *     summary: Search and select users
 *     tags:
 *       - Admin
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by name, email, or phone
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *         description: Filter by user role
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Compact user options list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { userController } from "@/server/modules/users/user.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const GET = wrap((req) => userController.select(req));
