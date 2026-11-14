/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get application registration and security settings
 *     tags:
 *       - Admin
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Application settings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *   put:
 *     summary: Update application registration and security settings
 *     tags:
 *       - Admin
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               organizationName: { type: string }
 *               allowSelfRegistration: { type: boolean }
 *               requireEmailVerification: { type: boolean }
 *               sendSupportTicketConfirmationEmail: { type: boolean }
 *               sendFeedbackConfirmationEmail: { type: boolean }
 *               forceSingleActiveSession: { type: boolean }
 *               sendNewsletterWelcomeEmail: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated application settings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */

import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { appSettingsController } from "@/server/modules/app-settings/app-settings.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const GET = wrap(() => appSettingsController.getSettings());
export const PUT = wrap((req) => appSettingsController.updateSettings(req));
