/**
 * @swagger
 * /api/admin/subscriptions/activate:
 *   post:
 *     summary: Manually activate a subscription for a user (admin)
 *     tags:
 *       - Subscriptions Admin
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - plan
 *               - paymentMethod
 *             properties:
 *               userId:
 *                 type: string
 *               plan:
 *                 type: string
 *                 enum: [pro, business]
 *               autoRenew:
 *                 type: boolean
 *                 default: false
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *               paymentMethod:
 *                 type: string
 *                 enum: [gateway, bank_transfer, vodafone_cash, instapay, complimentary, fix]
 *               paymentReference:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *               # amount/status/paidAt are server-derived:
 *               # - amount from PLAN_CONFIG for selected plan
 *               # - currency is always EGP for manual operations
 *               # - status is always paid
 *               # - paidAt is current server timestamp
 *     responses:
 *       201:
 *         description: Subscription activated and all related records created
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
 *                     activated: { type: boolean, example: true }
 *                     subscriptionId: { type: string }
 *                     eventId: { type: string, nullable: true }
 *                     invoiceId: { type: string, nullable: true }
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Conflict - user already has a subscription row
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
import { subscriptionController } from "@/server/modules/subscriptions/subscription.controller";
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";

const wrap = compose(withErrorHandler, withAdmin);

export const POST = wrap((req) => subscriptionController.activateByAdmin(req));
