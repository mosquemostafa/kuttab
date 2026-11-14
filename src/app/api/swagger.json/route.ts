import { getSwaggerSpec } from "@/server/lib/swagger";
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAdmin } from "@/server/guards/admin.guard";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/swagger.json:
 *   get:
 *     summary: Get OpenAPI specification
 *     description: Returns the OpenAPI/Swagger specification for the API
 *     tags:
 *       - API Documentation
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */

const wrap = compose(withErrorHandler, withAdmin);

export const GET = wrap(async (_req) => NextResponse.json(getSwaggerSpec()));
