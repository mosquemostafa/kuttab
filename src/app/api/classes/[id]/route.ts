/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Get class by ID (Admin only)
 *     tags:
 *       - Classes
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Class found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Class'
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
 *         description: Class not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   put:
 *     summary: Update class by ID (Admin only)
 *     tags:
 *       - Classes
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
 *               name: { type: string }
 *               primaryTeacherId: { type: string, nullable: true }
 *               secondaryTeacherId: { type: string, nullable: true }
 *               classType:
 *                 type: string
 *                 enum: [group, individual]
 *     responses:
 *       200:
 *         description: Class updated successfully
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
 *       404:
 *         description: Class not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Delete class by ID (Admin only)
 *     tags:
 *       - Classes
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Class deleted successfully
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
 *         description: Class not found
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
import { classController } from "@/server/modules/classes/class.controller";

const wrap = compose(withErrorHandler, withAdmin);

const getHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return classController.getById(req, params.id ?? "");
});

const putHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return classController.update(req, params.id ?? "");
});

const deleteHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return classController.delete(req, params.id ?? "");
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
