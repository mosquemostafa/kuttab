/**
 * @swagger
 * /api/content/newsletter/subscribers:
 *   get:
 *     summary: List newsletter subscribers
 *     description: Content manager or admin only.
 *     tags:
 *       - Content
 *       - Newsletter
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated subscribers
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withContentManager } from "@/server/guards/content-manager.guard";
import { newsletterController } from "@/server/modules/newsletter/newsletter.controller";

const wrap = compose(withErrorHandler, withContentManager);

export const GET = wrap((req) => newsletterController.listSubscribers(req));
