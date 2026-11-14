# In-App Notifications — Implementation Plan

This plan implements a **database-backed in-app notification** system aligned with [ARCHITECTURE.md](../../ARCHITECTURE.md): feature module under `src/server/modules/`, route handlers as transport, services for rules, repositories for Drizzle access, `withAuth` / `withAdmin`, and normalized API responses.

## 1. Scope and boundaries

| Concern         | In-app notifications (this feature)                         | Out of scope                      |
| --------------- | ----------------------------------------------------------- | --------------------------------- |
| Storage         | PostgreSQL via Drizzle                                      | Push payloads                     |
| Delivery        | Fetch on app load + when opening panel / notifications page | WebSockets, SSE, polling loops    |
| Audience        | Per-user rows                                               | Announcements (segment/broadcast) |
| Source of truth | `notifications` table                                       | Push-only state                   |

Internal callers (other module **services**) create rows through a **server-only** `notificationService` API — not a public “create” route for normal users.

## 2. Data model

### 2.1 Table: `notification` (Drizzle)

Align **foreign keys** with the existing schema: `user.id` is `text`, not UUID.

| Column      | Type        | Notes                                                                                                                        |
| ----------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `id`        | `uuid` PK   | `uuid("id").primaryKey().defaultRandom()` — native Postgres type, smaller indexes, faster comparisons than text UUID strings |
| `userId`    | `text`      | `references(user.id, { onDelete: "cascade" })` (still `text` to match Better Auth `user.id`)                                 |
| `type`      | `text`      | Constrained by shared enum + Zod (see §5); optional `pgEnum` if you prefer DB-level enforcement                              |
| `title`     | `text`      | `notNull()`                                                                                                                  |
| `message`   | `text`      | `notNull()`                                                                                                                  |
| `link`      | `text`      | Nullable; app-relative or absolute per validation rules                                                                      |
| `metadata`  | `jsonb`     | Nullable; validate at insert per §2.1.1 (not DB-enforced)                                                                    |
| `isRead`    | `boolean`   | `notNull()`, default `false`                                                                                                 |
| `createdAt` | `timestamp` | `notNull()`, default `now()`                                                                                                 |

API responses expose `id` as string (UUID string); TypeScript types can use `string` for JSON compatibility.

### 2.1.1 `metadata` limits (pinned — implement in Zod/service)

Apply in **Zod / service validation** before insert (admin + internal `createForUser`):

| Rule                | Value                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Max top-level keys  | **5** (`Object.keys(metadata).length ≤ 5`)                                                                                                         |
| Max serialized size | **2048 bytes** — measure **`Buffer.byteLength(JSON.stringify(metadata), "utf8")`** in Node (UTF-8 octets), not `string.length` (UTF-16 code units) |

Reject creates that exceed either limit. Values should be JSON-serializable primitives or shallow objects; no requirement to recurse into nested object key counts unless you want stricter rules later.

### 2.2 Indexes (performance)

**Required composite indexes** (both):

1. **`(userId, isRead)`** — `index("notification_user_id_is_read_idx").on(table.userId, table.isRead)` — unread counts and `unreadOnly` filters.
2. **`(userId, createdAt DESC)`** — list pagination: `WHERE userId = ? ORDER BY createdAt DESC LIMIT n` without scanning extra rows. In Drizzle, use `desc(table.createdAt)` in the index definition (see Drizzle `index().on(...)` + `desc()` from `drizzle-orm`).

Together these cover the main read paths; a standalone `userId`-only index is **not** required if both composites exist.

Generate migration via Drizzle Kit after updating `src/server/db/schema.ts`.

### 2.3 Notification types (application constants)

Predefined `type` values (string union / enum in shared code):

- `habit_reminder`
- `habit_completed`
- `streak_achievement`
- `subscription`
- `system`
- `social`
- `announcement_reference`

Used for categorization, filtering, and future analytics — validate on create (admin + internal service).

## 3. Backend module layout

**Path:** `src/server/modules/notifications/`

