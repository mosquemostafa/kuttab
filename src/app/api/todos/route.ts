/**
 * @swagger
 * /api/todos:
 *   get:
 *     summary: List todos with pagination and filters
 *     tags:
 *       - Todos
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search in todo title
 *       - in: query
 *         name: projectId
 *         schema: { type: string }
 *         description: Return only todos linked to this project
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, title, priority]
 *       - in: query
 *         name: completed
 *         schema: { type: string, enum: [true, false] }
 *         description: Filter by completion status
 *       - in: query
 *         name: dueFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dueTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: onlyNoDueDate
 *         schema: { type: string, enum: [true, false] }
 *         description: Return only active todos without a due date (inbox)
 *       - in: query
 *         name: onlyOverdue
 *         schema: { type: string, enum: [true, false] }
 *         description: Return only active overdue todos (due date before today)
 *       - in: query
 *         name: currentDate
 *         schema: { type: string, format: date }
 *         description: Use client-local date for overdue comparison instead of server current_date
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated list of todos
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
 *                     $ref: '#/components/schemas/Todo'
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
 *     summary: Create a todo
 *     tags:
 *       - Todos
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               projectId:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 255
 *                 description: Optional project id; omit or null for no project
 *               checklist:
 *                 type: array
 *                 maxItems: 20
 *                 description: Optional embedded steps with completion state
 *                 items:
 *                   type: object
 *                   required: [id, title, isCompleted]
 *                   properties:
 *                     id: { type: string, maxLength: 64 }
 *                     title: { type: string, maxLength: 255 }
 *                     isCompleted: { type: boolean }
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 nullable: true
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Todo created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Todo'
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

import { todoController } from "@/server/modules/todos/todo.controller";
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) => todoController.list(req));
export const POST = wrap((req) => todoController.create(req));
