/**
 * @swagger
 * /api/feedbacks:
 *   get:
 *     summary: List current user's feedback entries
 *     description: |
 *       Paginated feedback for the signed-in user only (all roles).
 *       For the full queue, use GET /api/support/staff/feedbacks (admin/support).
 *     tags:
 *       - Feedbacks
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, reviewed, closed]
 *         description: Filter by feedback status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [suggestion, complaint]
 *         description: Filter by feedback type
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort by created date direction
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated feedback list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       userId: { type: string }
 *                       userEmail:
 *                         type: string
 *                         format: email
 *                         nullable: true
 *                       type:
 *                         type: string
 *                         enum: [suggestion, complaint]
 *                       subject: { type: string }
 *                       description: { type: string }
 *                       status:
 *                         type: string
 *                         enum: [new, reviewed, closed]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   post:
 *     summary: Create feedback entry
 *     tags:
 *       - Feedbacks
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, subject, description]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [suggestion, complaint]
 *               subject:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 20000
 *     responses:
 *       201:
 *         description: Feedback created
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
 *                     id: { type: string }
 *                     userId: { type: string }
 *                     type:
 *                       type: string
 *                       enum: [suggestion, complaint]
 *                     subject: { type: string }
 *                     description: { type: string }
 *                     status:
 *                       type: string
 *                       enum: [new, reviewed, closed]
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { feedbackController } from "@/server/modules/feedbacks/feedback.controller";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) => feedbackController.list(req));
export const POST = wrap((req) => feedbackController.create(req));
