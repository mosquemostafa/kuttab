# Streak System Design — Daily Habits

## 1. Overview & Core Philosophy

Modawim tracks **current streak** for daily habits with **zero extra calculation overhead on GET routes**.

Rather than calculating streaks via complex queries, subqueries, or background cron workers on read:

1. **Denormalized persistence**: Two columns are stored directly on the `habits` table.
2. **Hybrid execution**:
   - **Fast Path ($O(1)$ arithmetic)** handles >90% of daily actions (completing today, consecutive days, same-day idempotency).
   - **Recalculation Path (Backward-walk)** handles edge cases (uncompleting middle dates, backfilling past gaps, switching repetitions, JIT migration).
3. **Pure Calendar Dates**: All streak operations are anchored to ISO date strings (`YYYY-MM-DD`). Timezones and daylight saving time (DST) are completely ignored.
4. **Zero-Cost Read Path**: GET endpoints read the habit row directly. A pure, in-memory staleness comparison determines whether `currentStreak` is still active or displays as `0`.

---

## 2. Schema Specification

The `habits` table includes two dedicated columns:

```sql
current_streak    SMALLINT  NOT NULL  DEFAULT 0
streak_updated_on DATE      NULL
```

In Drizzle ORM ([`habit.entity.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/server/modules/habits/habit.entity.ts)):

```ts
currentStreak: smallint("current_streak").notNull().default(0),
streakUpdatedOn: date("streak_updated_on", { mode: "string" }),
```

| Column            | Type                  | Role                                                                                                                      |
| ----------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `currentStreak`   | `smallint`            | The number of consecutive daily completions ending on `streakUpdatedOn`. Delivered directly to the client via `HabitDTO`. |
| `streakUpdatedOn` | `date` (`YYYY-MM-DD`) | The calendar date of the last evaluation / streak tip. Acts as the **staleness anchor**.                                  |

> [!IMPORTANT]
> `streakUpdatedOn` is stored in Postgres as `DATE { mode: "string" }`. It is never parsed as a JavaScript `Date` with local time or converted to timestamps. All arithmetic treats dates as pure UTC calendar days (`Date.UTC(y, m-1, d + shift)`).

---

## 3. Pure Calendar Date Arithmetic (Timezone-Agnostic)

All date shifts operate on pure ISO strings without timezone offsets:

```ts
function shiftIsoDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return d.toISOString().slice(0, 10);
}

function addIsoDay(dateStr: string): string {
  return shiftIsoDate(dateStr, 1);
}

function subtractIsoDay(dateStr: string): string {
  return shiftIsoDate(dateStr, -1);
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
```

---

## 4. The Read Path (Zero Cost)

When fetching habits via `GET /api/habits`:

- No joins to `habit_completions`.
- No aggregate queries.
- Pure in-memory projection in [`toHabitDTO`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/server/modules/habits/habit.service.ts):

```ts
function resolveDisplayStreak(
  repetitionType: string,
  currentStreak: number,
  streakUpdatedOn: string | null,
  today: string,
): number {
  if (repetitionType !== "daily") return 0;
  if (!streakUpdatedOn || currentStreak === 0) return 0;

  const yesterday = subtractIsoDay(today);
  // Valid if last completed today or yesterday (today is still open)
  return streakUpdatedOn >= yesterday ? currentStreak : 0;
}
```

### Staleness Examples:

- User completed yesterday (`2026-11-01`), today is `2026-11-02`: Display = `currentStreak` (today is not over yet).
- User completed today (`2026-11-02`), today is `2026-11-02`: Display = `currentStreak`.
- User last completed 5 days ago (`2026-10-28`), today is `2026-11-02`: Display = `0` (streak broke, zero DB updates required on read).

---

## 5. The Hybrid Write Path

```
                    ┌────────────────────────────┐
                    │ Habit Completion Action    │
                    └──────────────┬─────────────┘
                                   │
                     Is daily & streakUpdatedOn?
                                   │
                 ┌─────────────────┴─────────────────┐
                 │ YES                               │ NO / Uninitialized
                 ▼                                   ▼
        Evaluate Date Target                 [JIT Recalculate]
                 │
       ┌─────────┼───────────────┐
       ▼         ▼               ▼
   [Today /   [Backfill /     [Uncomplete /
   Tomorrow]   Past Date]      Middle Date]
       │         │               │
       ▼         ▼               ▼
  Fast O(1)   Backward-Walk   Backward-Walk
  Arithmetic  Recalculation   Recalculation
```

### A. Fast Path ($O(1)$) — 90%+ of Events

Triggered when completing `today` or consecutive `streakUpdatedOn + 1`:

```ts
if (!streakUpdatedOn) {
  // First ever completion or uninitialized
  newStreak = 1;
  newUpdatedOn = completedOn;
} else if (completedOn === streakUpdatedOn) {
  // Same-day idempotent
  newStreak = currentStreak;
  newUpdatedOn = streakUpdatedOn;
} else if (completedOn === addIsoDay(streakUpdatedOn)) {
  // Consecutive day -> extend
  newStreak = currentStreak + 1;
  newUpdatedOn = completedOn;
} else if (completedOn > addIsoDay(streakUpdatedOn)) {
  // Gap detected -> restart streak
  newStreak = 1;
  newUpdatedOn = completedOn;
}
```

### B. Recalculation Path (Backward-Walk) — Edge Cases

Triggered when:

1. **Uncompleting any date** (`uncompleteHabit`): If the uncompleted date broke the chain or was the tip, walk backwards from `today` / `yesterday` to determine the exact unbroken chain.
2. **Backfilling a past date** (`completedOn < streakUpdatedOn`): Completing a date in the past might bridge an older gap and connect two streaks into a longer one.
3. **Changing habit repetition** (`updateHabit`): Switching from `weekly` or `monthly` $\rightarrow$ `daily` automatically recalculates streak from past logs.
4. **Explicit user recalculation**: Invoking `POST /api/habits/[id]/recalculate-streak`.

#### The Backward-Walk Algorithm:

```ts
async function recalculateHabitStreak(userId: string, habitId: string) {
  const today = todayIsoDate();
  const completions = await habitRepository.listCompletionsByHabitAndDateRange(
    userId,
    habitId,
    "1970-01-01",
    today,
  );
  const dates = Array.from(new Set(completions.map((c) => c.completedOn)));

  if (dates.length === 0) {
    return updateStreak(habitId, userId, 0, null);
  }

  const yesterday = subtractIsoDay(today);
  const latestDate = dates[0]; // ordered DESC

  // If latest completion is before yesterday, streak is broken
  if (latestDate < yesterday) {
    return updateStreak(habitId, userId, 0, latestDate);
  }

  // Count consecutive unbroken days backward
  let streak = 1;
  let expectedDate = latestDate;

  for (let i = 1; i < dates.length; i++) {
    const prevDay = subtractIsoDay(expectedDate);
    if (dates[i] === prevDay) {
      streak += 1;
      expectedDate = prevDay;
    } else {
      break;
    }
  }

  return updateStreak(habitId, userId, streak, latestDate);
}
```

---

## 6. Edge Cases Analysis

| Scenario                                      | Handled By                       | Outcome                                                              |
| --------------------------------------------- | -------------------------------- | -------------------------------------------------------------------- |
| User opens app after 5 days inactivity        | Read Staleness Check             | Stored streak is ignored; displays `0`. Zero writes.                 |
| Complete today, then complete today again     | Fast Path ($O(1)$)               | Idempotent; streak unchanged.                                        |
| Complete yesterday (no gaps)                  | Fast Path ($O(1)$)               | Extends streak or restarts cleanly.                                  |
| Backfill completion from 3 days ago           | Recalculation Path               | Scans completions, re-connects chains if unbroken.                   |
| Uncomplete today's checkmark                  | Recalculation Path               | Decrements streak to yesterday's value.                              |
| Uncomplete a date in the middle of a streak   | Recalculation Path               | Chain breaks; streak recalculates to only the days after the gap.    |
| Habit switched from daily to weekly           | Read Staleness Check             | Displays `0` (streaks are daily only).                               |
| Habit switched from weekly to daily           | Service Update Hook              | Automatically triggers recalculation.                                |
| Existing legacy habit (uninitialized columns) | JIT Safety Net + Backfill Script | JIT computes on first write; CLI script backfills all existing rows. |

---

## 7. Frontend Integration & Optimistic UI

### 1. Daily Habits View ([`habits-daily-view.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/habits/habits-daily-view.tsx))

