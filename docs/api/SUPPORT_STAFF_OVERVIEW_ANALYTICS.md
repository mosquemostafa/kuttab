# Support Staff Overview Analytics

This document describes the **support desk analytics dashboard**: aggregated ticket and feedback metrics, daily time series, and the UI that consumes them.

## 1) What It Solves

Support staff (and admins with the same access) get a single place to see:

- **KPI cards** — totals, created-in-window counts, stale items, throughput-style metrics
- **Donut charts** — ticket mix by status, feedback by type, feedback by status
- **Area chart** — tickets vs feedback created per day over a selectable range (7 or 30 days)

Data is loaded from one **GET** API that uses a small number of database queries with consistent time windows.

## 2) User-Facing Entry

| Item         | Location                                                                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page         | [`src/app/[locale]/(dashboards)/support/overview/page.tsx`](<../../src/app/[locale]/(dashboards)/support/overview/page.tsx>)                                                                    |
| UI component | [`src/components/support/support-staff-overview-analytics.tsx`](../../src/components/support/support-staff-overview-analytics.tsx)                                                              |
| Copy (EN/AR) | [`src/messages/en/dashboard.json`](../../src/messages/en/dashboard.json) / [`src/messages/ar/dashboard.json`](../../src/messages/ar/dashboard.json) under `dashboard.supportOverview.analytics` |

Navigation from the support area and admin sidebar points users to this overview where applicable.

## 3) HTTP API

| Method | Path                          | Auth                                                                |
| ------ | ----------------------------- | ------------------------------------------------------------------- |
| `GET`  | `/api/support/staff/overview` | Session; **support-staff** guard (same policy as other staff tools) |

Implementation:

- Route: [`src/app/api/support/staff/overview/route.ts`](../../src/app/api/support/staff/overview/route.ts)
- Controller: [`src/server/modules/support-staff-overview/support-staff-overview.controller.ts`](../../src/server/modules/support-staff-overview/support-staff-overview.controller.ts)

Swagger annotations on the route describe the endpoint for generated API docs.

### Response shape

Typed as [`SupportStaffOverviewDTO`](../../src/shared/types/support-staff-overview.types.ts):

- **`generatedAt`** — ISO timestamp for when the snapshot was built (anchored to DB time; see backend section).
- **`staleDays`** — mirrors [`STALE_DAYS`](../../src/shared/constants/support.ts) (default `7`); “stale” KPIs use this horizon.
- **`series`** — one object per calendar day for the configured series length (`SUPPORT_OVERVIEW_SERIES_DAYS`, default `30`), each with `date` (`YYYY-MM-DD`), `tickets`, `feedbacks`.
- **`tickets`** / **`feedbacks`** — nested aggregates (by status, created windows, stale counts, etc.) as documented in the type file.

### Client usage

[`apiClient.supportStaff.overview()`](../../src/lib/api-client.ts) calls `GET /support/staff/overview` (via the app’s API base) with `noStore` caching semantics appropriate for analytics.

## 4) Backend Architecture

| Layer      | File                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Service    | [`src/server/modules/support-staff-overview/support-staff-overview.service.ts`](../../src/server/modules/support-staff-overview/support-staff-overview.service.ts)       |
| Repository | [`src/server/modules/support-staff-overview/support-staff-overview.repository.ts`](../../src/server/modules/support-staff-overview/support-staff-overview.repository.ts) |

### Time anchor

The service loads **one** database “now” via `getOverviewTimeAnchor()` and passes that value into every parallel query. That keeps:

- rolling windows (7d / 30d, stale, series) **aligned to the same instant**
- `generatedAt` and the **merged daily series** (date-fns `eachDayOfInterval`) **consistent** with SQL

The returned value is normalized to a JavaScript `Date` because `node-pg` may return timestamps as strings.

### SQL notes

- **Tickets** and **feedbacks** each use a **single-row** aggregate query with `COUNT(*) FILTER (...)` where possible.
- **Daily series** (per table) share a helper `getDailyCreatedSeries` with `GROUP BY 1` / `ORDER BY 1` to avoid repeating `date_trunc` expressions.
- **Interval arithmetic** uses `(${anchor}::timestamptz - …)` so PostgreSQL always compares **timestamps** to **timestamps** (avoids `timestamp without time zone` vs `interval` typing issues when binding parameters).
- Series length is driven by **`SUPPORT_OVERVIEW_SERIES_DAYS`**; the SQL lower bound uses `(DAYS - 1)` elapsed days so the oldest bucket matches the inclusive client-side day list.

### Related constants

[`src/shared/constants/support.ts`](../../src/shared/constants/support.ts):

- `STALE_DAYS` — used in SQL for stale ticket / feedback logic and exposed in the DTO as `staleDays`.
- `SUPPORT_OVERVIEW_SERIES_DAYS` — inclusive calendar days in the daily series; shared between repository and service.

## 5) Frontend: Charts and Theming

### shadcn-style chart primitives

[`src/components/ui/chart.tsx`](../../src/components/ui/chart.tsx) provides `ChartContainer`, `ChartTooltip*`, `ChartLegend*`, and injects CSS variables for series colors from `ChartConfig`.

**Legend labels (Pie + `nameKey="type"`):** Recharts legend items include a top-level `type` field for the **icon** (e.g. `"rect"`), which conflicts with a data field also named `type`. `getPayloadConfigFromPayload` resolves **nested `payload.payload[nameKey]` before** top-level `payload[nameKey]` so labels resolve to `open`, `suggestion`, etc., not `"rect"`.

### Chart colors

[`src/app/globals.css`](../../src/app/globals.css) defines `--chart-1` … `--chart-5` on `:root` and `.dark`.

## 6) Related Files (Quick Reference)

| Topic                   | File                                                                                                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guards                  | `src/server/guards/support-staff.guard.ts` (and related auth)                                                                                                                                |
| DB tables               | `support_ticket`, `feedback` in [`src/server/db/schema.ts`](../../src/server/db/schema.ts)                                                                                                   |
| Feedback tweak (if any) | [`src/server/modules/feedbacks/feedback.service.ts`](../../src/server/modules/feedbacks/feedback.service.ts)                                                                                 |
| Sidebar / header links  | [`src/components/admin/dashboard-sidebar.tsx`](../../src/components/admin/dashboard-sidebar.tsx), [`src/components/header-user-controls.tsx`](../../src/components/header-user-controls.tsx) |

## 7) Operational Notes

- **Permissions:** If the API returns 403/401, the user is not in the support-staff path allowed by the guard.
- **Empty charts:** Donut charts hide zero slices; empty state copy is translated.
- **Performance:** Overview is intended to stay within a few DB round-trips per request; heavy work is aggregate counts, not row scans of full history without indexes (ensure `created_at` / `updated_at` remain indexed as in your migrations).

For broader ticket/feedback product behavior, see also:

- [`docs/api/SUPPORT_TICKETS_SYSTEM.md`](SUPPORT_TICKETS_SYSTEM.md)
- [`docs/api/FEEDBACKS_SYSTEM.md`](FEEDBACKS_SYSTEM.md)
