# Swagger/OpenAPI Documentation Guide

This guide explains how to add and manage API documentation using Swagger/OpenAPI in your Next.js project.

## Quick Start

The Swagger UI is available at: **`/api-docs`**

The OpenAPI spec is served at: **`/api/swagger.json`**

## Current API Routes

Your project currently has the following documented API routes:

- **`GET /api/health`** - Health check endpoint
- **`GET /api/admin/users`** - Get users with filtering and pagination (Admin only)
- **`POST /api/auth/sign-up/email`** - User registration (Better Auth)
- **`POST /api/auth/sign-in/email`** - User login (Better Auth)
- **`POST /api/auth/sign-out`** - User logout
- **`GET /api/auth/get-session`** - Get current session (Better Auth; not `/session`)
- **`POST /api/auth/request-password-reset`** - Request password reset (Better Auth)
- **`POST /api/auth/reset-password`** - Reset password; JSON body `{ "token", "newPassword" }` (Better Auth)
- **`POST /api/auth/change-password`** - Change password (session cookie); JSON body `{ "currentPassword", "newPassword" }`, optional `revokeOtherSessions` (Better Auth)
- **`POST /api/auth/sign-in/social`** - Start OAuth (JSON body `provider`, optional `callbackURL`, …)
- **`GET /api/auth/callback/{provider}`** - OAuth redirect URI (e.g. `callback/github`)
- **`GET /api/projects`**, **`POST /api/projects`** - List and create projects (session auth)
- **`GET /api/projects/{id}`**, **`PUT /api/projects/{id}`**, **`DELETE /api/projects/{id}`** - Project CRUD
- **`PATCH /api/projects/{id}/archive`**, **`PATCH /api/projects/{id}/unarchive`** - Archive toggles

### Projects API notes

- Projects are identified and routed by their primary key **`id`** (`cuid2`).
- Projects support CRUD, archiving/unarchiving, task association, and color key customization.

## How to Add Documentation to Your API Routes

### Basic Structure

Add JSDoc comments with `@swagger` tags to your route files. The documentation must come **before** your route handler functions.

### Example: Simple GET Endpoint

```typescript
/**
 * @swagger
 * /api/hello:
 *   get:
 *     summary: Say hello
 *     description: Returns a hello message
 *     tags:
 *       - Greetings
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hello, World!"
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "Hello, World!" });
}
```

### Example: Endpoint with Parameters

```typescript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *       404:
 *         description: User not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // Your implementation
  return NextResponse.json({ id: params.id, name: "John Doe" });
}
```

### Example: POST with Request Body

```typescript
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
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
 *                 format: email
 *             required:
 *               - name
 *               - email
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *       400:
 *         description: Invalid input
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  // Your implementation
  return NextResponse.json(
    { id: "123", name: body.name, email: body.email },
    { status: 201 },
  );
}
```

### Example: With Authentication

```typescript
/**
 * @swagger
 * /api/protected:
 *   get:
 *     summary: Protected endpoint
 *     tags:
 *       - Protected
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  // Check authorization
  return NextResponse.json({ message: "Protected data" });
}
```

### Example: Query Parameters

```typescript
/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search items
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results limit
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Results offset
 *     responses:
 *       200:
 *         description: Search results
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get("q");
  const limit = searchParams.get("limit") || "10";

  return NextResponse.json({ results: [] });
}
```

## OpenAPI Schema Reference

### Common Response Types

```typescript
/**
 * @swagger
 * /api/example:
 *   get:
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Simple string response"
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

### HTTP Methods

- `get` - Retrieve resources
- `post` - Create resources
- `put` - Update entire resources
- `patch` - Partially update resources
- `delete` - Delete resources

### Parameter Types

```typescript
/**
 * @swagger
 * /api/example:
 *   get:
 *     parameters:
 *       - in: query      # URL query parameter (?foo=bar)
 *         name: foo
 *         schema:
 *           type: string
 *       - in: path       # URL path parameter (/api/:id)
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: header     # HTTP header
 *         name: X-Token
 *         schema:
 *           type: string
 *       - in: cookie     # HTTP cookie
 *         name: sessionId
 *         schema:
 *           type: string
 */
```

### Data Types

```typescript
/**
 * @swagger
 * /api/example:
 *   get:
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stringField:
 *                   type: string
 *                 numberField:
 *                   type: number
 *                 integerField:
 *                   type: integer
 *                 booleanField:
 *                   type: boolean
 *                 dateField:
 *                   type: string
 *                   format: date         # YYYY-MM-DD
 *                 datetimeField:
 *                   type: string
 *                   format: date-time    # ISO 8601
 *                 emailField:
 *                   type: string
 *                   format: email
 *                 uuidField:
 *                   type: string
 *                   format: uuid
 *                 enumField:
 *                   type: string
 *                   enum: [active, inactive, pending]
 *                 arrayField:
 *                   type: array
 *                   items:
 *                     type: string
 *                 objectField:
 *                   type: object
 *                   properties:
 *                     nested:
 *                       type: string
 */
```

## Using Schema References

Define reusable schemas in `src/lib/swagger.ts` and reference them:

```typescript
/**
 * @swagger
 * /api/user:
 *   get:
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

## Adding New Schemas

Edit `src/lib/swagger.ts` to add reusable schemas:

```typescript
components: {
  schemas: {
    User: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string', format: 'email' },
        name: { type: 'string' },
      },
      required: ['id', 'email', 'name'],
    },
    CustomError: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'object' },
      },
    },
  },
}
```

Then reference them:

```typescript
/**
 * @swagger
 * /api/users:
 *   get:
 *     responses:
 *       200:
 *         schema:
 *           $ref: '#/components/schemas/User'
 */
```

## Security Schemes

Set up authentication in docs. Already configured:

- `bearerAuth` - JWT Bearer tokens
- `cookieAuth` - Session cookies

Add to protected endpoints:

```typescript
/**
 * @swagger
 * /api/secure:
 *   get:
 *     security:
 *       - bearerAuth: []
 *       # or
 *       - cookieAuth: []
 */
```

## Testing Your Documentation

1. Start your development server: `pnpm dev`
2. Open: `http://localhost:3000/api-docs`
3. Try endpoints directly from Swagger UI
4. View generated spec: `http://localhost:3000/api/swagger.json`

## Tips & Best Practices

✅ **DO:**

- Document all endpoints
- Use meaningful descriptions
- Include example responses
- Set required fields
- Use status codes (200, 201, 400, 401, 404, 500, etc.)
- Group related endpoints with `tags`
- Use schema references for DRY code

❌ **DON'T:**

- Leave responses without examples
- Skip status codes
- Make all fields required
- Put JSDoc comments inside functions
- Forget to update docs when changing endpoints

## Examples

See these files for complete examples:

- [`src/app/api/health/route.ts`](src/app/api/health/route.ts) - Simple GET
- [`src/app/api/admin/users/route.ts`](src/app/api/admin/users/route.ts) - Query parameters, filtering, and pagination
- [`src/app/api/auth/[...all]/route.ts`](src/app/api/auth/[...all]/route.ts) - Multiple auth endpoints documentation
- [`src/lib/swagger.ts`](src/lib/swagger.ts) - Configuration and schemas

## Useful Links

- [Swagger/OpenAPI 3.0 Guide](https://swagger.io/docs/specification/3-0-0/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.0)
