/**
 * @swagger
 * /api/dashboard/user-media/editor-image/presign:
 *   post:
 *     summary: Presign Cloudflare R2 upload URL for rich text editor image
 *     tags:
 *       - UserMedia
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contentType, fileSize]
 *             properties:
 *               contentType:
 *                 type: string
 *                 enum: [image/jpeg, image/png, image/webp, image/jpg, image/avif]
 *               fileSize:
 *                 type: integer
 *                 maximum: 5242880
 *     responses:
 *       200:
 *         description: Presigned upload details
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { editorImageController } from "@/server/modules/user-media/editor-image.controller";

const wrap = compose(withErrorHandler, withAuth);

export const POST = wrap((req) => editorImageController.presign(req));
