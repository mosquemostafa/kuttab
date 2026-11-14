/**
 * @swagger
 * /api/coupons/redeem/gift:
 *   post:
 *     summary: Redeem a gift coupon for current user
 *     tags:
 *       - Subscriptions
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Coupon code
 *     responses:
 *       200:
 *         description: Gift coupon redeemed
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Coupon not found / invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Coupon already redeemed or exhausted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
import { couponController } from "@/server/modules/coupons/coupon.controller";
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";

const wrap = compose(withErrorHandler, withAuth);

export const POST = wrap((req) => couponController.redeemGift(req));
