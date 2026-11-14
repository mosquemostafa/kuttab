# Backend Module Creation Guide for AI Agents

> **Purpose:** This document is the strict specification for implementing new backend modules in the **modawim** codebase. Whenever you are tasked with building a new backend module, you **must** adhere strictly to the architecture, patterns, code style, and file structure detailed below.

---

## 1. Architecture Overview & Principles

Our backend is built on **Next.js App Router** with a **modular N-tier architecture** inspired by NestJS:

```
[Client SDK: src/lib/api/]
         │
         ▼
[Next.js Route Handlers: src/app/api/<resource>/] (Swagger + Middleware Wrapper)
         │
         ▼
[Controller: src/server/modules/<resource>/<resource>.controller.ts] (Validation & Envelope)
         │
         ▼
[Service: src/server/modules/<resource>/<resource>.service.ts] (Business Rules & toDTO)
         │
         ▼
[Repository: src/server/modules/<resource>/<resource>.repository.ts] (Drizzle ORM & Scoped Queries)
         │
         ▼
[Entity: src/server/modules/<resource>/<resource>.entity.ts] (PostgreSQL Schema)
```

### Core Tenets:

1. **Singleton Plain Objects Over Classes:** Controllers, services, and repositories **must be exported as plain object literals** (`export const fooService = { ... }`), NOT instantiated classes. Classes are reserved strictly for custom `HttpException` types.
2. **Strict Multi-Tenancy / Data Isolation:** Every query or mutation that belongs to a user **must require `userId: string`** and filter with `eq(table.userId, userId)`. Never allow a user to read, edit, or delete another user's record.
3. **No Leaking Entities:** Raw Drizzle database rows must **never** be returned from services or controllers. Every service must implement a `toDTO(row)` function returning a typed DTO from `src/shared/types/`.
4. **Standard Envelope:** All successful HTTP responses use the `ok(data, meta?, status?)` helper producing `{ success: true, data, meta?, timestamp }`. Errors are handled via exceptions caught by `withErrorHandler`.
5. **Next.js 15/16 Dynamic Routes:** Route `params` in dynamic routes are Promises. You must always use `resolveRouteParams(ctx)` from `@/server/decorators/compose`.

---

## 2. Complete File Checklist for a New Module

For a new entity named `<entity>` (e.g., `todo` / `todos`):

| #   | File Path                                            | Role                                                                                |
| --- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | `src/server/modules/<plural>/<entity>.entity.ts`     | Drizzle ORM table definition                                                        |
| 2   | `src/server/db/schema.ts`                            | Register table export: `export * from "@/server/modules/<plural>/<entity>.entity";` |
| 3   | `src/server/modules/<plural>/<entity>.dto.ts`        | Zod validation schemas & inferred types                                             |
| 4   | `src/shared/types/<entity>.types.ts`                 | Shared client/server DTO contracts                                                  |
| 5   | `src/server/modules/<plural>/<entity>.repository.ts` | Drizzle database queries, filters, and pagination                                   |
| 6   | `src/server/modules/<plural>/<entity>.service.ts`    | Domain logic, DTO mapping, and exception throwing                                   |
| 7   | `src/server/modules/<plural>/<entity>.controller.ts` | Request parsing, pipe validation, session extraction, standard response             |
| 8   | `src/app/api/<plural>/route.ts`                      | Next.js GET (list) & POST (create) + Swagger JSDoc                                  |
| 9   | `src/app/api/<plural>/[id]/route.ts`                 | Next.js GET (by id), PUT (update), DELETE + Swagger JSDoc                           |
| 10  | `src/lib/api/<plural>.api.ts`                        | Client HTTP methods using `request` / `requestWithMeta`                             |
| 11  | `src/lib/api/api-client.ts`                          | Register `<plural>Api` into the main `apiClient` object                             |

---

## 3. Security, Authentication & User Data Protection Rules

### Rule A: Never Trust `userId` From the Client

- **Zod DTOs (`createItemSchema`, `updateItemSchema`) must NEVER accept a `userId` field.**
- The `userId` must **always** be resolved on the server from the verified session via `getUserId(req)` in the controller.
- This prevents malicious users from creating or spoofing resources under another user's ID.

### Rule B: Strict Resource Ownership Authorization

- Every database query or mutation for a user-owned resource **must require `userId: string`**.
- In the repository:
  - **Listing:** `where(eq(item.userId, userId))`
  - **Reading by ID:** `where(and(eq(item.id, id), eq(item.userId, userId)))`
  - **Updating:** `where(and(eq(item.id, id), eq(item.userId, userId)))`
  - **Deleting:** `where(and(eq(item.id, id), eq(item.userId, userId)))`
