# Almostafa Architecture

This document describes the current modular, feature-first backend architecture.

## 1. Architecture Goals

- Keep transport concerns (HTTP, route context, status codes) separate from business logic.
- Organize backend code by feature module (auth, users, app-settings, etc.) instead of by technical layer only.
- Centralize domain rules in services.
- Keep database access inside repositories.
- Standardize API success/error payloads.
- Use server-side auth APIs for server operations that require request headers/session context.

## 1.1 Module-First Backend Structure

- Each backend feature owns its related files under `src/server/modules/<feature>/`.
- Typical module contents: controller, service, repository, DTOs, and feature-specific entities/types.
- Cross-cutting/shared concerns stay outside modules (guards, decorators, pipes, exceptions, shared repositories, shared controllers).

## 2. High-Level Layers

### 2.1 Route Layer (Next.js Route Handlers)

Location: `src/app/api/**/route.ts`

Responsibilities:

- Expose HTTP endpoints.
- Compose wrappers for auth and error handling.
- Delegate to controllers.
- Resolve dynamic route params using `resolveRouteParams` for Next.js 16 compatibility.

Examples:

- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/ban/route.ts`
- `src/app/api/health/route.ts`

### 2.2 Decorators and Guards

Location: `src/server/decorators/*`, `src/server/guards/*`

Responsibilities:

- `withErrorHandler`: catches and normalizes exceptions.
- `withAdmin`: validates authenticated admin session.
- `compose`: applies wrappers right-to-left around route handlers.
- `resolveRouteParams`: resolves promise-or-object params in dynamic routes.

Core files:

- `src/server/decorators/compose.ts`
- `src/server/decorators/with-error-handler.ts`
- `src/server/guards/admin.guard.ts`

### 2.3 Controller Layer

Location: `src/server/modules/*/*.controller.ts` (feature controllers) and `src/server/controllers/*` (shared/global controllers)

Responsibilities:

- Parse request inputs.
- Validate payloads/query values through pipes and schemas.
- Call services.
- Return normalized `ApiSuccess` JSON responses.

Controllers:

- `modules/users/user.controller.ts`: admin user listing with pagination/filter parsing.
- `modules/users/admin-user.controller.ts`: admin mutations (create/role/ban/unban/delete/revoke sessions).
- `modules/dashboard-settings/dashboard-settings.controller.ts`: authenticated dashboard settings bootstrap.
- `controllers/health.controller.ts`: health checks.

### 2.4 Service Layer

Location: `src/server/modules/*/*.service.ts`

Responsibilities:

- Business rules and orchestration.
- Coordination with repositories and Better Auth server APIs.
- DTO shaping for outgoing API data.

Services:

- `modules/users/user.service.ts`: user admin operations, profile settings operations, linked-account behavior.
- `modules/auth/auth.service.ts`: register/login/password reset workflows used by auth server actions.
- `modules/app-settings/app-settings.service.ts`: app registration/security setting defaults, reads, and updates.

Email delivery adapter:

- `src/server/lib/auth-email.ts`: Resend-backed sender for auth emails (verification + password reset), with a safe Gmail SMTP fallback when Resend is not configured.
- `src/server/lib/email.ts`: Nodemailer Gmail SMTP transport for transactional emails (support/feedback confirmations) and localized HTML/text templates reused by auth.

### 2.5 Repository Layer

Location: `src/server/modules/*/*.repository.ts` and `src/server/repositories/*` (shared repositories)

Responsibilities:

- Encapsulate direct database reads/writes (Drizzle).
- Return persistence-centric entities/rows to services.

Repositories:

- `modules/users/user.repository.ts`: user lookups/list expansion (accounts, sessions), email verification updates.
- `modules/app-settings/app-settings.repository.ts`: single-row default settings CRUD.

### 2.6 Shared Contracts and Supporting Modules

Locations:

- `src/server/modules/**/dto/**`: module-local API input DTOs and validation schemas.
- `src/shared/types/**`: API response, pagination, and user contract types.
- `src/server/exceptions/**`: typed exceptions and centralized exception-to-response mapping.
- `src/server/pipes/**`: validation and pagination parsing helpers.

## 3. Request and Action Flows

### 3.1 Admin API Flow (Route -> Guard -> Controller -> Service -> Repository/Auth API)

Example endpoint family: `src/app/api/admin/users/**`

1. Route handler composes `withErrorHandler` + `withAdmin`.
2. Dynamic route handlers resolve params through `resolveRouteParams`.
3. Controller validates request body via DTO schema.
4. Service executes domain operation.
5. Service either:
   - Calls Better Auth server API methods using forwarded request headers, or
   - Uses repositories for DB-backed reads/updates.
6. Controller returns normalized success response; exceptions are transformed by `handleException`.

### 3.2 Authentication Action Flow (Server Action -> Auth Service)

Server actions in:

- `src/app/[locale]/auth/register/action.ts`
- `src/app/[locale]/auth/login/action.ts`
- `src/app/[locale]/auth/forgot-password/action.ts`
- `src/app/[locale]/auth/reset-password/action.ts`

Flow:

1. Action validates form input.
2. Delegates to `authService`.
3. Maps API/service errors into UI-friendly `ActionResult`.

### 3.3 Admin Settings Action Flow (Server Action -> App Settings Service -> Repository)

File: `src/app/[locale]/(dashboards)/admin/settings/action.ts`

Flow:

1. Action resolves session and verifies admin role.
2. Calls `appSettingsService.updateSettings`.
3. Service resolves defaults and delegates persistence to `appSettingsRepository`.
4. Action returns normalized `ActionResult`.

### 3.4 Dashboard Settings Action Flow (Server Action -> User Service)

File: `src/app/[locale]/(dashboards)/dashboard/settings/action.ts`

Flow:

1. Action resolves current session.
2. Delegates profile/password/linking operations to `userService`.
3. Service performs Better Auth API operations and linked-account logic.

Note: This flow is functionally correct and aligned with service usage, while session-fetching boilerplate is still repeated at action level.

### 3.5 Dashboard Settings Bootstrap API Flow (Route -> Guard -> Controller -> Service -> Repository)

Files:

- `src/app/api/dashboard/settings/route.ts`
- `src/server/modules/dashboard-settings/dashboard-settings.controller.ts`

Flow:

1. Route composes `withErrorHandler` + `withAuth`.
2. Controller reads authenticated user ID from request session context.
3. Service builds dashboard settings bootstrap DTO.
4. Repository provides profile fields from persistence; service combines with auth/account capability checks.
5. Controller returns normalized `ApiSuccess` response.

## 4. Authentication Boundaries

- Entry point: `src/app/api/auth/[...all]/route.ts`.
- Server-side operations use Better Auth server API with forwarded request headers when acting on behalf of the current user/admin context.
- Admin-only API endpoints enforce role check via `withAdmin` guard.
- Outbound auth emails (verification/reset password) are sent through `src/server/lib/auth-email.ts` via Resend (falling back to Gmail SMTP when Resend is not configured).
- Better Auth instance and Drizzle adapter live in `src/server/lib/auth.ts`.

## 5. Error Handling Strategy

### 5.1 Typed Exceptions

Location: `src/server/exceptions/exceptions.ts`

Current typed exceptions include:

- `UnauthorizedException`
- `ForbiddenException`
- `NotFoundException`
- `ValidationException`
- `ConflictException`

### 5.2 Unified Exception Mapping

Location: `src/server/exceptions/exception-handler.ts`

`handleException` maps:

- `HttpException` subclasses to structured API errors.
- `ZodError` to validation errors.
- Unknown errors to internal server error responses.

## 6. API Contracts and Documentation

- OpenAPI generator config: `src/server/lib/swagger.ts`
- Spec endpoint: `src/app/api/swagger.json/route.ts`
- Swagger UI page: `src/app/api-docs/page.tsx`
- Route-level JSDoc annotations exist on admin/auth/health/dashboard endpoints.

Standard response model:

- Success: `ApiSuccess<T>` with `{ success: true, data, meta?, timestamp }`
- Error: `ApiError` with `{ success: false, error: { code, message, details? }, timestamp }`

## 7. Data Layer

- Drizzle client: `src/server/db/index.ts`
- Primary schema file: `src/server/db/schema.ts`

Key tables:

- `app_settings`
- `user`
- `session`
- `account`
- `verification`

Migrations are tracked in `drizzle/`; `drizzle.config.ts` references `./src/server/db/schema.ts`.

## 8. Frontend Data Access Boundaries

- Client-side admin user mutations/listing are performed through HTTP calls in `src/lib/api-client.ts` to `/api/admin/users/*`.
- Server actions call service methods directly for server-only workflows.
- App UI components stay focused on rendering and user interaction.

### Rate limiting

Public auth and newsletter entry points use **Upstash `@upstash/ratelimit`** with the same Redis REST credentials as caching. Limits are applied in **`src/server/lib/auth.ts`** (`hooks.before` for direct HTTP to sensitive Better Auth paths), **auth server actions**, and **`newsletterController.subscribe`** (IP + email). Details, algorithms, and how to extend: [docs/rate-limiting/rate-limiting.md](docs/rate-limiting/rate-limiting.md).

## 9. Directory Map

```
src/
	app/
		api/                       # route handlers (transport layer)
		[locale]/auth/*/action.ts  # auth server actions (i18n routes)
		[locale]/(dashboards)/admin/settings/action.ts
		[locale]/(dashboards)/dashboard/settings/action.ts
	lib/                           # shared client + isomorphic helpers (api-client, auth-client, utils, schemas)
	server/
		db/                        # Drizzle client (index.ts) + schema.ts
		lib/                       # server-only: env validation, Better Auth, email, Swagger spec
		modules/                   # feature modules (controller/service/repository/dto)
		controllers/               # shared/global controllers
		repositories/              # shared repositories
		guards/                    # auth/role route guards
		decorators/                # route wrappers/composition
		pipes/                     # parsing/validation helpers
		exceptions/                # typed exceptions + mapper
	shared/
		types/                     # API and domain contracts
```

**`src/lib` vs `src/server/lib`:** Use `src/lib` for code that must run in the browser or is imported from client components (HTTP client, Better Auth client, `cn`, Zod schemas used in forms). Use `src/server/lib` for Node-only concerns: validated `env`, `auth` (Better Auth server), Nodemailer, and OpenAPI generation config.

## 10. Implementing New Features

Use this sequence for new API capabilities:

1. Add request DTO/schema in the target module.
2. Add/extend module repository methods if DB access is required.
3. Add business logic in the module service.
4. Expose module controller method for input validation + response shape.
5. Add route handler using `compose(withErrorHandler, withAdmin?)`.
6. Add Swagger JSDoc to the route.
7. Update client adapters (`api-client` or server actions) as needed.

Rules:

- Do not call the database directly from route handlers or UI/server-action layers.
- Keep transport-specific logic out of services.
- Prefer typed exceptions over generic `Error` for domain/auth failures.
