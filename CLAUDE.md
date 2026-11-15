# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Almostafa is an Islamic institute and educational platform for teaching the Holy Quran with multilingual support (Arabic RTL and English LTR). It uses a modern tech stack: Next.js 16, React 19, PostgreSQL + Drizzle ORM, and Better Auth for authentication. The codebase follows a strict modular, feature-first backend architecture.

Read `ARCHITECTURE.md` for comprehensive architectural details. The README also provides local setup instructions, deployment info, and a full command reference.

## Quick Setup

1. **Install dependencies:** `pnpm install`
2. **Configure env:** Copy `.env.example` to `.env` and set `DATABASE_URL` (use Neon for hosted Postgres or Docker Compose for local). Set Better Auth and Gmail credentials as needed.
3. **Database migrations:** `pnpm db:migrate` (or `pnpm db:migrate:local` for Docker-based dev)
4. **Start dev server:** `pnpm dev` (uses Turbopack) → http://localhost:3000

Optional Docker stack (PostgreSQL + Upstash-compatible Redis):

- `pnpm docker:up` / `pnpm docker:down` / `pnpm docker:logs`

## Available Scripts

**Development & Build:**

- `pnpm dev` — Start dev server with Turbopack
- `pnpm build` — Build production bundle (uses webpack)
- `pnpm start` — Start production server
- `pnpm typecheck` — Run TypeScript type checking (fast way to catch errors before commits)

**Testing:**

- `pnpm test:e2e` — Full Playwright test suite
- `pnpm test:smoke` — Run only @smoke-tagged tests (Chromium)
- `pnpm test:smoke:headed` — Same as smoke, with browser visible (for local debugging)

See `docs/testing.md` for full E2E setup, env vars, and extending tests.

**Database:**

- `pnpm db:generate` — Generate new Drizzle migrations after schema changes
- `pnpm db:migrate:local` / `pnpm db:migrate:test` / `pnpm db:migrate:prod` — Apply pending migrations to specific database target
- `pnpm db:push:local` / `pnpm db:push:test` — Push schema changes directly (forbidden on prod)
- `pnpm db:studio:local` / `pnpm db:studio:test` / `pnpm db:studio:prod` — Open Drizzle Studio UI for specific database target
- `pnpm db:squash` — Consolidate past migrations into a single clean baseline migration
- `pnpm db:reset:local` / `pnpm db:reset:test` — Drop and recreate schema, then migrate fresh
- `pnpm db:baseline:mark:prod` / `local` / `test` — Mark baseline migration as applied on an existing database

**Code Quality:**

- `pnpm lint` — Run ESLint
- `pnpm format` — Format with Prettier
- `pnpm check:deps` — Check for unused dependencies (knip)
- `pnpm check:i18n` — Validate i18n translator aliases
- `pnpm check:guidelines` — Lint code guidelines

## Architecture at a Glance

**Backend structure (strict layering):**

```
src/server/
├── modules/                    # Feature modules (auth, users, todos, projects, habits, etc.)
│   └── <feature>/
│       ├── *.controller.ts     # Input validation & response shaping
│       ├── *.service.ts        # Business logic & orchestration
│       ├── *.repository.ts     # Database access (Drizzle)
│       └── dto/                # Request DTOs & Zod schemas
├── lib/                        # Server-only: env, Better Auth, email, Swagger
├── db/                         # Drizzle client & schema.ts
├── guards/                     # Route guards (auth, admin)
├── decorators/                 # Wrappers (withErrorHandler, compose, etc.)
├── pipes/                      # Parsing & validation helpers
├── repositories/               # Shared data access
├── controllers/                # Shared/global controllers
└── exceptions/                 # Typed exceptions & handler
```

**Request flow (typical API endpoint):**

1. Route handler (`src/app/api/**/route.ts`) wraps logic with `compose(withErrorHandler, withAdmin?)`
2. Guard (`withAdmin`) validates session/role
3. Controller parses & validates request via Zod schema
4. Service executes business logic, calls repositories or Better Auth APIs
5. Exception handler normalizes errors to `ApiError` responses
6. Controller returns `ApiSuccess<T>` response

**Frontend structure:**

```
src/
├── app/                        # Pages, layouts, and route handlers
├── components/                 # Reusable UI (buttons, forms, cards, etc.)
├── hooks/                      # Custom React hooks
├── lib/                        # Client & isomorphic helpers (api-client, auth, utils, schemas)
├── messages/                   # Translation files (ar/en)
└── i18n/                       # Localization & routing config
```

## Adding New Backend Features

Follow this sequence for new API endpoints:

1. **Create DTO & schema** in `src/server/modules/<feature>/dto/`
   - Export a Zod schema (e.g., `createTodoSchema`)
   - Map it to TypeScript types for type safety

2. **Add repository methods** in `src/server/modules/<feature>/<feature>.repository.ts`
   - Encapsulate Drizzle queries
   - Return persistence-centric rows, not DTOs

3. **Add service logic** in `src/server/modules/<feature>/<feature>.service.ts`
   - Call repositories for data access
   - Call Better Auth server APIs for auth operations
   - Map entities to DTOs for outgoing API responses
   - Throw typed exceptions for domain/auth errors

4. **Add controller** in `src/server/modules/<feature>/<feature>.controller.ts`
   - Receive request (parsed/validated by route handler)
   - Call service
   - Return `ApiSuccess<T>` response or let exceptions flow to handler

