/**
 * @swagger
 * /api/plans:
 *   get:
 *     summary: List subscription plans and feature gates
 *     tags:
 *       - Subscriptions
 *     responses:
 *       200:
 *         description: Plan features and billing configuration keyed by plan id
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
 *                     features:
 *                       type: object
 *                       properties:
 *                         free:
 *                           type: object
 *                           properties:
 *                             maxProjects: { type: integer, nullable: true }
 *                             maxTodos: { type: integer, nullable: true }
 *                             maxEditorImages: { type: integer, nullable: true }
 *                             analytics: { type: boolean }
 *                             csvExport: { type: boolean }
 *                         trial:
 *                           type: object
 *                           properties:
 *                             maxProjects: { type: integer, nullable: true }
 *                             maxTodos: { type: integer, nullable: true }
 *                             maxEditorImages: { type: integer, nullable: true }
 *                             analytics: { type: boolean }
 *                             csvExport: { type: boolean }
 *                         pro:
 *                           type: object
 *                           properties:
 *                             maxProjects: { type: integer, nullable: true }
 *                             maxTodos: { type: integer, nullable: true }
 *                             maxEditorImages: { type: integer, nullable: true }
 *                             analytics: { type: boolean }
 *                             csvExport: { type: boolean }
 *                     config:
 *                       type: object
 *                       properties:
 *                         free:
 *                           type: object
 *                           properties:
 *                             price: { type: integer }
 *                             currency: { type: string, enum: [EGP, USD] }
 *                             renewalDays: { type: integer }
 *                             emoji: { type: string }
 *                             displayName:
 *                               type: object
 *                               properties:
 *                                 ar: { type: string }
 *                                 en: { type: string }
 *                         trial:
 *                           type: object
 *                           properties:
 *                             price: { type: integer }
 *                             currency: { type: string, enum: [EGP, USD] }
 *                             renewalDays: { type: integer }
 *                             emoji: { type: string }
 *                             displayName:
 *                               type: object
 *                               properties:
 *                                 ar: { type: string }
 *                                 en: { type: string }
 *                         pro:
 *                           type: object
 *                           properties:
 *                             price: { type: integer }
 *                             currency: { type: string, enum: [EGP, USD] }
 *                             renewalDays: { type: integer }
 *                             emoji: { type: string }
 *                             displayName:
 *                               type: object
 *                               properties:
 *                                 ar: { type: string }
 *                                 en: { type: string }
 *                         business:
 *                           type: object
 *                           properties:
 *                             price: { type: integer }
 *                             currency: { type: string, enum: [EGP, USD] }
 *                             renewalDays: { type: integer }
 *                             emoji: { type: string }
 *                             displayName:
 *                               type: object
 *                               properties:
 *                                 ar: { type: string }
 *                                 en: { type: string }
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
import { subscriptionController } from "@/server/modules/subscriptions/subscription.controller";
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";

const wrap = compose(withErrorHandler);

export const GET = wrap(() => subscriptionController.getPlans());
