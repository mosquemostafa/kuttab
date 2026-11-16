/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: List classes with pagination and filters (Admin only)
 *     tags:
 *       - Classes
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search in class name
 *       - in: query
 *         name: primaryTeacherId
 *         schema: { type: string }
 *         description: Filter by primary teacher ID
 *       - in: query
 *         name: secondaryTeacherId
 *         schema: { type: string }
 *         description: Filter by secondary teacher ID
 *       - in: query
 *         name: teacherId
 *         schema: { type: string }
 *         description: Filter by either primary or secondary teacher ID
 *       - in: query
 *         name: classType
 *         schema:
 *           type: string
 *           enum: [group, individual]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, classType]
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
 *         description: Paginated list of classes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
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
 *     summary: Create a class record (Admin only)
 *     tags:
 *       - Classes
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
 *               name: { type: string }
 *               primaryTeacherId: { type: string, nullable: true }
 *               secondaryTeacherId: { type: string, nullable: true }
 *               classType:
 *                 type: string
 *                 enum: [group, individual]
 *                 default: group
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Class'
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
import { classController } from "@/server/modules/classes/class.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const GET = wrap((req) => classController.list(req));
export const POST = wrap((req) => classController.create(req));
