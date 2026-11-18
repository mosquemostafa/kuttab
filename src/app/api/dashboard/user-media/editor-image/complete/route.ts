/**
 * @swagger
 * /api/dashboard/user-media/editor-image/complete:
 *   post:
 *     summary: Complete Cloudflare R2 upload for rich text editor image
 *     tags:
 *       - User Media
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [objectKey]
 *             properties:
 *               objectKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Completed upload with public image URL
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { editorImageController } from "@/server/modules/user-media/editor-image.controller";

const wrap = compose(withErrorHandler, withAuth);

export const POST = wrap((req) => editorImageController.complete(req));