- Flame badge with active amber styling (`bg-amber-500/10 text-amber-600 border-amber-500/20`) when `currentStreak > 0`.
- Optimistic increment/decrement on today's completions for instant 0ms feedback.

### 2. Weekly Habits View ([`habits-weekly-view.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/habits/habits-weekly-view.tsx))

- Sticky habit cell displays the flame badge opposite the habit title (`justify-between`).
- Optimistic update when today's column is toggled.
- Concurrent SWR revalidation (`Promise.all([mutateCompletions(), mutateHabits()])`).

### 3. Habit Settings List ([`habits-settings-list.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/habits/habits-settings-list.tsx))

- Displays current streak badge for each daily habit.
- Includes a quick-action "Recalculate streak" button.

### 4. Habit Analytics / Details Page ([`habit-analytics-page.tsx`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/src/components/habits/habit-analytics-page.tsx))

- Metric card displaying current streak.
- Dedicated "Recalculate streak" button with toast confirmation.

---

## 8. Migration & Production Backfill Tool

A production-grade CLI tool is provided to initialize all existing production habits:

- **Location**: [`scripts/backfill-streaks.ts`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/scripts/backfill-streaks.ts)
- **Database Runner**: [`scripts/db-cli.mjs`](file:///Users/aanassar/Documents/projects/modawim/modawim-codebase/scripts/db-cli.mjs)
- **Concurrency**: Worker pool with `CONCURRENCY = 10` matching the Postgres connection pool.
- **Performance**: Eliminates redundant SELECT queries, backfilling ~2,000 habits in **~20 to 30 seconds**.
- **Production Guard**: Requires typing `"production"` before executing against production database.

```bash
# Local execution
pnpm db:backfill:streaks:local

# Production execution
pnpm db:backfill:streaks:prod
```
