# Streak Implementation Plan & Execution Log

Comprehensive implementation specification and execution record for the Modawim denormalized streak system (Daily habits only).

---

## Architecture Summary

- **Storage**: Two denormalized columns on `habits` table (`current_streak`, `streak_updated_on`).
- **Read Cost**: $O(0)$ extra DB queries. Pure in-memory staleness comparison in `toHabitDTO`.
- **Write Cost**: $O(1)$ fast arithmetic for regular completions; backward-walk recalculation for edge cases (uncompleting middle dates, backfilling, repetition changes).
- **Timezone Model**: 100% pure calendar date strings (`YYYY-MM-DD`). Zero timezone offsets or daylight saving time drift.

---

## Implemented Steps

### Step 1 — Database Schema & Migration

- **Files Modified**: [`src/server/modules/habits/habit.entity.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/server/modules/habits/habit.entity.ts)
- **Changes**:
  ```ts
  currentStreak: smallint("current_streak").notNull().default(0),
  streakUpdatedOn: date("streak_updated_on", { mode: "string" }),
  ```
- **Generated Migration**: [`drizzle/0010_curious_quasar.sql`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/drizzle/0010_curious_quasar.sql)

---

### Step 2 — Shared TypeScript Types

- **Files Modified**: [`src/shared/types/habit.types.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/shared/types/habit.types.ts)
- **Changes**:
  Added `currentStreak: number` to `HabitDTO`.

---

### Step 3 — Repository Layer

- **Files Modified**: [`src/server/modules/habits/habit.repository.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/server/modules/habits/habit.repository.ts)
- **Changes**:
  1. Extended `HabitUpdateData` to accept `currentStreak?: number` and `streakUpdatedOn?: string | null`.
  2. Implemented `updateStreak(id: string, userId: string, currentStreak: number, streakUpdatedOn: string | null)`.

---

### Step 4 — Pure Date Utilities & Hybrid Service Logic

- **Files Modified**: [`src/server/modules/habits/habit.service.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/server/modules/habits/habit.service.ts)
- **Date Functions**:
  - `shiftIsoDate(dateStr, days)`: Uses UTC epoch arithmetic (`Date.UTC`) to shift days without time-zone or DST shifts.
  - `addIsoDay(dateStr)` / `subtractIsoDay(dateStr)`
  - `todayIsoDate()`
- **Staleness Resolution**:
  - `resolveDisplayStreak(repetitionType, currentStreak, streakUpdatedOn, today)`
  - If `streakUpdatedOn < subtractIsoDay(today)`, returns `0` (streak broke).
- **Hybrid Methods**:
  - `completeHabit`:
    - If habit has no `streakUpdatedOn` (legacy/uninitialized), triggers JIT recalculation.
    - If `completedOn < habit.streakUpdatedOn` (backfill), triggers recalculation.
    - Otherwise, runs $O(1)$ fast arithmetic (`+1`, idempotent, or reset).
  - `uncompleteHabit`:
    - Automatically triggers `recalculateHabitStreak` to properly handle streak tip or middle-date deletions.
  - `bulkComplete`:
    - Extends streak if today or yesterday is completed; runs recalculation if backfilling earlier dates.
  - `updateHabit`:
    - When changing repetition type from weekly/monthly $\rightarrow$ daily, triggers `recalculateHabitStreak`.
  - `recalculateHabitStreak`:
    - Source of truth: fetches completion dates up to today, walks backward unbroken chain, persists `currentStreak` and `streakUpdatedOn`.

---

### Step 5 — API Controller & Route Handlers

- **Controller**: [`src/server/modules/habits/habit.controller.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/server/modules/habits/habit.controller.ts)
  - Added `recalculateStreak(userId: string, habitId: string)` returning `ApiSuccess<HabitDTO>`.
- **Route Handler**: [`src/app/api/habits/[id]/recalculate-streak/route.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/app/api/habits/[id]/recalculate-streak/route.ts)
  - `POST /api/habits/[id]/recalculate-streak` wrapped with `compose(withErrorHandler, withAuth)`.
  - Annotated with OpenAPI/Swagger JSDoc.
- **Client SDK**: [`src/lib/api/habits.api.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/lib/api/habits.api.ts)
  - Added `apiClient.habits.recalculateStreak(habitId)`.

---

### Step 6 — Frontend UI Integration

1. **Daily Habits View** ([`habits-daily-view.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/habits/habits-daily-view.tsx)):
   - Renders `🔥 X` flame badge next to daily habit titles.
   - Amber badge with border when `streak > 0`, muted neutral when `streak = 0`.
   - Tooltip shows localized days count (`streakTitle`).

2. **Weekly Habits View** ([`habits-weekly-view.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/habits/habits-weekly-view.tsx)):
   - Sticky habit column uses `justify-between` layout (RTL & LTR friendly).
   - Streak badge positioned opposite the habit title and icon.
   - Optimistic streak updates when toggling today's checkmark.
   - Synchronous `Promise.all([mutateCompletions(), mutateHabits()])` on toggles.

3. **Habit Settings View** ([`habits-settings-list.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/habits/habits-settings-list.tsx)):
   - Shows streak badge in list items.
   - Includes quick-action button with rotating refresh icon to recalculate streak.

4. **Habit Details / Analytics View** ([`habit-analytics-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/habits/habit-analytics-page.tsx)):
   - Added current streak metric card.
   - Recalculate streak button with loading indicator and localized toast alerts.

---

### Step 7 — Localization & Seeding

- **Messages**:
  - `src/messages/en/habits.json` and `src/messages/ar/habits.json` updated with:
    - `streakTitle` (with pluralization rules: 1 day, 2 days, few, many, other)
    - `recalculateStreak`, `recalculating`, `recalculateStreakSuccess`, `recalculateStreakFailed`
- **Seeder**:
  - Updated [`scripts/seeder/seed.service.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/scripts/seeder/seed.service.ts) to seed realistic initial streaks on sample habits.

---

### Step 8 — Production Backfill Script & CLI Runner

- **Backfill Script**: [`scripts/backfill-streaks.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/scripts/backfill-streaks.ts)
  - Optimized worker pool with `CONCURRENCY = 10` matching Postgres connection pool.
  - Direct completion scan + update (bypasses redundant fetches).
  - Processes ~2,000 habits in **~20 to 30 seconds**.
- **CLI Runner**: [`scripts/db-cli.mjs`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/scripts/db-cli.mjs)
  - Integrated `backfill-streaks [target]` action.
  - Enforces `confirmIfProd()` requiring the user to type `"production"` before running on prod.
- **Package.json Scripts**:
  - `pnpm db:backfill:streaks:local`
  - `pnpm db:backfill:streaks:prod`

---

## Verification Checklist

- [x] Schema migration generated cleanly (`0010_curious_quasar.sql`)
- [x] TypeScript typechecking passes with zero errors (`pnpm typecheck`)
- [x] ESLint passes with zero errors (`pnpm lint`)
- [x] i18n translation keys valid for Arabic (RTL) and English (LTR)
- [x] Optimistic updates verified in both daily and weekly views
- [x] Database backfill script tested and optimized for production volume
