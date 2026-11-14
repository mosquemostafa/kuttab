/**
 * @swagger
 * /api/admin/segments:
 *   get:
 *     summary: List segments with pagination
 *     tags:
 *       - Admin
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by segment name or emoji
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
 *     responses:
 *       200:
 *         description: Paginated list of segments
 *   post:
 *     summary: Create a segment
 *     tags:
 *       - Admin
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, emoji]
 *             properties:
 *               name:
 *                 type: string
 *               emoji:
 *                 type: string
 *     responses:
 *       201:
 *         description: Segment created
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { segmentController } from "@/server/modules/segments/segment.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const GET = wrap((req) => segmentController.list(req));
export const POST = wrap((req) => segmentController.create(req));
