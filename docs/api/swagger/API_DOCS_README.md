# API Documentation with Swagger/OpenAPI - Quick Reference

## 🚀 Quick Start

**View your API docs:** `http://localhost:3000/api-docs`

**View the OpenAPI spec:** `http://localhost:3000/api/swagger.json`

## 📝 Basic Example

Add this to your API route file (e.g., `src/app/api/users/route.ts`):

```typescript
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 */
export async function GET(req: NextRequest) {
  return NextResponse.json([]);
}

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({}, { status: 201 });
}
```

## 🔧 Common Patterns

### Path Parameters

```typescript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
```

### Query Parameters

```typescript
/**
 * @swagger
 * /api/users:
 *   get:
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 */
```

### Authentication

```typescript
/**
 * @swagger
 * /api/protected:
 *   get:
 *     security:
 *       - bearerAuth: []
 */
```

### Error Responses

```typescript
/**
 * @swagger
 * /api/example:
 *   get:
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found
 *       500:
 *         description: Server Error
 */
```

## 📚 Documentation Files

- **Full Guide:** [SWAGGER_GUIDE.md](SWAGGER_GUIDE.md)
- **Swagger Config:** [src/lib/swagger.ts](src/lib/swagger.ts)
- **Example Routes:**
  - [src/app/api/admin/users/route.ts](src/app/api/admin/users/route.ts) - Admin users endpoint
  - [src/app/api/auth/[...all]/route.ts](src/app/api/auth/[...all]/route.ts) - Auth endpoints

## ✨ Features Included

✅ Swagger UI at `/api-docs`  
✅ OpenAPI JSON spec at `/api/swagger.json`  
✅ JWT Bearer auth documentation  
✅ Cookie auth documentation  
✅ Reusable error schemas  
✅ Full TypeScript support  
✅ Support for all HTTP methods  
✅ Request/response examples

## 🎯 Next Steps

1. Open `http://localhost:3000/api-docs` to see the UI
2. Add `@swagger` JSDoc comments to your route files
3. Watch Swagger UI update automatically
4. Try endpoints directly from Swagger UI

See [SWAGGER_GUIDE.md](SWAGGER_GUIDE.md) for complete documentation.