5. **Add route handler** in `src/app/api/<path>/route.ts`
   - Use `compose(withErrorHandler, withAdmin?)` to wrap handler
   - Resolve dynamic params via `resolveRouteParams`
   - Parse request body/query and delegate to controller
   - Swagger JSDoc annotations document endpoint (method, description, parameters, responses)

6. **Add client adapter**
   - For HTTP: add fetch wrapper in `src/lib/api-client.ts`
   - For server actions: create server action in route or shared location

**Typed exceptions** (`src/server/exceptions/exceptions.ts`):

- Use domain-specific exceptions: `NotFoundException`, `ValidationException`, `ConflictException`, etc.
- Mapped to HTTP status and error code via `handleException`
- Never expose internal stack traces to clients

## Key Modules & Features

- **auth**: Better Auth integration, register/login/password-reset workflows (server actions + API)
- **users**: User admin operations, profile settings (sessions, profile)
- **todos**: Task CRUD, filtering, pagination, categories
- **projects**: Project lifecycle, archive/restore, per-user slug uniqueness
- **habits**: Habit tracking, completions, analytics
- **app-settings**: Global app configuration (registration open/closed, security settings)
- **dashboard-settings**: Per-user settings (profile, security, linked accounts)
- **support-tickets** & **feedbacks**: Support/feedback submission, admin workflows
- **announcements** & **segments**: Marketing announcements with audience segmentation

Database: PostgreSQL with Drizzle ORM. Migrations in `drizzle/`; schema in `src/server/db/schema.ts`.

## i18n & RTL

Routes use `[locale]` dynamic segment (`src/i18n/routing.ts`). Translations live in `src/messages/` (ar.json, en.json).

- Components use `useTranslations()` hook from `next-intl`
- Server actions import `getTranslations()` for server-side i18n
- Run `pnpm check:i18n` to validate translator aliases

## Authentication

- **Better Auth** (`src/server/lib/auth.ts`) handles email/password auth
- **Rate limiting** via Upstash Redis (`@upstash/ratelimit`) on sensitive auth endpoints
- **Email delivery**: Resend (preferred) with Gmail SMTP fallback (`src/server/lib/auth-email.ts`)
- **Server-side operations** use Better Auth server APIs with forwarded request headers
- **Admin guards** (`withAdmin`) check authenticated session + admin role

## Styling & Components

- **Tailwind CSS 4** with PostCSS
- **shadcn/ui** + **Radix UI** for accessible components
- **React Hook Form** + **Zod** for form validation
- **next-themes** for dark mode toggle
- Theme provider wraps entire app (see `src/app/[locale]/layout.tsx`)

## Data Fetching & State

- **Client:** SWR for HTTP fetching with caching & revalidation
- **Server:** Drizzle ORM for database queries, Better Auth server APIs for auth
- **Client state:** Zustand for global state (rarely needed with SWR)

## Testing & Quality

- **E2E tests:** Playwright in `e2e/` with `@smoke` tag for critical paths
- **Type checking:** `pnpm typecheck` uses TypeScript in noEmit mode
- **Linting:** ESLint via `pnpm lint`
- **Unused deps:** `pnpm check:deps` (knip)

## Observability & Deployment

- **Error tracking:** Sentry (`@sentry/nextjs`) for error reporting and perf tracing. Configure `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` in env (build-time for org/project/token, runtime for DSN).

- **Uptime monitoring:** UptimeRobot
- **Backups:** SimpleBackups for database backups

Hosted in VPS using Docker.

## Common Tasks

**Adding a new API endpoint:**

- Create route at `src/app/api/<path>/route.ts`
- Add DTO/schema in feature module `dto/` folder
- Add repository method → service method → controller method
- Use `compose(withErrorHandler, withAdmin?)` wrapper
- Add Swagger JSDoc

**Modifying database schema:**

- Edit `src/server/db/schema.ts`
- Run `pnpm db:generate` to create migration
- Run `pnpm db:migrate` to apply

**Adding a new feature module:**

- Create `src/server/modules/<feature>/` folder
- Add `<feature>.repository.ts`, `<feature>.service.ts`, `<feature>.controller.ts`
- Create `dto/` subfolder with schemas
- Follow the strict layering pattern (no cross-layer imports except downward)

**Debugging the dev server:**

- Check TypeScript errors: `pnpm typecheck`
- Check ESLint: `pnpm lint`
- Browser DevTools for client-side issues
- Server logs in terminal for API issues
- Drizzle Studio (`pnpm db:studio`) for database inspection

## Do Not

- Never view, read, grep, cat, or output the contents of any `.env*` file (`.env`, `.env.local`, `.env.prod`, `.env.*`). If you need to check which variables are required, inspect `.env.example`, `.env.build`, or ask the user directly.
- Never run shell commands that output connection strings, API tokens, passwords, or secrets to stdout/stderr.
- Call database directly from route handlers or client components—use repositories only
- Mix transport concerns (HTTP status, headers) in services—keep them in controllers/route handlers
- Import server modules in client components (Next.js will block this at build time anyway)
- Catch exceptions in controllers without re-throwing—let `withErrorHandler` normalize them
- Forget Swagger JSDoc on new API endpoints (used for `/api-docs`)
