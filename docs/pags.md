Listed directory modules
Ran command: `find src/app/api -name "route.ts" | sort`
Ran command: `rg -o 'apiClient\.[a-zA-Z]+\.[a-zA-Z]+' src/ | sort | uniq -c`
Ran command: `rg -n '^\s+(list|get)[a-zA-Z]*:' src/lib/api/`
Viewed habit.controller.ts:1-60
Viewed habits-page.tsx:1-60
Viewed habits-page.tsx:60-120
Viewed todo-list.tsx:30-80
Viewed todo-list.tsx:150-250
Viewed todo-list.tsx:350-430
Viewed todo-list.tsx:300-350
Viewed todo-list.tsx:250-300
Viewed todo-list.tsx:430-490
Viewed projects-store.tsx:1-60
Viewed project-list.tsx:1-60
Viewed tags-store.tsx:1-60
Viewed dashboard-tags-page.tsx:30-75
Viewed dashboard-tag-detail-page.tsx:70-110
Searched for "getItemsById"
Ran command: `find src/components -name "*goal*"`
Viewed goal-list.tsx:1-60
Viewed goal-list.tsx:60-140
Viewed goal-list.tsx:650-704
Searched for "Pagination"
Ran command: `find src/components -name "*note*"`
Viewed note-list.tsx:1-80
Viewed journals-page.tsx:100-160
Viewed journals-page.tsx:170-230
Viewed planning-page.tsx:1-80
Ran command: `find src/components -name "*calendar*"`
Viewed calendar-page.tsx:30-80
Searched for "apiClient.calendarEvents"
Viewed calendar-page.tsx:90-110
Viewed support-tickets-panel.tsx:35-75
Viewed support-tickets-management-table.tsx:40-85
Ran command: `rg "publicKnowledge|apiClient\.public" src/`
Viewed page.tsx:30-60
Viewed public-knowledge.repository.ts:40-100
Searched for "listEntries"
Searched for "listSections"
Searched for "listInvoices"
Viewed document-list-view.tsx:35-75
Searched for "DocumentListView"
Viewed documents-page.tsx:1-60
Ran command: `find src/components -name "*notification*"`
Viewed notifications-panel.tsx:1-60
Listed directory admin
Searched for "limit"
Ran command: `find src/components -name "*blog*" -o -name "*newsletter*"`
Viewed blog-list-view.tsx:30-75
Viewed blog-list-view.tsx:200-266
Viewed blogs-library-section.tsx:1-60
Viewed newsletter-subscribers-table.tsx:1-60
Ran command: `find src/components -name "*asset*"`
Viewed assets-library-section.tsx:1-60
Viewed assets-grid.tsx:1-60
Viewed assets-grid.tsx:270-313
Viewed overview-page.tsx:1-80
Viewed overview-page.tsx:80-120
Viewed blog-comment.repository.ts:1-60
Viewed blog-comments-section.tsx:1-60
Viewed blog-comments-section.tsx:120-170
Viewed blog-comments-section.tsx:370-420

Here is a comprehensive report on all **"get many"** (collection list) requests across the project, identifying pages that **do not implement pagination** or that fetch with a **hardcoded 100 limit**.

---

### Category 1: Endpoints support backend pagination, but Frontend hardcodes a high limit (e.g. `100`) and lacks UI pagination

These are the exact scenarios you cautioned against: the backend API supports `page` and `limit`, but the UI queries a bulk batch (usually `limit: 100`) and does not paginate.

