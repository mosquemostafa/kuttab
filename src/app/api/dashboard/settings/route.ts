/**
 * @swagger
 * /api/dashboard/settings:
 *   get:
 *     summary: Get dashboard settings bootstrap data for the current user
 *     tags:
 *       - Dashboard
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Dashboard settings bootstrap payload
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
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     phone:
 *                       type: string
 *                       nullable: true
 *                     image:
 *                       type: string
 *                       nullable: true
 *                     hasPasswordLogin:
 *                       type: boolean
 *                     avatarR2UploadEnabled:
 *                       type: boolean
 *                       description: Whether direct avatar upload to R2 is available
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

import { dashboardSettingsController } from "@/server/modules/dashboard-settings/dashboard-settings.controller";
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) => dashboardSettingsController.getOverview(req));
export const PATCH = wrap((req) =>
  dashboardSettingsController.updateProfile(req),
);
