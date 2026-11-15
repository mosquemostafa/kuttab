/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: List students with pagination and filters (Admin only)
 *     tags:
 *       - Students
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search in name, phone, grade, job, notes
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *         description: Filter by linked user ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, archived, rejected]
 *       - in: query
 *         name: studiedTajweed
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: previouslyEnrolled
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: minMemorizedParts
 *         schema: { type: integer, minimum: 0, maximum: 30 }
 *       - in: query
 *         name: maxMemorizedParts
 *         schema: { type: integer, minimum: 0, maximum: 30 }
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, registrationDate, memorizedPartsCount]
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
 *         description: Paginated list of students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
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
 *     summary: Create a student record (Admin only)
 *     tags:
 *       - Students
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
 *               birthDate: { type: string, format: date, nullable: true }
 *               grade: { type: string, nullable: true }
 *               job: { type: string, nullable: true }
 *               phone: { type: string, nullable: true }
 *               studiedTajweed: { type: boolean, default: false }
 *               previouslyEnrolled: { type: boolean, default: false }
 *               previousEnrolledPlace: { type: string, nullable: true }
 *               memorizedPartsCount: { type: integer, minimum: 0, maximum: 30, default: 0 }
 *               memorizationDetails: { type: string, nullable: true }
 *               status: { type: string, enum: [active, archived, rejected], default: active }
 *               registrationDate: { type: string, format: date }
 *               notes: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Student created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Student'
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
import { studentController } from "@/server/modules/students/student.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const GET = wrap((req) => studentController.list(req));
export const POST = wrap((req) => studentController.create(req));