- If User A attempts to read/edit/delete User B's record:
  - The query naturally matches **0 rows**.
  - The service throws `NotFoundException` (HTTP 404). This prevents ID enumeration attacks (User A cannot even determine if User B's record ID exists).

### Rule C: Authentication Guards

- Every user-facing route must wrap its handler with `withAuth` from `@/server/guards/auth.guard`.
- `withAuth` verifies the active session with Better Auth using request cookies/headers. If no valid session exists, it immediately throws `UnauthorizedException` (HTTP 401).

### Rule D: Role-Based Access Control (RBAC)

When a module or action is restricted to specific staff or administrative roles:

- Use role-specific guards in `compose(...)`:
  - `withAdmin` (`@/server/guards/admin.guard`) for Admin-only routes.
  - `withContentManager` (`@/server/guards/content-manager.guard`) for Content Manager routes.
  - `withSupportStaff` (`@/server/guards/support-staff.guard`) for Support Staff routes.
- If a user is authenticated but lacks the required role, the guard throws `ForbiddenException` (HTTP 403).

---

## 4. Step-by-Step Implementation Standards

### Step 1: Entity (`<entity>.entity.ts`)

- Use `@paralleldrive/cuid2` for primary keys: `createId()`.
- Reference `user.id` from `@/server/modules/users/user.entity` with `{ onDelete: "cascade" }`.
- Always include `createdAt` and `updatedAt` timestamps.
- Add database indexes for frequently filtered columns (e.g. `(userId, createdAt)`).

```typescript
import { createId } from "@paralleldrive/cuid2";
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "@/server/modules/users/user.entity";

export const item = pgTable(
  "items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("items_user_created_at_idx").on(table.userId, table.createdAt),
  ],
);
```

> **Action:** Ensure this file is exported in `src/server/db/schema.ts`.

---

### Step 2: DTOs (`<entity>.dto.ts`)

- Use Zod schemas with sanitization (`.trim()`, bounds `.min()`, `.max()`).
- Query schemas must coerce strings from query parameters (`z.coerce.number()`, transform strings to booleans).
- Export both schemas and inferred types:

```typescript
import { z } from "zod";

export const createItemSchema = z.object({
  title: z.string().trim().min(1).max(255),
});

export const updateItemSchema = createItemSchema.partial();

export const listItemsQuerySchema = z.object({
  q: z.string().trim().max(255).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateItemDTO = z.infer<typeof createItemSchema>;
export type UpdateItemDTO = z.infer<typeof updateItemSchema>;
export type ListItemsQueryDTO = z.infer<typeof listItemsQuerySchema>;
```

---

### Step 3: Shared Types (`src/shared/types/<entity>.types.ts`)

- Define the client-facing representation.
- Dates should be formatted as ISO `string`.

```typescript
export interface ItemDTO {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### Step 4: Repository (`<entity>.repository.ts`)

- Export a singleton object `itemRepository`.
- Implement `toWhereClause(userId, filters)` to dynamically build `SQL[]`.
- Always query count and paginated items in parallel using `Promise.all`.
- All methods must be scoped by `userId`.

```typescript
import { and, desc, eq, ilike, sql, type SQL } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/server/db";
import { item } from "@/server/modules/items/item.entity";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";

type ItemRow = typeof item.$inferSelect;

function toWhereClause(userId: string, filters: { q?: string }) {
  const clauses: SQL[] = [eq(item.userId, userId)];
  if (filters.q) {
    clauses.push(ilike(item.title, `%${filters.q}%`));
  }
  return and(...clauses);
}

export const itemRepository = {
  async findManyByUserId(
    userId: string,
    filters: { q?: string },
    pagination: ParsedPagination,
  ): Promise<{ items: ItemRow[]; total: number }> {
    const where = toWhereClause(userId, filters);

    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(item)
        .where(where)
        .orderBy(desc(item.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(item)
        .where(where),
    ]);

    return {
      items,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  async findByIdAndUserId(id: string, userId: string): Promise<ItemRow | null> {
    const [found] = await db
      .select()
      .from(item)
      .where(and(eq(item.id, id), eq(item.userId, userId)))
      .limit(1);
    return found ?? null;
  },

  async create(data: { userId: string; title: string }): Promise<ItemRow> {
    const [created] = await db
      .insert(item)
      .values({ id: createId(), ...data })
      .returning();
    return created;
  },

  async update(
    id: string,
    userId: string,
    data: Partial<{ title: string }>,
  ): Promise<ItemRow | null> {
    const [updated] = await db
      .update(item)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(item.id, id), eq(item.userId, userId)))
      .returning();
    return updated ?? null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const deleted = await db
      .delete(item)
      .where(and(eq(item.id, id), eq(item.userId, userId)))
      .returning({ id: item.id });
    return deleted.length > 0;
  },
};
```

---

### Step 5: Service (`<entity>.service.ts`)

- Export a singleton object `itemService`.
- Implement `toDTO(row: ItemRow): ItemDTO`.
- Throw `NotFoundException` from `@/server/exceptions/exceptions` when rows are not found.
- Return `PaginatedResponse<ItemDTO>` from `@/shared/types/pagination.types` on list calls.

```typescript
import { NotFoundException } from "@/server/exceptions/exceptions";
import { itemRepository } from "@/server/modules/items/item.repository";
import type {
  CreateItemDTO,
  UpdateItemDTO,
  ListItemsQueryDTO,
} from "@/server/modules/items/item.dto";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import type { PaginatedResponse } from "@/shared/types/pagination.types";
import type { ItemDTO } from "@/shared/types/item.types";

type ItemRow = NonNullable<
  Awaited<ReturnType<typeof itemRepository.findByIdAndUserId>>
>;

function toDTO(value: ItemRow): ItemDTO {
  return {
    id: value.id,
    userId: value.userId,
    title: value.title,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
  };
}

export const itemService = {
  async listItems(
    userId: string,
    filters: Pick<ListItemsQueryDTO, "q">,
    pagination: ParsedPagination,
  ): Promise<PaginatedResponse<ItemDTO>> {
    const { items, total } = await itemRepository.findManyByUserId(
      userId,
      filters,
      pagination,
    );
    return {
      items: items.map(toDTO),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  },

  async getItemById(userId: string, id: string): Promise<ItemDTO> {
    const found = await itemRepository.findByIdAndUserId(id, userId);
    if (!found) throw new NotFoundException("Item", id);
    return toDTO(found);
  },

  async createItem(userId: string, dto: CreateItemDTO): Promise<ItemDTO> {
    const created = await itemRepository.create({ userId, title: dto.title });
    return toDTO(created);
  },

  async updateItem(
    userId: string,
    id: string,
    dto: UpdateItemDTO,
  ): Promise<ItemDTO> {
    const updated = await itemRepository.update(id, userId, dto);
    if (!updated) throw new NotFoundException("Item", id);
    return toDTO(updated);
  },

  async deleteItem(userId: string, id: string): Promise<void> {
    const deleted = await itemRepository.delete(id, userId);
    if (!deleted) throw new NotFoundException("Item", id);
  },
};
```

---

### Step 6: Controller (`<entity>.controller.ts`)

- Export a singleton object `itemController`.
- Helper `ok<T>(data: T, meta?: PaginationMeta, status = 200): NextResponse<ApiSuccess<T>>`.
- Extract `userId` using `getUserId(req)`.
- Use `validateBody(schema, body)` and `parsePagination(searchParams)`.
- Return HTTP 201 on create, HTTP 204 on delete (`new NextResponse(null, { status: 204 })`).

```typescript
import { NextResponse, type NextRequest } from "next/server";
import {
  createItemSchema,
  listItemsQuerySchema,
  updateItemSchema,
} from "@/server/modules/items/item.dto";
import { validateBody } from "@/server/pipes/validate.pipe";
import { parsePagination } from "@/server/pipes/parse-pagination.pipe";
import { itemService } from "@/server/modules/items/item.service";
import { getUserId } from "@/server/utils/request-user";
import type { ApiSuccess } from "@/shared/types/api-response.types";
import type { PaginationMeta } from "@/shared/types/pagination.types";

function ok<T>(
  data: T,
  meta?: PaginationMeta,
  status = 200,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export const itemController = {
  async list(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const parsedQuery = listItemsQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const pagination = parsePagination(searchParams);
    const userId = getUserId(req);

    const result = await itemService.listItems(
      userId,
      { q: parsedQuery.q },
      pagination,
    );
    return ok(result.items, result.meta);
  },

  async getById(req: NextRequest, id: string): Promise<NextResponse> {
    const userId = getUserId(req);
    const result = await itemService.getItemById(userId, id);
    return ok(result);
  },

  async create(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(createItemSchema, body);
    const userId = getUserId(req);
    const result = await itemService.createItem(userId, input);
    return ok(result, undefined, 201);
  },

  async update(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateItemSchema, body);
    const userId = getUserId(req);
    const result = await itemService.updateItem(userId, id, input);
    return ok(result);
  },

  async delete(req: NextRequest, id: string): Promise<NextResponse> {
    const userId = getUserId(req);
    await itemService.deleteItem(userId, id);
    return new NextResponse(null, { status: 204 });
  },
};
```

---

### Step 7: Next.js API Routes (`src/app/api/<plural>/...`)

#### Collection Route: `src/app/api/<plural>/route.ts`

- Top of file: Comprehensive `@swagger` JSDoc for `GET` and `POST`.
- Middleware composition using `compose(withErrorHandler, withAuth)`.

```typescript
/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: List items with pagination
 *     tags: [Items]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated items
 *   post:
 *     summary: Create an item
 *     tags: [Items]
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
 *               title: { type: string }
 *     responses:
 *       201:
 *         description: Item created
 */

import { itemController } from "@/server/modules/items/item.controller";
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) => itemController.list(req));
export const POST = wrap((req) => itemController.create(req));
```

#### Individual Route: `src/app/api/<plural>/[id]/route.ts`

- Top of file: Comprehensive `@swagger` JSDoc for `GET`, `PUT`, `DELETE`.
- Next.js dynamic context handling with `resolveRouteParams(ctx)`.

```typescript
/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: Get item by ID
 *     tags: [Items]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Item found
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update an item
 *     tags: [Items]
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
 *               title: { type: string }
 *     responses:
 *       200:
 *         description: Item updated
 *   delete:
 *     summary: Delete an item
 *     tags: [Items]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Item deleted
 */

