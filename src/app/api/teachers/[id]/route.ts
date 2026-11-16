/**
 * @swagger
 * /api/teachers/{id}:
 *   get:
 *     summary: Get teacher by ID (Admin only)
 *     tags:
 *       - Teachers
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Teacher found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Teacher'
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
 *       404:
 *         description: Teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   put:
 *     summary: Update teacher by ID (Admin only)
 *     tags:
 *       - Teachers
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string, nullable: true }
 *               name: { type: string }
 *               phone: { type: string, nullable: true }
 *               studentType:
 *                 type: string
 *                 enum: [foundation, khatimeen, children, adults]
 *                 nullable: true
 *               status: { type: string, enum: [active, archived] }
 *               notes: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Teacher updated successfully
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
 *       404:
 *         description: Teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Delete teacher by ID (Admin only)
 *     tags:
 *       - Teachers
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Teacher deleted successfully
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
 *       404:
 *         description: Teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

import type { NextRequest } from "next/server";

import {
  compose,
  resolveRouteParams,
  type RouteContext,
} from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { teacherController } from "@/server/modules/teachers/teacher.controller";

const wrap = compose(withErrorHandler, withAdmin);

const getHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return teacherController.getById(req, params.id ?? "");
});

const putHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return teacherController.update(req, params.id ?? "");
});

const deleteHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return teacherController.delete(req, params.id ?? "");
});

export const GET = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => getHandler(req, ctx);

export const PUT = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => putHandler(req, ctx);

export const DELETE = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => deleteHandler(req, ctx);