| File                         | Responsibility                                                                                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notification.repository.ts` | Drizzle: insert, count unread, list with **cursor** (`createdAt` + `unreadOnly`), idempotent mark one read (§4.3), mark all read with `is_read = false` filter (§4.4) |
| `notification.service.ts`    | Business rules: scope all operations to authenticated user; `createForUser` for internal + admin use; map to response DTOs                                            |
| `notification.controller.ts` | Parse query/body, call service, return `ApiSuccess`                                                                                                                   |
| `notification.dto.ts`        | Zod schemas: list query, **admin create** payload, id param                                                                                                           |

**Shared:**

- `src/shared/types/notification.types.ts` — `NotificationDto`, list response types for API + SWR.
- `src/shared/constants/notification-types.ts` — `NOTIFICATION_TYPES` and `NotificationType`.

**Do not** query the DB from route handlers or from React server components except indirectly through existing patterns (API fetch from client).

## 4. HTTP API (route handlers)

All JSON success/error shapes follow existing `ApiSuccess` / `ApiError` patterns and `compose(withErrorHandler, withAuth | withAdmin)`.

### 4.1 Authenticated user routes (`withAuth`)

| Method  | Path                               | Purpose                                                                                                                                                                                                     |
| ------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`   | `/api/notifications/unread-count`  | Returns `{ count: number }` — **no full list** (header/badge)                                                                                                                                               |
| `GET`   | `/api/notifications`               | **Cursor pagination only** (see §4.2); query: `unreadOnly` (e.g. default `true` for the notifications page), `cursor` = ISO timestamp of the **last item’s `createdAt`** from the previous page (exclusive) |
| `PATCH` | `/api/notifications/[id]/read`     | Mark single notification read — **idempotent** (see §4.3); **404** only when the notification does not exist for this user                                                                                  |
| `POST`  | `/api/notifications/mark-all-read` | Mark all as read for `session.user.id` — **idempotent**; DB update should include `AND is_read = false` to skip unnecessary writes (see §4.4)                                                               |

**Security:** Controller passes **only** `userId` from session (via guard/context) into the service. Repository methods always filter by `userId`.

### 4.2 List endpoint — cursor pagination

Use **cursor = `createdAt` of the last row** from the previous response (ISO-8601 string). First page omits `cursor`.

**Query shape:**

```sql
WHERE user_id = $userId
  AND ($unreadOnly = false OR is_read = false)
  AND ($cursor IS NULL OR created_at < $cursor)
ORDER BY created_at DESC
LIMIT 20
```

**Why:** Stable ordering for infinite scroll, fewer edge cases than offset pagination, aligns with `(userId, createdAt DESC)` index.

**Response:** Include `items` and `nextCursor` (last item’s `createdAt` ISO string, or `null` when no more pages).

### 4.3 Mark one read — idempotent `PATCH`

**Behavior:** Calling `PATCH /api/notifications/[id]/read` multiple times returns **success** every time for a row the user owns (already-read is not an error).

**Repository / SQL (primary):**

```sql
UPDATE notification
SET is_read = true
WHERE id = $id AND user_id = $userId
```

**PostgreSQL nuance:** When `is_read` is already `true`, some configurations/versions may report **no row modified** even though the row exists. Relying only on “rows updated = 1” can wrongly return **404** on the second call.

**Idempotent handler logic (recommended):**

1. `UPDATE ... SET is_read = true WHERE id AND user_id RETURNING id`
2. If a row is returned → **200**
3. If not, `SELECT id FROM notification WHERE id AND user_id` — if found → **200** (already read); else → **404**

This preserves the user’s intended SQL while guaranteeing idempotency.

### 4.4 Mark all read — minimize writes

**SQL:**

```sql
UPDATE notification
SET is_read = true
WHERE user_id = $userId
  AND is_read = false
```

Idempotent: second call updates 0 rows and still returns success.

### 4.5 Admin route (`withAdmin`)

