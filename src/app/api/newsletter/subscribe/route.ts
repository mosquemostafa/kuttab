/**
 * @swagger
 * /api/newsletter/subscribe:
 *   post:
 *     summary: Subscribe to the newsletter (single opt-in)
 *     tags:
 *       - Newsletter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               locale:
 *                 type: string
 *                 enum: [ar, en]
 *     responses:
 *       201:
 *         description: Subscribed or already active
 *       422:
 *         description: Validation error
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { newsletterController } from "@/server/modules/newsletter/newsletter.controller";

const wrap = compose(withErrorHandler);

export const POST = wrap((req) => newsletterController.subscribe(req));
