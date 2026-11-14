/**
 * @swagger
 * /api/newsletter/unsubscribe:
 *   post:
 *     summary: Confirm newsletter unsubscribe (POST only — use confirm page first)
 *     tags:
 *       - Newsletter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Unsubscribed
 *       404:
 *         description: Invalid token
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { newsletterController } from "@/server/modules/newsletter/newsletter.controller";

const wrap = compose(withErrorHandler);

export const POST = wrap((req) => newsletterController.unsubscribePost(req));
