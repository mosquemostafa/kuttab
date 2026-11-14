/**
 * @swagger
 * /api/user/me:
 *   delete:
 *     summary: Delete the currently authenticated user's account and all associated data
 *     tags:
 *       - Users
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Account successfully deleted
 *       401:
 *         description: Unauthorized
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { userController } from "@/server/modules/users/user.controller";

const wrap = compose(withErrorHandler, withAuth);

export const DELETE = wrap((req) => userController.deleteMyAccount(req));
