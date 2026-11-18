# 📖 Almostafa Quran Institute

A production-ready platform for Almostafa — Islamic institute for teaching the Holy Quran, engineered with Next.js 16, PostgreSQL, Drizzle ORM, Better Auth, and bilingual Arabic (RTL) / English (LTR) localization.

---

## ✨ Features Included

### 🔐 Authentication & Security

- **Better Auth Integration**: Email and password authentication out-of-the-box.
- **Session Management**: Multi-device session revocation, active session tracking.
- **Role-Based Access Control (RBAC)**: User & Admin roles, ban/unban mechanism, admin guards (`withAdmin`).
- **Rate Limiting**: Pre-configured Upstash Redis rate-limiter.

### 👑 Complete Admin Dashboard

- **Users Management**: Paginated search, role assignment, ban/unban, session revocation.
- **Global App Settings**: Open/closed registration toggle, maintenance mode, security flags.
- **Announcements Engine**: Broadcast banners with audience segmentation (e.g. all users, specific tiers).
- **Coupons & Discounts**: Promo code generator, discount percentage/fixed, expiration & usage caps.
- **Platform Analytics**: Total users, active users, registrations, and feature adoption.

### 💬 Customer Operations

- **Support Tickets**: User ticket submission, admin/support thread replies, status triage.
- **Feedback Collection**: In-app feedback modal & admin review center.
- **Newsletter Management**: In-app newsletter preferences, subscriber capture, campaign broadcasting.

### 💳 Billing & Subscriptions

- **Tiered Pricing**: Free, Trial, and Pro plans configured in `subscription-entitlements.ts`.
- **Pricing & Checkout UI**: Interactive pricing table and upgrade modals.

### 📝 Content Management

- **Tiptap Rich Text Editor**: Markdown support, code blocks, typography, presigned image uploads.

### 🌐 Internationalization (i18n) & RTL

- **Dual Language**: Pre-configured for English (LTR) and Arabic (RTL).
- **Localized Routing**: `/[locale]/...` with automatic locale detection and language switcher.

### 🏗️ Strict Feature-First Backend Architecture

Every API module follows clean architecture layering:

```
src/server/modules/<feature>/
├── <feature>.controller.ts   # Input validation & response shaping
├── <feature>.service.ts      # Business logic & entitlement checks
├── <feature>.repository.ts   # Database queries (Drizzle ORM)
├── <feature>.entity.ts       # Drizzle table definition
└── <feature>.dto.ts          # Zod schemas & TypeScript types
```


### 🛠️ Developer Experience & Tooling

- **Automated Swagger/OpenAPI**: Run `pnpm swagger:generate` to generate API specs at `/api-docs`.
- **Multi-Environment DB CLI**: `pnpm db:migrate:local`, `:test`, `:prod`, `db:studio`, `db:verify`.
- **Docker Compose**: One command (`pnpm docker:up`) launches local PostgreSQL and Redis.
- **Background Worker**: Standalone background task runner (`src/server/workers/run-worker.ts`).

---

## ⚡ Quickstart

### 1. Prerequisites

- Node.js 22+
- `pnpm` (`npm install -g pnpm`)
- Docker (optional, for local Postgres/Redis)

### 2. Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local

# 3. Start local Postgres & Redis
pnpm docker:up

# 4. Run database migrations
pnpm db:migrate:local

# 5. Seed test data (admin & sample records)
pnpm db:seed:local

# 6. Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🚀 How to Start a New Project From This Template

### Method A: Git Clone Single Branch

```bash
# 1. Clone only the template branch
git clone -b template/saas-starter https://github.com/your-username/modawim-codebase.git my-new-saas

# 2. Enter folder and reset git history
cd my-new-saas
rm -rf .git
git init
git add .
git commit -m "feat: initial commit from saas-starter template"
```

### Method B: Cherry-Picking Upstream Updates

If you keep `template/saas-starter` in your codebase repository, you can pull improvements or security fixes from `main`:

```bash
git checkout template/saas-starter
git cherry-pick <commit-hash-from-main>
```

---

## 🧱 Adding a New Feature

To add a new feature (e.g. `invoices` or `documents`):

1. **Entity**: Create `src/server/modules/<feature>/<feature>.entity.ts` and re-export in `src/server/db/schema.ts`.
2. **DTO**: Create `src/server/modules/<feature>/<feature>.dto.ts` with Zod validation.
3. **Repository**: Create `src/server/modules/<feature>/<feature>.repository.ts` for database access.
4. **Service**: Create `src/server/modules/<feature>/<feature>.service.ts` for business logic.
5. **Controller**: Create `src/server/modules/<feature>/<feature>.controller.ts`.
6. **Route Handler**: Add `src/app/api/<feature>/route.ts` using `compose(withErrorHandler, ...)`.
7. **Generate Migration**: Run `pnpm db:generate && pnpm db:migrate:local`.
8. **Swagger**: Run `pnpm swagger:generate` to document the endpoint.
