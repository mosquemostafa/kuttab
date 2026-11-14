/**
 * @swagger
 * /api/admin/coupons:
 *   get:
 *     summary: List coupons (admin)
 *     tags:
 *       - Coupons Admin
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search in code/description
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [gift, discount]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Paginated list of coupons
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
 *   post:
 *     summary: Create coupon (admin)
 *     tags:
 *       - Coupons Admin
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               code:
 *                 type: string
 *                 description: Optional. If omitted, server generates an uppercase code.
 *               description:
 *                 type: string
 *                 nullable: true
 *               type:
 *                 type: string
 *                 enum: [gift, discount]
 *               giftPlan:
 *                 type: string
 *                 enum: [pro]
 *               giftDuration:
 *                 type: integer
 *                 description: In days
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: integer
 *               currency:
 *                 type: string
 *                 enum: [EGP, USD]
 *                 nullable: true
 *               applicablePlans:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [free, trial, pro]
 *                 nullable: true
 *               usageLimit:
 *                 type: integer
 *                 nullable: true
 *               perUserLimit:
 *                 type: integer
 *               startsAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Coupon created
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
 *         description: Conflict - duplicate code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
import { couponController } from "@/server/modules/coupons/coupon.controller";
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";

const wrap = compose(withErrorHandler, withAdmin);

export const GET = wrap((req) => couponController.listAdmin(req));
export const POST = wrap((req) => couponController.createByAdmin(req));
