# Admin Overview Analytics — Implementation Plan

This document captures the current implementation plan for the **admin dashboard overview** analytics focused on `user` and `segment` data.

---

## 1. Goals

Deliver an **admin-only** overview that surfaces:

- User **volume & growth** (totals, last 7/30 days, **daily signups series**).
- **Email verification** mix and ratio.
- **Role** distribution (including null/unspecified), **ignoring banned state** for this slice (count all users).
- Separate **ban / access** metrics (current bans, temporary vs permanent).
- **Segment** adoption: unsegmented vs per-segment counts; segments with zero users.

Snapshot semantics: **single DB `now()` anchor** per request (same pattern as [support staff overview](./SUPPORT_STAFF_OVERVIEW_ANALYTICS.md)).

---

## 2. Confirmed business rules

### 2.1 Users — roles

- Include **`role` IS NULL** (or empty if normalized) as an **"Unspecified"** (or translated) bucket.
- Known roles should align with [src/shared/enums/user-role.enum.ts](../../src/shared/enums/user-role.enum.ts): `user`, `admin`, `support`.
- **Role chart / counts**: include **all users** regardless of `banned`.

### 2.2 Users — banning (separate from roles)

- **Permanent ban**: `banned = true` AND `ban_expires IS NULL`.
- **Temporary ban**: `banned = true` AND `ban_expires IS NOT NULL`.
- **`banned = false`**: treat as **not banned**; ignore stray `ban_expires` values.

---

## 3. API design

### 3.1 Route

- **Method / path**: `GET /api/admin/overview`.
- **Auth**: [src/server/guards/admin.guard.ts](../../src/server/guards/admin.guard.ts) + existing [src/server/decorators/with-error-handler.ts](../../src/server/decorators/with-error-handler.ts) / compose pattern.

### 3.2 Query parameters

| Param   | Purpose                                                        |
| ------- | -------------------------------------------------------------- |
| `range` | `7` \| `30` — length in **days** for **daily signups** series. |

### 3.3 Response shape (high level)

Single DTO (`AdminOverviewDTO`):

- `generatedAt: string` (ISO, from anchor).
- `rangeDays: 7 | 30`.
- **Users**
  - `totals`: total users, new last 7d, new last 30d.
  - `emailVerified`: verified count, unverified count, ratio.
  - `roles`: buckets keyed by role string + `unspecified` for null.
  - `banning`: not banned, banned permanent, banned temporary.
  - `segmentation`: unsegmented count; `segments`: `{ segmentId, name, emoji, userCount }[]`.
- **Series**
  - `signupsByDay: { date: string, count: number }[]` aligned to `range` + anchor.

---

## 4. Backend structure

| Piece                          | Responsibility                                                                |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `admin-overview.controller.ts` | Parse query, call service, return JSON.                                       |
| `admin-overview.service.ts`    | Load anchor once; orchestrate repo calls; merge daily series with `date-fns`. |
| `admin-overview.repository.ts` | Drizzle + `sql`; users/roles/segmentation/signups aggregates.                 |

### 4.1 Repository tactics

- Reuse shared `getDbTimeAnchor()` from `@/server/db/time-anchor`.
- Use explicit timestamp interval expressions for stability.
- **Signups series**: `date_trunc('day', created_at)` grouped and filtered by range.
- **Role distribution**: `COUNT(*) GROUP BY role` with null coalescing.

### 4.2 Performance

- Ensure `user.created_at` is indexed for series scans.
- Prefer parallel calls in service where independent.

---

## 5. Frontend

### 5.1 Page

- Admin overview page renders `AdminOverviewAnalytics` with metadata.

### 5.2 UX

- One toggle: **7 days / 30 days** controlling `range`.
- KPI cards for user totals and verification ratio.
- Full-width signups area chart.
- Pie charts for roles, banning, verification.
- Segment adoption table.

### 5.3 Data fetching

- `useSWR` + `apiClient.admin.overview({ range })`.

### 5.4 i18n

- Namespace: `dashboard.adminOverview` in [src/messages/en/dashboard.json](../../src/messages/en/dashboard.json) and [src/messages/ar/dashboard.json](../../src/messages/ar/dashboard.json).

---

## 6. Types & constants

- [src/shared/types/admin-overview.types.ts](../../src/shared/types/admin-overview.types.ts)
- [src/shared/constants/admin-overview.ts](../../src/shared/constants/admin-overview.ts)

---

## 7. Documentation & Swagger

- Keep route JSDoc/Swagger aligned with current users/segments-only scope.

---

## 8. Testing & rollout

- Manual: verify admin access and non-admin 403.
- Spot-check aggregates against SQL.
- Edge cases: zero users, zero segments, empty series windows.

---

## 9. Out of scope (current)

- Announcement analytics in admin overview.
- Reach/viewer analytics in admin overview.
- Weekly ISO buckets (daily only).
- Non-admin visibility.

---

## 10. Implementation order (suggested)

1. Types/constants.
2. Repository aggregates + signups series.
3. Service merge + DTO map.
4. Controller + route + apiClient.
5. UI + i18n.
6. Docs/Swagger sync.
