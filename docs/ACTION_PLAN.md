# Pagination Hardening Plan & Execution Checklist

> **Target Workspace:** `modawim-codebase`  
> **Status:** Draft / Ready for Execution  
> **Created:** 2026-10-24  
> **Location:** [`docs/ACTION_PLAN.md`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/docs/ACTION_PLAN.md)

---

## Table of Contents

1. [Executive Summary & Audit Findings](#1-executive-summary--audit-findings)
2. [Phase 1: Critical — High-Limit Queries Lacking UI Pagination](#2-phase-1-critical--high-limit-queries-lacking-ui-pagination)
   - [Task 1: Todos Management (`todo-list.tsx`)](#task-1-todos-management-todo-listtsx)
   - [Task 2: Goals Management (`goal-list.tsx`)](#task-2-goals-management-goal-listtsx)
   - [Task 3: Planning Page (`planning-page.tsx`)](#task-3-planning-page-planning-pagetsx)
   - [Task 4: Calendar Events View (`calendar-page.tsx`)](#task-4-calendar-events-view-calendar-pagetsx)
3. [Phase 2: Database Layer — Unbounded Collection Queries](#3-phase-2-database-layer--unbounded-collection-queries)
   - [Task 5: Habits Module (Unbounded Queries to Paginated API)](#task-5-habits-module-unbounded-queries-to-paginated-api)
   - [Task 6: Public Curator Knowledge Portfolios (`p/[userId]`)](#task-6-public-curator-knowledge-portfolios-puserid)
   - [Task 7: Subscription Invoices (`/api/subscription/invoices`)](#task-7-subscription-invoices-apisubscriptioninvoices)
4. [Phase 3: Stores & Selectors — Pre-fetch Limits & Search Optimization](#4-phase-3-stores--selectors--pre-fetch-limits--search-optimization)
   - [Task 8: Projects Store (`projects-store.tsx`)](#task-8-projects-store-projects-storetsx)
   - [Task 9: Tags Store (`tags-store.tsx`)](#task-9-tags-store-tags-storetsx)
5. [Phase 4: UI/UX Refinement for Existing Paginated Pages](#5-phase-4-uiux-refinement-for-existing-paginated-pages)
   - [Task 10: Standardize Pagination Component (Ellipsis, Stable Prev/Next, Scroll-to-Top, i18n)](#task-10-standardize-pagination-component-ellipsis-stable-prevnext-scroll-to-top-i18n)
6. [Master Execution Checklist](#6-master-execution-checklist)

---

## 1. Executive Summary & Audit Findings

Following a full system audit of all list/collection endpoints and frontend views, pagination across Modawim falls into four distinct categories:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PAGINATION AUDIT MATRIX                         │
├────────────────────────────┬───────────────────────────────────────────┤
│ Fully Compliant            │ Books, Courses, Articles, Resources,      │
│ (Backend DB + UI Controls) │ Projects, Documents, Admin Tables, Notes  │
├────────────────────────────┼───────────────────────────────────────────┤
│ Backend Paginated,         │ Todos (limit: 100), Goals (limit: 100),   │
│ but Frontend Hardcodes 100 │ Planning (limit: 100), Calendar (limit:100│
├────────────────────────────┼───────────────────────────────────────────┤
│ Unbounded Database Queries │ Habits, Public Portfolios, Invoices       │
├────────────────────────────┼───────────────────────────────────────────┤
│ UI Inconsistencies         │ Missing ellipsis on large page counts,    │
│                            │ shifting buttons, missing scroll-to-top   │
└────────────────────────────┴───────────────────────────────────────────┘
```

The goal of this plan is to eliminate all artificial `100` limits, enforce SQL `LIMIT`/`OFFSET` queries on every collection endpoint, and provide responsive, accessible UI pagination across the entire app.

---

## 2. Phase 1: Critical — High-Limit Queries Lacking UI Pagination

### Task 1: Todos Management ([`todo-list.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/dashboard/todos/todo-list.tsx))

#### Current State:

- The backend route `/api/todos` and repository [`todo.repository.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/server/modules/todos/todo.repository.ts) already implement proper `limit` and `offset`.
- However, [`todo-list.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/dashboard/todos/todo-list.tsx#L337-L482) hardcodes `limit: 100` across all query scopes (`today`, `inbox`, `future`, `overdue`, `calendar`, `matrix`, `all`).
- There is **no UI pagination component**. When a user has more than 100 todos in a scope, tasks past #100 are cut off and unreachable.

#### Proposed Solution:

1. **List / "All" / "Inbox" / "Future" / "Overdue" Scopes:**
   - Implement paginated fetching via `useSWRInfinite` (matching the pattern in [`note-list.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/dashboard/notes/note-list.tsx)) with `TODOS_PAGE_LIMIT = 30`.
   - Add a clean "Load more" button or infinite scroll sentinel at the bottom of the active list.
2. **Metadata & Total Counts:**
   - Display total counts in badges using `meta.total` instead of `items.length`.
3. **Calendar & Matrix Views:**
   - Keep views date-scoped. If a single day or quadrant exceeds 50 items, show a scrollable list with a count indicator.

#### Checklist:

- [ ] Refactor `todo-list.tsx` SWR queries to accept dynamic `page` or `useSWRInfinite`
- [ ] Replace hardcoded `limit: 100` with `TODOS_PAGE_LIMIT = 30`
- [ ] Add "Load More" button or UI pagination controls to list views
- [ ] Ensure status change / filter toggle resets page to 1
- [ ] Update badge counters to read from `data.meta.total`

---

### Task 2: Goals Management ([`goal-list.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/dashboard/goals/goal-list.tsx))

#### Current State:

- [`goal-list.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/dashboard/goals/goal-list.tsx#L57) defines `const DEFAULT_LIMIT = 100;`.
- While `<Pagination>` JSX is present in the file, it only displays when `meta.totalPages > 1` (meaning a user must have at least 101 goals before pagination even activates).
- Fetching 100 goals at once degrades initial page load performance.

#### Proposed Solution:

- Lower `DEFAULT_LIMIT` from `100` to `12` (for 3-column / 4-column card layouts) or `20`.
- Verify the existing `<Pagination>` component functions seamlessly across pages.

#### Checklist:

- [ ] Update `DEFAULT_LIMIT` in `goal-list.tsx` to `12` (matching projects)
- [ ] Verify page switching triggers correct SWR re-fetch with `limit: 12`
- [ ] Verify filter and search input changes reset `page` to `1`

---

### Task 3: Planning Page ([`planning-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/planning/planning-page.tsx))

#### Current State:

- [`planning-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/planning/planning-page.tsx#L33) calls:
  ```ts
  apiClient.planning.list({
    sortBy: "startDate",
    limit: 100,
    dateFrom,
    dateTo,
    ...(typeFilter !== "all" ? { type: typeFilter } : {}),
  });
  ```
- No page state exists. If plans exceed 100 in the queried range, any excess plans are silently omitted.

#### Proposed Solution:

- Add a `page` state (default `1`, `PLANNING_LIMIT = 20`).
- Render `<Pagination>` controls beneath the planning timeline/grid when `meta.totalPages > 1`.

#### Checklist:

- [ ] Add `page` state to `planning-page.tsx`
- [ ] Change `limit: 100` to `limit: 20`
- [ ] Add `<Pagination>` component beneath the planning grid
- [ ] Reset `page` to `1` on month change or type filter change

---

### Task 4: Calendar Events View ([`calendar-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/calendar/calendar-page.tsx))

#### Current State:

- In [`calendar-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/calendar/calendar-page.tsx#L96-L100), `fetchEvents()` queries:
  ```ts
  apiClient.calendarEvents.list({
    scheduledFrom: format(startDate, "yyyy-MM-dd"),
    scheduledTo: format(endDate, "yyyy-MM-dd"),
    limit: 100,
  });
  ```
- Results are capped at 100 with no overflow handling.

#### Proposed Solution:

- Because calendar UIs depend on having all events for the visible week/month range, increase the safety limit to 250 OR fetch chunked pages if `meta.total > 100`.
- Display a small UI banner if an active month exceeds the fetch threshold.

#### Checklist:

- [ ] Check if `meta.total > items.length` and warn or automatically load remaining items
- [ ] Increase batch limit for monthly view to prevent dropped events on busy schedules

---

## 3. Phase 2: Database Layer — Unbounded Collection Queries

### Task 5: Habits Module (Unbounded Queries to Paginated API)

#### Current State:

- [`habit.controller.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/server/modules/habits/habit.controller.ts#L32-L42) and [`habit.repository.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/server/modules/habits/habit.repository.ts) execute raw `select().from(habit)` queries with **no `limit` or `offset`**.
- Frontend ([`habits-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/habits/habits-page.tsx#L80)) pulls the entire habits table into memory.
- While users typically maintain 5–20 active habits, archived habits and power users can grow to hundreds of rows.

#### Proposed Solution:

1. **Backend:**
   - In [`habit.dto.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/server/modules/habits/habit.dto.ts), introduce `listHabitsQuerySchema` with optional `page` and `limit` (defaulting to 50, max 100).
   - In `habit.repository.ts`, add `.limit(pagination.limit).offset(pagination.offset)` and `count(*)` queries.
2. **Frontend Settings & Archive Views:**
   - For [`habits-settings-list.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/habits/habits-settings-list.tsx) and archived habits, implement `<Pagination>`.
   - The daily completion board can continue requesting active habits (`limit: 50`), which fits within a single page for 99% of users.

#### Checklist:

- [ ] Add `listHabitsQuerySchema` in `habit.dto.ts`
- [ ] Update `habit.controller.ts` to call `parsePagination`
- [ ] Update `habit.repository.ts` to execute `limit` & `offset` in SQL
- [ ] Add pagination controls to habits archive / settings lists
- [ ] Verify completion tracking still functions properly with paginated habits

---

### Task 6: Public Curator Knowledge Portfolios ([`p/[userId]/page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/app/[locale]/p/[userId]/page.tsx))

#### Current State:

- [`public-knowledge.repository.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/server/modules/public-knowledge/public-knowledge.repository.ts#L76-L140) queries:
  - `findPublicBooksByUserId`: `SELECT ... FROM books WHERE userId = ? AND isPublic = true` (NO limit)
  - `findPublicCoursesByUserId`: `SELECT ... FROM courses WHERE userId = ? AND isPublic = true` (NO limit)
- If a curator publishes 100+ books or articles, the public server component SSR fetches all of them simultaneously, resulting in slow TTFB and excessive memory consumption.

#### Proposed Solution:

1. **Backend:**
   - Add default `limit: 24` and `page: 1` support to public knowledge repository methods.
2. **Frontend Profile View:**
   - Display the top 8–12 items per section on the main public curator profile with a "View all books / courses / articles" link or tabbed pagination.

#### Checklist:

- [ ] Add `limit` and `offset` support to `findPublicBooksByUserId`, `findPublicCoursesByUserId`, `findPublicArticlesByUserId`
- [ ] Update `/api/public/users/[userId]/books` and `/courses` route handlers to accept `?page=&limit=`
- [ ] Add pagination or section limits in `public-profile-view.tsx`

---

### Task 7: Subscription Invoices ([`subscription-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/dashboard/subscription/subscription-page.tsx))

#### Current State:

- `GET /api/subscription/invoices` queries all invoices for the current user without limits.

#### Proposed Solution:

- Apply `limit(20)` in `subscription.repository.ts`.
- Add pagination in [`subscription-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/dashboard/subscription/subscription-page.tsx) if invoice count exceeds 20.

#### Checklist:

- [ ] Add pagination parameters to `listInvoices` in `subscription.repository.ts`
- [ ] Display paginated table in `subscription-page.tsx`

---

## 4. Phase 3: Stores & Selectors — Pre-fetch Limits & Search Optimization

### Task 8: Projects Store ([`projects-store.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/projects/projects-store.tsx))

#### Current State:

- [`projects-store.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/projects/projects-store.tsx#L10-L28) fetches `limit: 100, page: 1` to cache active projects for dropdowns and filter chips.
- Users with > 100 active projects will have missing entries in filter pickers.

#### Proposed Solution:

- Maintain client cache for recent/active projects, but implement search-on-type (combobox) for project selection dialogs when total projects exceed 50.

#### Checklist:

- [ ] Audit all consumers of `useProjectsStore`
- [ ] Ensure project picker combobox supports server-side search query `q`

---

### Task 9: Tags Store ([`tags-store.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/tags/tags-store.tsx))

#### Current State:

- [`tags-store.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/tags/tags-store.tsx#L10) fetches `ACTIVE_TAGS_LIMIT = 150` in a single query.
- As noted in `todos.md` (line 161: _"handle things that uses large limit like limit of tags store (better using a fetch on search method)"_), this is inefficient.

#### Proposed Solution:

- Convert tag picker ([`tag-select.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/tags/tag-select.tsx)) to debounced search against `/api/tags?q=...` instead of bulk-loading 150 tags into local storage.

#### Checklist:

- [ ] Add debounced search fetching to `tag-select.tsx`
- [ ] Deprecate `ACTIVE_TAGS_LIMIT = 150` bulk prefetch in `tags-store.tsx`

---

## 5. Phase 4: UI/UX Refinement for Existing Paginated Pages

Even in the pages with verified backend pagination ([`books-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/books/books-page.tsx), [`courses-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/courses/courses-page.tsx), [`articles-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/articles/articles-page.tsx), [`resources-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/resources/resources-page.tsx)), several UI/UX shortcomings need standardization:

### Task 10: Standardize Pagination Component

| Issue                                           | Affected Pages             | Required Fix                                                                                                                                            |
| :---------------------------------------------- | :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Missing Ellipsis (`...`) on high page count** | Books, Articles, Resources | Replace `Array.from({ length: totalPages })` with a windowed range generator (`1 ... 4 5 6 ... 20`) using `<PaginationEllipsis />`.                     |
| **Prev/Next Button Disappearing**               | Courses                    | In `courses-page.tsx`, change `{page > 1 && <PaginationPrevious />}` to use disabled state (`pointer-events-none opacity-50`) to prevent layout shifts. |
| **Scroll-to-Top on Page Change**                | All 4 Pages                | On `setPage(newPage)`, execute `window.scrollTo({ top: 0, behavior: "smooth" })` so users don't remain at the footer after switching pages.             |
| **Hardcoded English Labels**                    | Pagination primitives      | Pass localized `text={t("pagination.previous")}` and `text={t("pagination.next")}` to shadcn's `<PaginationPrevious>` and `<PaginationNext>`.           |

#### Checklist:

- [ ] Create a shared reusable `<AppPagination />` wrapper component with windowed pages and ellipsis
- [ ] Add smooth scroll-to-top on page transitions
- [ ] Standardize disabled (not hidden) Next/Prev buttons
- [ ] Provide Arabic and English localized strings for pagination controls

---

## 6. Master Execution Checklist

|   ID   | Module / Page          | Task Description                                                               | Severity |   Status   |
| :----: | :--------------------- | :----------------------------------------------------------------------------- | :------: | :--------: |
| **P1** | **Todos**              | Replace `limit: 100` with pagination / infinite scroll in `todo-list.tsx`      |   High   | ⏳ Pending |
| **P2** | **Goals**              | Lower `DEFAULT_LIMIT` from `100` to `12` in `goal-list.tsx`                    |   High   | ⏳ Pending |
| **P3** | **Planning**           | Add page state & `<Pagination>` controls in `planning-page.tsx`                |  Medium  | ⏳ Pending |
| **P4** | **Calendar**           | Add safety limits & chunked fetch for heavy calendar months                    |   Low    | ⏳ Pending |
| **P5** | **Habits**             | Add backend `LIMIT`/`OFFSET` and UI pagination to archive/settings             |   High   | ⏳ Pending |
| **P6** | **Public Profile**     | Add database-level limits to `findPublicBooks/Courses/Articles`                |   High   | ⏳ Pending |
| **P7** | **Invoices**           | Add pagination to `/api/subscription/invoices`                                 |   Low    | ⏳ Pending |
| **P8** | **Tags Store**         | Switch tag selection from 150-limit prefetch to debounced search               |  Medium  | ⏳ Pending |
| **P9** | **UI Standardization** | Add ellipsis truncation & scroll-to-top to Books, Courses, Articles, Resources |  Medium  | ⏳ Pending |
