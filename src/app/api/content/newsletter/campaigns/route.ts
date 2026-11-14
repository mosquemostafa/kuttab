/**
 * @swagger
 * /api/content/newsletter/campaigns:
 *   get:
 *     summary: List newsletter campaigns
 *     description: |
 *       Content manager or admin only.
 *       Rows omit bodyAr and bodyEn (subjects and metadata only) to keep payloads small.
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
 *         description: Paginated campaigns
 *   post:
 *     summary: Create a draft newsletter campaign
 *     tags:
 *       - Content
 *       - Newsletter
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subjectAr, subjectEn, bodyAr, bodyEn]
 *             properties:
 *               subjectAr:
 *                 type: string
 *               subjectEn:
 *                 type: string
 *               bodyAr:
 *                 type: string
 *               bodyEn:
 *                 type: string
 *     responses:
 *       201:
 *         description: Campaign created
 *       503:
 *         description: Newsletter not configured
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withContentManager } from "@/server/guards/content-manager.guard";
import { newsletterController } from "@/server/modules/newsletter/newsletter.controller";

const wrap = compose(withErrorHandler, withContentManager);

export const GET = wrap((req) => newsletterController.listCampaigns(req));
export const POST = wrap((req) => newsletterController.createCampaign(req));
