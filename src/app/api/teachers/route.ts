/**
 * @swagger
 * /api/teachers:
 *   get:
 *     summary: List teachers with pagination and filters (Admin only)
 *     tags:
 *       - Teachers
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search in name, phone, notes
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *         description: Filter by linked user ID
 *       - in: query
 *         name: studentType
 *         schema:
 *           type: string
 *           enum: [foundation, khatimeen, children, adults]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, archived]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, status]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated list of teachers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Teacher'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *                 timestamp: { type: string, format: date-time }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   post:
 *     summary: Create a teacher record (Admin only)
 *     tags:
 *       - Teachers
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               userId: { type: string, nullable: true }
 *               name: { type: string }
 *               phone: { type: string, nullable: true }
 *               studentType:
 *                 type: string
 *                 enum: [foundation, khatimeen, children, adults]
 *                 nullable: true
 *               status: { type: string, enum: [active, archived], default: active }
 *               sallary: { type: integer, nullable: true, minimum: 0 }
 *               notes: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Teacher created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Teacher'
 *                 timestamp: { type: string, format: date-time }
 *       400:
 *         description: Validation error
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
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { teacherController } from "@/server/modules/teachers/teacher.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const GET = wrap((req) => teacherController.list(req));
export const POST = wrap((req) => teacherController.create(req));
