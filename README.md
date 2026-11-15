# Almostafa | معهد المصطفى

Almostafa is an Islamic institute and digital learning platform for teaching the Holy Quran, Tajweed, recitation, and memorization, with full multilingual support for Arabic (RTL) and English (LTR).

This source code is **not** open source. Use, copying, modification, and distribution are restricted; see `LICENSE`.

Homepage: https://almostafa.org

## About Almostafa

The platform provides a comprehensive learning environment for Quranic studies, study circles, daily recitation tracking, and academic management with a clean UX and scalable architecture.

- Smart Habit Tracking: Track daily habits with intentions and motivational notes.
- Measurable Goals: Set target counts and monitor progress.
- Categories and Organization: Group habits into Health, Work, Learning, Worship, and more.
- Multiple Views: Daily, weekly, monthly, yearly perspectives with cards, calendar, and board-style workflows.
- Analytics: Charts and statistics for trends and performance.
- Journaling and Mood Tracking: Add reflections and monitor productivity/mood.
- Task Management: Priorities and structured task workflows.
- Multilingual UI: Full Arabic RTL and English LTR support.
- Modern, Minimal Interface: Focus on readability and low-friction interaction.

## Tech Stack

- Framework: Next.js 16, React 19, TypeScript
- Styling/UI: Tailwind CSS 4, Radix UI, shadcn/ui
- Forms and Validation: React Hook Form, Zod
- Auth: Better Auth (email/password)
- Email Delivery: Nodemailer (Gmail SMTP)
- Database: PostgreSQL + Drizzle ORM
- Data Fetching: SWR
- API Docs: Swagger (swagger-jsdoc + swagger-ui-react)
- i18n: next-intl (Arabic/English, RTL/LTR)

## Observability, analytics, and backups

Production operations use the following services:

