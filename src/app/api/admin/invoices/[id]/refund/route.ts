/**
 * @swagger
 * /api/admin/invoices/{id}/refund:
 *   patch:
 *     summary: Manually refund an invoice (admin)
 *     description: Refunds an invoice amount, optionally revokes subscription access by setting expiry to now, and records a payment_refunded event.
 *     tags:
 *       - Subscriptions Admin
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refundedAmount
 *               - reason
 *               - revokeAccess
 *             properties:
 *               refundedAmount:
 *                 type: integer
 *                 minimum: 1
 *               reason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *               revokeAccess:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Invoice refunded successfully
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
 *                     refunded:
 *                       type: boolean
 *                       example: true
 *                     invoiceId:
 *                       type: string
 *                     invoiceStatus:
 *                       type: string
 *                       enum: [refunded, partially_refunded]
 *                     refundedAmount:
 *                       type: integer
 *                     refundReason:
 *                       type: string
 *                     revokeAccess:
 *                       type: boolean
 *                     accessRevoked:
 *                       type: boolean
 *                     eventId:
 *                       type: string
 *                       nullable: true
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
 *       404:
 *         description: Invoice not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       422:
 *         description: Refund amount exceeds allowed invoice amount
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
import type { NextRequest } from "next/server";

import { subscriptionController } from "@/server/modules/subscriptions/subscription.controller";
import { compose, resolveRouteParams } from "@/server/decorators/compose";
import type { RouteContext } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";

const wrap = compose(withErrorHandler, withAdmin);

const patchHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return subscriptionController.refundInvoiceByAdmin(req, params.id ?? "");
});

export const PATCH = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => patchHandler(req, ctx);
