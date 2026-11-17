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
 *               workingDays:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 0
 *                   maximum: 6
 *                 example: [0, 1, 2, 3, 4]
 *               latenessDeductionDays:
 *                 type: object
 *                 description: Deduction in days for each lateness period
 *                 properties:
 *                   from_35_to_45_min: { type: number, minimum: 0, maximum: 30, multipleOf: 0.5 }
 *                   from_45_to_60_min: { type: number, minimum: 0, maximum: 30, multipleOf: 0.5 }
 *                   more_than_60_min: { type: number, minimum: 0, maximum: 30, multipleOf: 0.5 }
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