| Method | Path                       | Purpose                                                                                                                                                                                          |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST` | `/api/admin/notifications` | Body: `userId`, `type`, `title`, `message`, optional `link`, optional `metadata` — validates user exists (reuse user repository or lightweight lookup), then `notificationService.createForUser` |

**Swagger:** Add JSDoc on each new route file per project convention.

## 5. Validation rules

- **type:** enum / Zod literal union of the seven types.
- **title / message:** max length, non-empty after trim.
- **link:** optional; if present, validate URL or allow internal paths (decide one strategy — e.g. relative paths starting with `/` only, to avoid open redirects).
- **metadata:** optional; when present, enforce **§2.1.1** exactly (**≤5** top-level keys, **≤2048 UTF-8 bytes** for `JSON.stringify` output). Reject non–plain-object values at the top level if you want stricter safety.

## 6. Service API for other modules (internal)

Export from `notification.service.ts` (or a thin `notification.facade.ts` if you want a minimal import surface):

```ts
// Conceptual — not implemented in this doc
createForUser(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<NotificationEntity | void>
```

- Called from **server-only** code (e.g. `habit.service.ts`, `subscription` hooks).
- Reuses the same validation as the admin route (shared Zod schema or shared builder).
- No public HTTP endpoint for arbitrary users to create notifications.

## 7. Frontend plan

### 7.1 Data fetching (SWR)

- **Unread count:** `useSWR` (or a small wrapper hook) keyed e.g. `['/api/notifications/unread-count']`, `fetcher` that parses `ApiSuccess`, `revalidateOnFocus: true` optional — still **no polling timer**; aligns with “fetch on load” + natural refocus.
- **Notifications page:** `useSWR` **infinite key** pattern (e.g. key depends on `cursor` chain) or **`useSWRInfinite`** with `GET /api/notifications?cursor=...&unreadOnly=true`; append pages using `nextCursor` from §4.2; mutate global unread + list after mark-one / mark-all-read.

### 7.2 Layout provider (parallel to announcements)

- Add **`NotificationProvider`** (client) in `src/app/[locale]/(dashboards)/dashboard/layout.tsx`, **alongside** `AnnouncementProvider` (order: wrap children consistently; both can nest).
- Provider responsibilities:
  - Hold unread count from SWR (or fetch once + expose `mutate`).
  - Expose context: `{ unreadCount, mutateUnreadCount }` (minimal API).

**Note:** Announcements use raw `fetch` in `announcement-provider.tsx`; this feature explicitly uses **SWR** per requirements.

### 7.3 Header UX — `header-user-controls.tsx`

- **No separate bell icon:** use the **existing avatar / dropdown trigger** as the notification affordance:
  - When `unreadCount > 0`, show a **small red dot** on the avatar button (e.g. absolute-positioned span, `aria-label` for accessibility).
- Add a **dropdown menu item** “Notifications” linking to `/dashboard/notifications` with **unread count** under or beside the label (similar pattern to `AnnouncementBadge` on updates — could be a compact `NotificationMenuBadge`).

### 7.4 Page: `/dashboard/notifications`

- New route: `src/app/[locale]/(dashboards)/dashboard/notifications/page.tsx` (and optional `loading.tsx`).
- List **unread** notifications (or toggle “show read” later — out of scope unless trivial).
- Each row: title, message snippet, time; primary action:
  - If `link` present: **navigate** (Next.js `Link` or router `push`) and **call mark-as-read** (optimistic update + SWR mutate).
  - If no link: optional explicit “Mark as read” control.
- **Mark all as read** button → `POST /api/notifications/mark-all-read` → mutate list + global unread count.

### 7.5 i18n

- Add keys under existing `header` / new `notifications` namespace in message files for menu label, page title, empty state, mark all, errors.

## 8. Click behavior (link + read)

1. User activates notification with `link`.
2. Client calls **mark as read** for that `id` (parallel or await before navigate — prefer **fire-and-forget** with optimistic UI, or await to avoid race if navigation unmounts too fast).
3. Navigate to `link`.

Ensure `link` validation on write prevents `javascript:` and external malicious targets if you restrict to internal paths.

## 9. Implementation order (suggested)

1. **Schema + migration** — `notification` table, indexes, export from schema.
2. **Module** — repository → service (including `createForUser`) → controller.
3. **User API routes** — unread-count, list, mark one, mark all.
4. **Admin API route** — create for user.
5. **Shared types + Zod DTOs** — wire Swagger.
6. **Frontend** — `NotificationProvider` in dashboard layout, hook/context, header red dot + menu item.
7. **Notifications page** — SWR list, mark actions, link behavior.
8. **Pilot integration** — call `createForUser` from **one** existing service path as a template (optional in first PR).

## 10. Testing and verification checklist

- [ ] Authenticated user cannot read or mutate another user’s notification IDs (cross-user ID → 404).
- [ ] Unauthenticated requests → 401 via `withAuth`.
- [ ] Admin create rejects invalid `type` / missing user / **metadata** over **5 keys** or **>2048 UTF-8 bytes**.
- [ ] Unread count query uses indexed filter (`userId` + `isRead`).
- [ ] List query uses **`createdAt` cursor** + **`(userId, createdAt DESC)`** index (verify `EXPLAIN` in dev if needed).
- [ ] `PATCH .../read` is **idempotent** (second call → **200**, not **404**).
- [ ] `POST mark-all-read` uses `AND is_read = false`; second call still **200**, 0 rows updated.
- [ ] SWR cache updates after mark one / mark all.

## 11. Files likely touched (summary)

| Area       | Paths                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| DB         | `src/server/db/schema.ts`, `drizzle/*`                                                                                           |
| Module     | `src/server/modules/notifications/*`                                                                                             |
| API        | `src/app/api/notifications/**/route.ts`, `src/app/api/admin/notifications/route.ts`                                              |
| Client     | `src/components/notifications/*`, `src/hooks/use-notification-unread.ts` (optional)                                              |
| Layout     | `src/app/[locale]/(dashboards)/dashboard/layout.tsx`                                                                             |
| Header     | `src/components/header-user-controls.tsx`                                                                                        |
| Page       | `src/app/[locale]/(dashboards)/dashboard/notifications/page.tsx`                                                                 |
| API client | Extend `src/lib/api-client.ts` **only if** you centralize fetchers; SWR can use native `fetch` + shared types like announcements |
| i18n       | `messages/*.json` (or project locale structure)                                                                                  |
| Swagger    | `src/server/lib/swagger.ts` if routes need registration                                                                          |

---

**Route typo note:** Product URL should be **`/dashboard/notifications`** (not `notficiations`).

When this plan is approved, the next step is implementing **§9** in order, starting with schema and the `notifications` module.
