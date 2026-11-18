# End-to-end testing (Playwright)

Modawim uses [Playwright](https://playwright.dev/) for browser automation. Tests live under `e2e/` and are driven by `playwright.config.ts` at the repository root.

## What is covered today

| Suite                    | Command                  | Scope                                                                                   |
| ------------------------ | ------------------------ | --------------------------------------------------------------------------------------- |
| Full Playwright run      | `pnpm test:e2e`          | All specs under `e2e/` (smoke, auth edges, locale, etc.).                               |
| Smoke subset             | `pnpm test:smoke`        | Only tests tagged **`@smoke`** (see `package.json`; primary spec: `e2e/smoke.spec.ts`). |
| Headed smoke (debugging) | `pnpm test:smoke:headed` | Same as smoke, with a visible browser.                                                  |

The **smoke** spec (`e2e/smoke.spec.ts`) is a single production-style path tagged with **`@smoke`**. It is split into **`test.step`** blocks for reports:

1. **API health** — `GET /api/health` must succeed.
2. **English locale shell** — `/en` loads.
3. **Email login** — sign in and reach the dashboard (client navigation).

Tests are **skipped** if `E2E_USER_EMAIL` or `E2E_USER_PASSWORD` is missing (see below).

## One-time setup: browsers

Playwright does not ship Chromium inside `node_modules`. After installing dependencies or upgrading `@playwright/test`, install browsers:

```bash
pnpm exec playwright install chromium
```

For all bundled browsers:

```bash
pnpm exec playwright install
```

On Linux CI runners you typically want `playwright install --with-deps chromium` so system libraries for Chromium are present.

## Environment variables

### Credentials (required for the smoke flow)

The smoke spec reads **`E2E_USER_EMAIL`** and **`E2E_USER_PASSWORD`**. That user must exist in whatever Postgres the **test server** uses (see **`DATABASE_URL_TEST`** below).

Playwright **does not** load `.env` / `.env.local` by itself. This repo loads them in `playwright.config.ts` via `dotenv` (`.env` first, then `.env.local` with override) so local runs match how you configure Next.js.

Example in `.env.local`:

```env
# Isolated DB for Playwright (recommended). When unset, tests use DATABASE_URL.
DATABASE_URL_TEST=postgresql://user:password@host:5432/modawim_e2e

# E2E / Playwright smoke
E2E_USER_EMAIL=you+smoke@example.com
E2E_USER_PASSWORD='your-strong-test-password'
```

### `DATABASE_URL_TEST` vs `DATABASE_URL`

The application only reads **`DATABASE_URL`** at runtime (see `src/server/lib/env.ts`). To avoid pointing automated tests at the same database as day-to-day development or production:

| Variable                | Role                                                                                                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`DATABASE_URL`**      | Normal **dev / deploy** database (unchanged).                                                                                                                                                  |
| **`DATABASE_URL_TEST`** | Optional. When Playwright starts **`webServer`**, it sets the child process’s **`DATABASE_URL`** to **`DATABASE_URL_TEST`** if it is non-empty; otherwise it falls back to **`DATABASE_URL`**. |

So you can keep a safe default **`DATABASE_URL`** in `.env.local` and put only the disposable test database in **`DATABASE_URL_TEST`**.

**Migrate the test database:** Run **`pnpm db:migrate:test`** to apply pending Drizzle migrations directly to the database targeted by **`DATABASE_URL_TEST`**.

**`pnpm build` before tests:** the build step uses whatever **`DATABASE_URL`** is in the environment for that shell. Run **`pnpm build`** with the same database you intend the test server to use (for example export **`DATABASE_URL`** to match **`DATABASE_URL_TEST`**, or only set **`DATABASE_URL_TEST`** and run **`DATABASE_URL="$DATABASE_URL_TEST" pnpm build`** once). If you add your own CI job, inject **`DATABASE_URL`** (or export it from **`DATABASE_URL_TEST`**) the same way for build and `pnpm start`.

If you set **`PLAYWRIGHT_BASE_URL`** and start **`pnpm start` yourself**, you must export **`DATABASE_URL`** yourself; set it to your test database (e.g. copy from **`DATABASE_URL_TEST`**) so the app does not use production data.

If auth or redirects misbehave, ensure **`NEXT_PUBLIC_APP_URL`** / **`BETTER_AUTH_URL`** match the Playwright origin for that build (default **`http://127.0.0.1:3001`**). See [Port and base URL](#port-and-base-url).

## Port and base URL

Default **`baseURL`** is **`http://127.0.0.1:3001`**, not port `3000`.

**Why:** With `reuseExistingServer: true` locally, Playwright only checks that something responds on `baseURL`. If **`next dev`** is already on **`:3000`**, reusing that server runs tests against **development** behavior (Turbopack, Strict Mode, different timing), which is not what you want for stable checks against a **production** build. Binding the test server to **`:3001`** avoids accidentally driving the dev server.

The managed `webServer` runs **`pnpm start`** with:

- `PORT` set to the test port (default `3001`).
- `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` set to the same origin so server-side auth and public URLs align for that process.
- **`DATABASE_URL`** overridden to **`DATABASE_URL_TEST`** when that variable is set (see above).

| Variable               | Meaning                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `PLAYWRIGHT_BASE_URL`  | If set, Playwright uses this URL and **does not** start `webServer`. You manage `pnpm start` / a tunnel yourself. |
| `PLAYWRIGHT_TEST_PORT` | Port segment when `PLAYWRIGHT_BASE_URL` is unset (default `3001`).                                                |

## Running tests locally

### Typical flow (recommended)

1. **`pnpm build`** — the smoke run expects a production bundle (`next start`).
2. **`pnpm test:e2e`** or **`pnpm test:smoke`** — Playwright starts **`pnpm start`** on the test port (unless `PLAYWRIGHT_BASE_URL` is set).

You do **not** need a second terminal unless you prefer to start the server yourself and set **`PLAYWRIGHT_BASE_URL`**.

### Development server on port 3000

You can keep **`pnpm dev`** on **http://localhost:3000**. Playwright’s default **`baseURL`** is **:3001**, so the default `webServer` does not attach to dev. If you point **`PLAYWRIGHT_BASE_URL`** at **:3000** while dev is running, you are explicitly testing the dev server—only do that when you intend to.

### After upgrading Playwright

If you see **“Executable doesn’t exist”** for Chromium, run **`pnpm exec playwright install`** (or `install chromium`) again.

## Configuration reference (`playwright.config.ts`)

| Area                                     | Behavior                                                                                                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`testDir`**                            | `./e2e`                                                                                                                                                                                          |
| **`fullyParallel`**                      | `false` (serial-friendly for shared accounts).                                                                                                                                                   |
| **`forbidOnly`**                         | Enabled when `CI` is set.                                                                                                                                                                        |
| **`retries` / `workers`**                | CI: 2 retries, 1 worker; local: no retries, default workers.                                                                                                                                     |
| **`timeout` / `expect.timeout`**         | 60s test, 10s assertions.                                                                                                                                                                        |
| **`use.baseURL`**                        | From env or default test origin.                                                                                                                                                                 |
| **`use.trace` / `screenshot` / `video`** | Retain or capture on failure for debugging.                                                                                                                                                      |
| **`projects`**                           | Chromium desktop only.                                                                                                                                                                           |
| **`webServer`**                          | Started only when **`PLAYWRIGHT_BASE_URL`** is unset: `pnpm start`, wait for `baseURL`, `reuseExistingServer: !CI`. Passes **`DATABASE_URL`** = **`DATABASE_URL_TEST`** \|\| **`DATABASE_URL`**. |

Reporters: list + HTML (`open: "never"`).

## Reports and artifacts

On failure, Playwright writes under the project (see `.gitignore`):

- **`playwright-report/`** — HTML report.
- **`test-results/`** — traces, screenshots, videos per test.

Open the last HTML report:

```bash
pnpm exec playwright show-report
```

Inspect a trace:

```bash
pnpm exec playwright show-trace test-results/<path-to-trace.zip>
```

## Adding or extending tests

1. Add files under **`e2e/`** (e.g. `e2e/feature.spec.ts`).
2. Prefer **role- and label-based** locators (`getByRole`, `getByLabel`) over brittle CSS-only selectors.
3. For login flows with **React Hook Form**, **`fill`** plus **`expect(locator).toHaveValue(...)`** before submit reduces “DOM filled but state empty” races.
4. For **Next.js client navigations**, `page.waitForURL(..., { waitUntil: "commit" })` paired with the action that triggers navigation is a common pattern.
5. Tag smoke-only tests with **`{ tag: ['@smoke'] }`** (or include `@smoke` in the test title) so **`pnpm test:smoke`** stays a thin slice.

## CI (optional)

This repository does **not** ship a GitHub Actions workflow for Playwright. To run smoke or full E2E in your own pipeline, mirror [Running tests locally](#running-tests-locally): install dependencies, `pnpm exec playwright install --with-deps chromium` (on Ubuntu), then **`pnpm build`** and **`pnpm test:smoke`** or **`pnpm test:e2e`**. Provide the same variables as in [Environment variables](#environment-variables)—especially **`DATABASE_URL`** (or align **`DATABASE_URL_TEST`** with how `playwright.config.ts` passes **`DATABASE_URL`** to `webServer`), **`E2E_USER_EMAIL`**, **`E2E_USER_PASSWORD`**, **`BETTER_AUTH_SECRET`**, and any other **`src/server/lib/env.ts`** requirements your build collects. Set **`NEXT_PUBLIC_APP_URL`** and **`BETTER_AUTH_URL`** to the Playwright origin (default **`http://127.0.0.1:3001`**) for a production build used in tests. Large webpack builds may need a higher Node heap (for example **`NODE_OPTIONS=--max-old-space-size=6144`**) on small runners.

Store secrets in your CI provider (for GitHub: **Settings → Secrets and variables → Actions**).

## Related files

| Path                   | Role                                                      |
| ---------------------- | --------------------------------------------------------- |
| `playwright.config.ts` | Global Playwright config, dotenv, `webServer`, `baseURL`. |
| `e2e/smoke.spec.ts`    | Tagged **`@smoke`** production sanity path.               |
| `package.json`         | `test:e2e`, `test:smoke`, `test:smoke:headed` scripts.    |
| `.gitignore`           | Ignores `playwright-report/`, `test-results/`.            |

For product-facing quality checks in production, you may also use external uptime tools (see the main `README.md` observability section).
