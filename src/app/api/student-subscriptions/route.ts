/**
 * @swagger
 * /api/student-subscriptions:
 *   get:
 *     summary: List student subscriptions with pagination and filters (Admin only)
 *     tags: [Student Subscriptions]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [exempt_poor, installments, exempt_staff_kids, special, monthly, yearly, sponsored]
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: minAmount
 *         schema: { type: integer, minimum: 0 }
 *       - in: query
 *         name: maxAmount
 *         schema: { type: integer, minimum: 0 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [date, amount, createdAt] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated list of student subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudentSubscription'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *                 timestamp: { type: string, format: date-time }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *   post:
 *     summary: Create a student subscription (Admin only)
 *     tags: [Student Subscriptions]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, amount, date, type]
 *             properties:
 *               studentId: { type: string }
 *               amount: { type: integer, minimum: 0 }
 *               date: { type: string, format: date }
 *               type:
 *                 type: string
 *                 enum: [exempt_poor, installments, exempt_staff_kids, special, monthly, yearly, sponsored]
 *     responses:
 *       201:
 *         description: Student subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/StudentSubscription'
 *                 timestamp: { type: string, format: date-time }
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Student not found
 */

import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { studentSubscriptionController } from "@/server/modules/student-subscriptions/student-subscription.controller";

const wrap = compose(withErrorHandler, withAdmin);

export const GET = wrap((req) => studentSubscriptionController.list(req));
export const POST = wrap((req) => studentSubscriptionController.create(req));