import type { NextRequest } from "next/server";
import { itemController } from "@/server/modules/items/item.controller";
import {
  compose,
  resolveRouteParams,
  type RouteContext,
} from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";

const wrap = compose(withErrorHandler, withAuth);

const getHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return itemController.getById(req, params.id ?? "");
});

const putHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return itemController.update(req, params.id ?? "");
});

const deleteHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  return itemController.delete(req, params.id ?? "");
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
```

---

### Step 8: Client API (`src/lib/api/<plural>.api.ts`)

- Use `request<T>` and `requestWithMeta<T>` from `@/lib/api/api-core`.
- Pass typed DTOs.

```typescript
import type {
  CreateItemDTO,
  ListItemsQueryDTO,
  UpdateItemDTO,
} from "@/server/modules/items/item.dto";
import type { ItemDTO } from "@/shared/types/item.types";
import { request, requestWithMeta } from "@/lib/api/api-core";

export const itemsApi = {
  list: (query?: ListItemsQueryDTO) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<ItemDTO>(
      `/items${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  getById: (id: string) => request<ItemDTO>(`/items/${id}`),
  create: (data: CreateItemDTO) =>
    request<ItemDTO>("/items", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateItemDTO) =>
    request<ItemDTO>(`/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<null>(`/items/${id}`, {
      method: "DELETE",
    }),
};
```

---

### Step 9: Register in `src/lib/api/api-client.ts`

1. Import `itemsApi` from `@/lib/api/items.api`.
2. Add `items: itemsApi` to the exported `apiClient` object.

---

## 5. Prompt Template for the AI Agent

Copy and paste the template below to instruct the AI agent to build the new module:

```markdown
You are building a new backend module for the modawim codebase.
Follow the rules and patterns specified in `docs/BACKEND_MODULE_GUIDE.md`.

Here is the database schema and specifications for the new module:
<PASTE YOUR SCHEMA / ENTITY DETAILS HERE>

Requirements:

1. Create the server entity under `src/server/modules/<module-name>/<entity>.entity.ts` and export it in `src/server/db/schema.ts`.
2. Create Zod schemas and inferred DTOs under `src/server/modules/<module-name>/<entity>.dto.ts` (ensure `userId` is never accepted in request bodies).
3. Create client-facing types under `src/shared/types/<entity>.types.ts`.
4. Create the repository under `src/server/modules/<module-name>/<entity>.repository.ts` ensuring all queries enforce strict user data isolation via `userId` on every read, update, and delete.
5. Create the service under `src/server/modules/<module-name>/<entity>.service.ts` with `toDTO()` mapping and `NotFoundException`.
6. Create the controller under `src/server/modules/<module-name>/<entity>.controller.ts` with `getUserId(req)` and standard `ok()` envelope.
7. Create the Next.js API route handlers with `compose(withErrorHandler, withAuth)` (or appropriate role guard):
   - `src/app/api/<plural>/route.ts` (GET list, POST create) with complete OpenAPI `@swagger` annotations.
   - `src/app/api/<plural>/[id]/route.ts` (GET by id, PUT update, DELETE) with `resolveRouteParams` and `@swagger` annotations.
8. Create client SDK in `src/lib/api/<plural>.api.ts` using `request` and `requestWithMeta`.
9. Register the new client in `src/lib/api/api-client.ts`.
10. Ensure no class instances are used for services/repositories/controllers (use object literals).
```
