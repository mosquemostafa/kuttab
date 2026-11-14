/**
 * @swagger
 * /api/subscription/invoices:
 *   get:
 *     summary: List current user invoices
 *     tags:
 *       - Subscriptions
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Current user invoices ordered by newest first
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       subscriptionId: { type: string }
 *                       amount: { type: integer }
 *                       currency:
 *                         type: string
 *                         enum: [EGP, USD]
 *                       status:
 *                         type: string
 *                         enum: [paid, pending, failed, refunded, partially_refunded]
 *                       refundedAmount: { type: integer, nullable: true }
 *                       paymentMethod:
 *                         type: string
 *                         enum: [gateway, bank_transfer, vodafone_cash, instapay, complimentary, fix]
 *                       gateway:
 *                         type: string
 *                         enum: [paymob, kashier]
 *                         nullable: true
 *                       gatewayPaymentId: { type: string, nullable: true }
 *                       paymentReference: { type: string, nullable: true }
 *                       periodStart:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       periodEnd:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       paidAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
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
  subscriptionController.getCurrentInvoices(req),
);