- **[UptimeRobot](https://uptimerobot.com/)** — external uptime monitoring for availability checks and alerts.
- **[SimpleBackups](https://simplebackups.com/)** — automated backups for databases, servers, and related infrastructure.
- **[Sentry](https://docs.sentry.io/platforms/javascript/guides/nextjs/)** — error reporting and performance tracing (`@sentry/nextjs`). Environment variables:
  - **`NEXT_PUBLIC_SENTRY_DSN`** — **Where:** Sentry → your project → **Settings → Client Keys (DSN)** → copy the **Default** DSN (starts with `https://`). Required for the SDK to send events at runtime. Documented in [`src/server/lib/env.ts`](src/server/lib/env.ts) as optional (omit locally if you do not want Sentry during dev).
  - **`SENTRY_ORG`** — **Where:** the organization **slug** in the browser URL: `https://sentry.io/organizations/<slug>/…`, or **Settings → Organization → General** (slug). Not a numeric id. Used at **build time** by [`next.config.ts`](next.config.ts) (`withSentryConfig`) for source maps; not part of the runtime `env` schema.
  - **`SENTRY_PROJECT`** — **Where:** the project **slug** in the URL: `…/projects/<slug>/issues/` etc., or **Settings → Projects → [project] → General** (slug). Use this string, **not** the numeric “Project ID” from the UI. Build-time only; set in CI/CD environment or `.env` for production builds.
  - **`SENTRY_AUTH_TOKEN`** — **Where:** create under **User settings → Account → API → Auth Tokens** (or your org’s **Developer settings / Auth tokens**, depending on plan). Enable scopes needed for **releases / source map upload** (see [Auth tokens](https://docs.sentry.io/account/auth-tokens/)). This is **not** the **Client Keys → Security token** (allowed domains / outbound header) and not the DSN. Build-time only; keep as a **secret** in CI/CD or production env — never commit.
  - **`SENTRY_ENVIRONMENT`** (optional) — **Where:** not from Sentry; set any label you want (e.g. `production`). If unset, the app uses `NODE_ENV` (see [`src/lib/sentry-init.ts`](src/lib/sentry-init.ts)).

## Architecture

Modawim uses a modular, feature-first backend architecture.

- Route Layer: Next.js route handlers in `src/app/api/**/route.ts`
- Feature Modules: `src/server/modules/<feature>/` with feature-local controller/service/repository/dto
- Shared Cross-Cutting Layer: guards, decorators, pipes, exceptions, and shared repositories/controllers under `src/server/*`
- Strict Boundaries:
  - Route handlers: transport concerns only
  - Controllers: input parsing/validation and response shaping
  - Services: business/domain logic
  - Repositories: data access only

Read full architecture details in `ARCHITECTURE.md`.

## Current Backend Modules

- `auth`
- `users`
- `todos`
- `app-settings`
- `dashboard-settings`
- `support-tickets`
- `feedbacks`
- `segments`
- `announcements`
- `newsletter` (marketing list: Resend + QStash; separate from Gmail auth mail)

## Newsletter (Resend + QStash)

Optional feature: public subscribe on the landing page, content-workspace draft campaigns (at `/content/newsletter`), and batched sends via [Upstash QStash](https://upstash.com/docs/qstash) hitting `/api/webhooks/qstash/newsletter`, with email delivery through [Resend](https://resend.com).

- Set **all** variables in the newsletter block in `.env.example` (`RESEND_*`, `QSTASH_*`, `RESEND_FROM_*`) for delivery to turn on. If any are missing, the app still boots and newsletter stays off (`newsletterDeliveryEnabled` in `src/server/lib/env.ts`).
- **Callback URL**: QStash must reach your deployment at `{NEXT_PUBLIC_APP_URL}/api/webhooks/qstash/newsletter` (use a tunnel such as [ngrok](https://ngrok.com) for local QStash testing).
- **Resend**: use a [verified sending domain](https://resend.com/docs/dashboard/domains/introduction). In sandbox or before domain verification, Resend typically only delivers to **verified recipient addresses**, which limits local testing.
- **Welcome email**: in **Admin → Settings**, enable “Newsletter welcome email on subscribe” to send a branded transactional welcome (HTML + plain text, `List-Unsubscribe`) when someone subscribes or resubscribes. Requires the Resend + QStash cluster above; default is off.

## API Documentation

- Swagger UI: `/api-docs`
- OpenAPI JSON: `/api/swagger.json`
- Feature docs:
  - `docs/api/SUPPORT_TICKETS_SYSTEM.md`
  - `docs/api/FEEDBACKS_SYSTEM.md`
  - `docs/api/ANNOUNCEMENTS_SEGMENTATION_SYSTEM.md`

## Getting Started

### 1. Prerequisites

- Node.js 20+
- pnpm
- A PostgreSQL database (for example [Neon](https://neon.tech)); Docker Compose is **optional** and only for [local testing](#optional-docker-for-local-testing)

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env` file (copy from `.env.example`) with the following values:

**Database:** set `DATABASE_URL` to your hosted Postgres connection string (Neon and similar providers work as-is).

**Redis cache and rate limits:** set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from your [Upstash](https://upstash.com) Redis database. Omit **both** to disable server-side caching (see `src/server/lib/env.ts`). The same credentials power **Upstash-backed rate limiting** (`@upstash/ratelimit` in [`src/lib/ratelimit.ts`](src/lib/ratelimit.ts), enforced in [`src/server/lib/auth.ts`](src/server/lib/auth.ts) hooks, auth server actions, and the newsletter controller): when both variables are unset, per-IP and per-email limits are skipped so local development keeps working. Full behavior, limits table, and extension steps: [`docs/rate-limiting/rate-limiting.md`](docs/rate-limiting/rate-limiting.md).

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:3000

DATABASE_URL=postgresql://user:password@your-host/your-database

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

GMAIL_FROM_EMAIL=you@gmail.com
GMAIL_FROM_NAME=Modawim
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=your-google-app-password
```

For Gmail SMTP, `GMAIL_APP_PASSWORD` must be a Google App Password generated after enabling 2-Step Verification on your Google account.

### Optional: Docker for local testing

You do **not** need Docker for day-to-day development if you use hosted Postgres (for example Neon) and Upstash. Use `docker-compose.yml` when you want an isolated stack on your machine (CI-style checks, experiments, or avoiding cloud DBs).

It runs PostgreSQL on port `5432` and a local **Upstash-compatible** HTTP layer ([Serverless Redis HTTP](https://github.com/hiett/serverless-redis-http)) on `8079` in front of Redis. The app uses `@upstash/redis` (REST), not raw `redis://` on the host.

```bash
pnpm docker:up    # docker compose up -d
pnpm docker:down  # docker compose down
pnpm docker:logs  # docker compose logs -f
```

Example `.env` entries **only while this compose stack is running** (credentials match `docker-compose.yml`):

```env
DATABASE_URL=postgresql://modawim:modawim@localhost:5432/modawim
UPSTASH_REDIS_REST_URL=http://localhost:8079
UPSTASH_REDIS_REST_TOKEN=local_dev_token
```

If `5432` or `8079` is already in use, change the `ports` mappings in `docker-compose.yml` and adjust these values.

Put the Docker `DATABASE_URL` in the same env file layer that wins for your setup (often `.env.development.local` or `.env.local`). `drizzle.config.ts` resolves `DATABASE_URL` using the **same file order as Next.js** (`.env` → `.env.local` → `.env.development` → `.env.development.local`, then production/test variants when `NODE_ENV` matches). If `pnpm db:migrate` and `pnpm dev` pointed at different databases before, migrations could succeed on Neon while the app used empty local Postgres.

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Start development server

```bash
pnpm dev
```

Open http://localhost:3000

## Available Scripts

- `pnpm dev`: Start local development server
- `pnpm build`: Build production bundle
- `pnpm start`: Start production server
- `pnpm lint`: Run ESLint
- `pnpm typecheck`: Run TypeScript type check
- `pnpm test:e2e`: Run Playwright end-to-end tests
- `pnpm test:smoke`: Run Playwright smoke subset (`@smoke`, Chromium)
- `pnpm test:smoke:headed`: Same as smoke, headed browser (local debugging)
- `pnpm db:generate`: Generate Drizzle migrations
- `pnpm db:migrate`: Apply migrations
- `pnpm db:migrate:test`: Apply migrations to test database (`DATABASE_URL_TEST`)
- `pnpm db:push`: Push schema changes directly
- `pnpm db:studio`: Open Drizzle Studio
- `pnpm dock` / `pnpm docker:up`: Start local Postgres + Redis (SRH) (`docker compose up -d`)
- `pnpm docker:down` / `pnpm docker:logs`: Stop stack / follow logs — optional; not required if you use Neon + Upstash

## End-to-end testing (Playwright)

Browser automation lives in `e2e/` and is configured in `playwright.config.ts`. Scripts: `pnpm test:e2e`, `pnpm test:smoke`, `pnpm test:smoke:headed`.

There is no bundled GitHub Actions workflow for E2E; add your own job if you want CI, or run the scripts locally. Full setup, env vars (including optional **`DATABASE_URL_TEST`** for an isolated DB), ports, reports, and how to extend tests: **[`docs/testing.md`](docs/testing.md)**.

## Project Structure

```text
src/
	app/                    # UI routes, API routes, server actions
	components/             # reusable UI components
	db/                     # Drizzle schema and database setup
	i18n/                   # localization and routing config
	lib/                    # shared helpers, auth/email/api clients
	messages/               # translation messages (ar/en)
	server/
		modules/              # feature modules (controller/service/repository/dto)
		decorators/           # route wrappers
		guards/               # auth and role guards
		pipes/                # parsing and validation helpers
		exceptions/           # typed exceptions and exception mapping
	shared/                 # shared app/domain types
```

## License

Proprietary. All rights reserved. See `LICENSE`. This software is not licensed for third-party use, redistribution, or modification except as agreed in writing with the copyright holder(s).

---

"أحب الأعمال إلى الله أدومها وإن قل"

Stay consistent, stay productive, and keep building better habits with Modawim.