| Page / Component                                                                                                                                                         | Endpoint                   | Current Fetch Behavior                                                                                         | Issue / Impact                                                                                             |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------- | :------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| **Todos Page**<br>[`todo-list.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/dashboard/todos/todo-list.tsx#L337-L482)           | `GET /api/todos`           | Hardcodes `limit: 100` on **all scopes** (`today`, `inbox`, `future`, `overdue`, `calendar`, `matrix`, `all`). | **No UI pagination.** If a user has > 100 tasks in any view, tasks past #100 are completely inaccessible.  |
| **Planning Page**<br>[`planning-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/planning/planning-page.tsx#L31-L38)         | `GET /api/planning`        | Hardcodes `limit: 100` with date range (`dateFrom`, `dateTo`).                                                 | **No page state or UI pagination.** Truncates at 100 plans without notice.                                 |
| **Calendar Events Page**<br>[`calendar-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/calendar/calendar-page.tsx#L96-L100) | `GET /api/calendar-events` | Hardcodes `limit: 100` for the active week/month view.                                                         | **No UI pagination.** If > 100 events exist in the selected period, only the first 100 are shown.          |
| **Goals Page**<br>[`goal-list.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/dashboard/goals/goal-list.tsx#L57)                 | `GET /api/goals`           | Sets `const DEFAULT_LIMIT = 100`.                                                                              | Fetches in batches of 100. While `<Pagination>` JSX exists, it only activates if a user exceeds 100 goals. |

---

### Category 2: Completely Unbounded "Get Many" Requests (No pagination in Backend OR Frontend)

These endpoints do not accept `page`, `limit`, or `offset` parameters at the database layer; they fetch **all** matching rows into memory.

| Page / Component                                                                                                                                                                                                                              | Backend Controller & Repository                                                                                                                                                                                                                                                                | Request / Query                                                                       | Risk / Impact                                                                                                                                                                                         |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Habits Page & Views**<br>[`habits-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/habits/habits-page.tsx#L80), `habits-weekly-view.tsx`, `habits-monthly-view.tsx`, `habits-settings-page.tsx` | [`habit.controller.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/server/modules/habits/habit.controller.ts#L32-L42)<br>[`habit.repository.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/server/modules/habits/habit.repository.ts) | `GET /api/habits`<br>`GET /api/habits/archived`                                       | Returns `HabitDTO[]` unbounded. All active habits are pulled into memory in one query without any limit/page parameters.                                                                              |
| **Public Knowledge Profile**<br>[`p/[userId]/page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/app/[locale]/p/[userId]/page.tsx#L43-L47)                                                                      | [`publicKnowledgeRepository`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/server/modules/public-knowledge/public-knowledge.repository.ts#L76-L91)                                                                                                                   | `getPublicBooks(userId)`<br>`getPublicCourses(userId)`<br>`getPublicArticles(userId)` | SQL query uses `WHERE userId = ? AND isPublic = true` with **no `LIMIT` or `OFFSET`**. If a public curator has 300 books or articles, the public page attempts to load all of them in a single query. |
| **Subscription Invoices**<br>[`subscription-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/dashboard/subscription/subscription-page.tsx#L44)                                                    | [`subscription.controller.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/server/modules/subscriptions/subscription.controller.ts)                                                                                                                                 | `GET /api/subscription/invoices`                                                      | Fetches all billing invoices for the user with no limit.                                                                                                                                              |

---

### Category 3: Child Sub-Collections (Fetched all-at-once by parent ID)

Inside detail pages, sub-items are fetched as complete sets without pagination:

1. **Book Entries / Notes:** [`book-detail-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/books/book-detail-page.tsx#L115) calls `apiClient.books.listEntries(id)` (loads all entries of a single book).
2. **Book Reading Progress Logs:** [`book-detail-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/books/book-detail-page.tsx#L124) calls `apiClient.books.listProgress(id)` (loads all progress sessions of a book).
3. **Course Sections & Lessons:** [`course-curriculum-sidebar.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/courses/course-curriculum-sidebar.tsx#L95) calls `apiClient.courses.listSections(id)` (loads all curriculum sections and lessons).
4. **Goal Steps:** `apiClient.goals.listSteps(goalId)` (loads all steps of a goal).
5. **Plan Sections:** `apiClient.planning.listSections(planningId)` (loads all sections of a plan).

---

### Category 4: Global Stores & Dialog Selectors Pre-fetching 100–150 items

These exist to populate dropdowns/filters across the application:

1. **Projects Store** ([`projects-store.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/projects/projects-store.tsx#L10)): Calls `apiClient.projects.list({ limit: 100, page: 1 })` to populate project filter chips across Notes and Todos. _(Note: The dedicated [`project-list.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/dashboard/projects/project-list.tsx) page properly paginates with `limit: 12`)._
2. **Tags Store** ([`tags-store.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/tags/tags-store.tsx#L10)): Calls `apiClient.tags.list({ limit: 150, page: 1 })` to populate tag pickers. _(Note: The dedicated [`dashboard-tags-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/dashboard/tags/dashboard-tags-page.tsx) uses `useSWRInfinite` with `limit: 10`)._
3. **Admin User-Segment & Topic Dialogs** ([`user-segment-dialog.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/admin/user-segment-dialog.tsx#L42)): Queries `apiClient.segments.list({ limit: 100, page: 1 })` to render segment options.

---

### Category 5: Pages with VERIFIED Proper Backend & UI Pagination

For comparison, these sections already implement backend-level pagination (`LIMIT`/`OFFSET` in SQL) and UI pagination (`<Pagination>` or `useSWRInfinite`):

- **Books Page** (`books-page.tsx`) — `limit: 30`, UI `<Pagination>`
- **Courses Page** (`courses-page.tsx`) — `limit: 24`, UI `<Pagination>`
- **Articles Page** (`articles-page.tsx`) — `limit: 12`, UI `<Pagination>`
- **Resources Page** (`resources-page.tsx`) — `limit: 24`, UI `<Pagination>`
- **Projects Page** (`project-list.tsx`) — `limit: 12`, UI `<Pagination>`
- **Documents Page** (`documents-page.tsx`) — `limit: 20`, UI `<Pagination>`
- **Notes Page** (`note-list.tsx`) — `limit: 30`, `useSWRInfinite` (Load More)
- **Tags Management Page** (`dashboard-tags-page.tsx`) — `limit: 10`, `useSWRInfinite`
- **Tag Items View** (`dashboard-tag-detail-page.tsx`) — `getItemsById` with UI `<Pagination>`
- **Journal Entries** (`journals-page.tsx`) — `useSWRInfinite` (Load More)
- **Public Blog List** (`blog-list-view.tsx`) — Server-side page routing with `<Pagination>`
- **Blog Comments** (`blog-comments-section.tsx`) — `PAGE_SIZE = 10`, "Load More"
- **Content Assets Library** (`assets-grid.tsx`) — `PAGE_SIZE = 12`, Next/Previous controls
- **Content Blogs Library** (`blogs-library-section.tsx`) — `LIMIT = 10`, UI `<Pagination>`
- **Newsletter Subscribers & Campaigns** (`newsletter-subscribers-table.tsx`) — `LIMIT = 10`, UI `<Pagination>`
- **Support Tickets & Feedbacks** (`support-tickets-panel.tsx`, `feedbacks-panel.tsx`) — `LIMIT = 20`, UI `<Pagination>`
- **Admin Tables** (Users, Coupons, Segments, Announcements) — All `LIMIT = 10` or `20`, UI `<Pagination>`
- **Notifications** (`notifications-panel.tsx`) — Cursor-based `useSWRInfinite` (`limit: 20`)

Ran command: `pnpm run dev`
Edited dashboard-layout.tsx
Edited sub-dashboard-overview.tsx
Edited sub-dashboard-overview.tsx
Edited dashboard.json
Edited dashboard.json
Edited dashboard-sidebar.tsx
Edited dashboard-sidebar.tsx
Viewed todos.md:224-232
Edited todos.md
