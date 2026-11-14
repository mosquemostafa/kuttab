# Modawim — Developer & DevOps Command Reference

Quick reference for all commands used in local development, queue worker execution, database migrations, testing, and production Docker operations.

---

## 1. Local Development (Next.js + BullMQ + Redis)

### Redis (Local via Homebrew)

```bash
# Start Redis service in the background
brew services start redis

# Check if Redis is running (should return PONG)
redis-cli ping

# Stop Redis service
brew services stop redis

# Restart Redis service
brew services restart redis

# Open Redis CLI console
redis-cli

# Inspect active BullMQ keys
redis-cli keys "bull:newsletter-delivery:*"

# Stream live Redis commands (debugging)
redis-cli monitor
```

### Running the Application Locally

```bash
# Terminal 1: Run the Next.js web application (Turbopack)
pnpm dev

# Terminal 2: Run the BullMQ background worker (TypeScript via tsx)
pnpm worker:dev
```

> **Tip (Dry-Run Mode):**
> Set `RESEND_DRY_RUN=true` in `.env.local` to test bulk campaign sending locally without calling the Resend API or burning your email quota.

### Adding a New Background Queue / Worker

The worker system uses a modular registry pattern:

1. Define your queue name and types in `src/server/queues/<feature>.types.ts` & `src/server/queues/<feature>.queue.ts`.
2. Implement your worker factory in `src/server/workers/<feature>.worker.ts` exporting `create<Feature>Worker(connection)`.
3. Add `create<Feature>Worker(connection)` to the `activeWorkers` array in `src/server/workers/run-worker.ts`.

Both local dev (`pnpm worker:dev`) and production (`modawim-worker` Docker container) will automatically run all registered workers in parallel with universal graceful shutdown.

---

## 2. Building & Bundling

```bash
# Bundle the standalone BullMQ worker script (outputs to dist/worker.js)
pnpm run build:worker

# Generate OpenAPI/Swagger specification
pnpm run swagger:generate

# Full production build (Swagger + Next.js webpack + worker bundle)
pnpm build

# Run the compiled worker script directly with Node
node dist/worker.js

# Run Next.js production standalone server locally
pnpm start:local
```

---

## 3. Database Migrations (Drizzle ORM)

```bash
# Generate new SQL migration files after editing schema (src/server/db/schema.ts or entities)
pnpm db:generate

# Apply pending migrations to local database (Docker/local Postgres)
pnpm db:migrate:local

# Apply pending migrations to production database (Neon)
pnpm db:migrate:prod

# Apply pending migrations to test database
pnpm db:migrate:test

# Open Drizzle Studio UI to inspect tables & data
pnpm db:studio:local
pnpm db:studio:prod

# Squash past migrations into a single baseline
pnpm db:squash
```

---

## 4. Code Quality & Testing

```bash
# Run TypeScript type check (no emit)
pnpm typecheck

# Run ESLint
pnpm lint

# Format code with Prettier
pnpm format

# Validate i18n translation keys & aliases
pnpm check:i18n

# Validate architecture guidelines
pnpm check:guidelines

# Run Playwright smoke tests (headless)
pnpm test:smoke

# Run Playwright smoke tests (headed browser UI)
pnpm test:smoke:headed

# Run full Playwright E2E test suite
pnpm test:e2e
```

---

## 5. Docker & VPS Deployment Operations

### Managing the Stack on the VPS (`~/modawim`)

```bash
# Start all services in the background (App, Worker, Redis)
docker compose up -d

# Check status and health of all containers
docker compose ps

# Pull the latest Docker images from GHCR
docker compose pull

# View real-time logs for all services
docker compose logs -f

# View logs for the background worker specifically
docker compose logs -f modawim-worker

# View logs for the Next.js web server
docker compose logs -f modawim-app

# View logs for the Redis container
docker compose logs -f redis

# Restart only the worker (e.g. after code update or stuck queue)
docker compose restart modawim-worker

# Stop all services without deleting data
docker compose down

# Prune unused dangling Docker images to free disk space
docker image prune -f
```

### Inspecting Redis Inside the Docker Container on the VPS

```bash
# Open redis-cli inside the running Docker container with password authentication
docker compose exec redis redis-cli -a "$REDIS_PASSWORD" ping

# View Redis memory statistics and keys
docker compose exec redis redis-cli -a "$REDIS_PASSWORD" info memory
docker compose exec redis redis-cli -a "$REDIS_PASSWORD" keys "bull:*"
```

---

## 6. GitHub CLI (`gh`) & CI/CD Operations

### Running & Watching Workflows

```bash
# Trigger the production Build & Deploy workflow on main
gh workflow run build-and-deploy.yml --ref main

# Stream live progress of the active workflow in the terminal
gh run watch

# List recent workflow runs and their status
gh run list --limit 5

# View logs of the latest workflow run
gh run view --log

# View only the failed steps from the latest run (fast debugging)
gh run view --log-failed

# Re-run a failed workflow run by ID
gh run rerun <run-id>
```

### GitHub Actions Cache Management

```bash
# List all active Docker BuildKit and dependency caches
gh cache list

# Delete ALL stored caches (forces a completely clean build from scratch)
gh cache delete --all

# Delete a specific cache by ID or key
gh cache delete <cache-id>
```
