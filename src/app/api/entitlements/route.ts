/**
 * @swagger
 * /api/entitlements:
 *   get:
 *     summary: Get current user entitlements
 *     tags:
 *       - Subscriptions
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Current resolved plan and feature gates
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
 *                     plan:
 *                       type: string
 *                       enum: [free, trial, pro, business]
 *                     features:
 *                       type: object
 *                       properties:
 *                         maxProjects: { type: integer, nullable: true }
 *                         maxTodos: { type: integer, nullable: true }
 *                         maxEditorImages: { type: integer, nullable: true }
 *                         analytics: { type: boolean }
 *                         csvExport: { type: boolean }
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
import { subscriptionController } from "@/server/modules/subscriptions/subscription.controller";
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) =>
  subscriptionController.getCurrentEntitlements(req),
);
