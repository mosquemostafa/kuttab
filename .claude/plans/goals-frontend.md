# Goals Frontend Implementation Plan

## Overview

Implement the full Goals frontend with:

1. A **list page** displaying goals as arch-shaped cards filled with red based on completion %
2. A **detail page** (`[goalId]`) showing goal details + progress graph over time
3. **Full CRUD** for goals and progress entries

## Routes

```
src/app/[locale]/(dashboards)/dashboard/goals/
├── page.tsx                           ← Replace ComingSoon with GoalList component
├── [goalId]/page.tsx                  ← New: goal detail page
└── actions.ts                         ← New: server actions for CRUD
```

## Components (`src/components/dashboard/goals/`)

### goal-arch-card.tsx

SVG-based arch card. Each goal is a horizontal arch (like a bridge/rainbow arc). The arch is filled with red color proportional to the completion percentage (sum of progress values / targetValue × 100). Shows:

- Icon + title + category
- Arch SVG with red gradient fill (hollow outline when 0%, fully filled red when 100%)
- Percentage label in center of arch
- Target date below
- Click navigates to `[goalId]` detail page
- 3-dot menu for edit/delete

### goal-progress-bar.tsx

The SVG arch rendering logic — a reusable `<path>` arc element. Takes `percentage` (0–100) and renders the arc stroke with appropriate fill. Used by `goal-arch-card`.

### goal-list.tsx (main list component, replaces ComingSoon)

- `useSWR` with `goalsApi.list(query)` for data fetching
- Debounced search input
- Status filter tabs (active / completed / archived — using `GoalStatus`)
- Category filter (dropdown from unique categories)
- Sort selector (createdAt, updatedAt, targetDate, priority)
- Pagination (same pattern as projects)
- Grid of `goal-arch-card` components
- "+" FAB button to create new goal
- Managed dialogs: create form, edit form, delete confirmation
- Wrap each card so clicking opens new progress dialog OR navigates to detail page

### goal-form-dialog.tsx

Reusable dialog for Create / Edit goal:

- Title (required)
- Description (optional, textarea)
- Motivation note (optional, textarea)
- Category (required, text input + suggested existing categories)
- Icon (emoji picker — reuse `EmojiPickerField`)
- Target value (required, number)
- Start date / Target date (date inputs)
- Priority (optional, number)
- Status (only shown in edit mode, select: active/completed/archived)

### goal-form-fields.tsx

Form fields extracted from the dialog for reusability.

### goal-progress-dialog.tsx

Dialog to log a new progress entry:

- Value (required number) — the progress amount to add
- Note (optional text)
- On create, immediately updates the goal's arch fill and chart

### goal-progress-chart.tsx

Recharts line chart (using existing `src/components/ui/chart.tsx`):

- X-axis: date (createdAt of progress entries)
- Y-axis: cumulative progress value sum
- Reference line at targetValue
- Shows the journey over time
- Empty state when no progress yet

### goal-detail.tsx

Composite component for the `[goalId]` detail page:

- Goal header (title, icon, category, dates, status badge)
- Description and motivation note
- Arch card showing current completion %
- Progress chart
- Progress list (table/timeline) with edit/delete per entry
- "Log Progress" button

### goal-card-skeleton.tsx

Loading skeleton matching the arch card shape.

## Data Flow

### List Page

```
Page load → SWR fetches GET /api/goals?status=active&page=1&limit=12
         → Renders grid of GoalArchCard
Search/filter → Updates SWR key → re-fetches
Create goal → Server action → mutate SWR → revalidate
Edit goal → Server action → mutate SWR → revalidate
Delete goal → Server action → mutate SWR → revalidate
```

### Detail Page

```
Page load → SWR fetches GET /api/goals/[id] + GET /api/goals/[id]/progress
         → Renders header + progress chart + progress list
Log progress → Server action → mutate SWR → revalidate
```

## Server Actions (`goal.actions.ts`)

Following the **projects pattern** (`projects/actions.ts`):

- `createGoalAction(input: unknown): Promise<ActionResult<GoalDTO>>`
- `updateGoalAction(id: string, input: unknown): Promise<ActionResult<GoalDTO>>`
- `deleteGoalAction(id: string): Promise<ActionResult<null>>`
- `createGoalProgressAction(goalId: string, input: unknown): Promise<ActionResult<GoalProgressDTO>>`
- `updateGoalProgressAction(goalId: string, progressId: string, input: unknown): Promise<ActionResult<GoalProgressDTO>>`
- `deleteGoalProgressAction(goalId: string, progressId: string): Promise<ActionResult<null>>`

Each action: validates session, parses Zod schema, calls service, returns ActionResult.

## Completion Calculation

```ts
completionPercentage = (totalProgressSum / targetValue) * 100;
// Clamp to [0, 100]
```

The frontend computes this from the progress data list. For the arch card on the list page — since `listProgress` is a separate API call — we use a lightweight approach: either fetch progress for all visible goals on mount, or (better) display the percentage as 0% on the list and compute it properly on the detail page.

Actually, better approach: the goal arch card on the list page can get progress percentage as a separate lightweight call, OR we store a computed `progress` field. But since the backend doesn't expose this, we'll fetch progress per goal in parallel on the list page (batched). Or simpler: use a small info badge instead (e.g., "0 / 100") that just shows target value and maybe a progress indicator. For the arch fill on the list page, the user needs to see an approximate visual — we can lazily fetch progress for each card.

**Decision**: Fetch progress for all visible goals in parallel on the list page using `goalsApi.listProgress` for each, then compute percentages. Cache with SWR so revisits are instant.

## Translations (`src/messages/en/goals.json`, `src/messages/ar/goals.json`)

Following the projects.json structure:

```json
{
  "title": "Goals",
  "subtitle": "...",
  "actions": {
    "success": { "created": "...", "updated": "...", "deleted": "..." },
    "errors": { "notAuthenticated": "...", "invalidInput": "...", "generic": "..." }
  },
  "list": {
    "searchPlaceholder": "...",
    "createCardTitle": "...",
    "empty": "...",
    "emptyFiltered": "...",
    "loadError": "...",
    "edit": "...",
    "delete": "...",
    "save": "...",
    "cancel": "...",
    "confirmDelete": "...",
    "deleting": "...",
    "pagination": { "page": "...", ... },
    "statusFilter": "...",
    "sortBy": "...",
    "allStatuses": "...",
    "categoryPlaceholder": "..."
  },
  "detail": {
    "backToGoals": "...",
    "editGoal": "...",
    "deleteGoal": "...",
    "logProgress": "...",
    "editProgress": "...",
    "deleteProgress": "...",
    "completion": "{percentage}% complete",
    "noProgress": "...",
    "targetValue": "Target: {value}",
    "progress": "Progress",
    "overTime": "..."
  },
  "form": {
    "titleLabel": "...",
    "titlePlaceholder": "...",
    "descriptionLabel": "...",
    "motivationNoteLabel": "...",
    "categoryLabel": "...",
    "categoryPlaceholder": "...",
    "targetValueLabel": "...",
    "startDateLabel": "...",
    "targetDateLabel": "...",
    "iconLabel": "...",
    "priorityLabel": "...",
    "statusLabel": "..."
  },
  "progressForm": {
    "valueLabel": "...",
    "valuePlaceholder": "...",
    "noteLabel": "...",
    "submit": "...",
    "submitting": "..."
  },
  "statuses": {
    "active": "Active",
    "completed": "Completed",
    "archived": "Archived"
  }
}
```

## Metadata

Add goal detail metadata in `metadata.json`:

```json
"goals": {
  "detailTitle": "{name} | Goals | modawim Dashboard",
  "detailDescription": "Track progress and view analytics for the \"{name}\" goal."
}
```

## Files to Create

1. `src/components/dashboard/goals/goal-arch-card.tsx`
2. `src/components/dashboard/goals/goal-list.tsx`
3. `src/components/dashboard/goals/goal-form-dialog.tsx`
4. `src/components/dashboard/goals/goal-progress-dialog.tsx`
5. `src/components/dashboard/goals/goal-detail.tsx`
6. `src/components/dashboard/goals/goal-progress-chart.tsx`
7. `src/app/[locale]/(dashboards)/dashboard/goals/[goalId]/page.tsx`
8. `src/app/[locale]/(dashboards)/dashboard/goals/actions.ts`
9. `src/messages/en/goals.json`
10. `src/messages/ar/goals.json`

## Files to Modify

1. `src/app/[locale]/(dashboards)/dashboard/goals/page.tsx` — Replace ComingSoon → GoalList
2. `src/messages/en/metadata.json` — Add goal detail title/description

## Implementation Order

1. Create translations files (en/ar goals.json)
2. Update metadata.json
3. Create server actions
4. Create the SVG arch card component (the visual centerpiece)
5. Create goal form dialog + fields
6. Create progress dialog
7. Create progress chart (Recharts)
8. Create goal detail page composite component
9. Create the main goal list component
10. Update goal list page route
11. Create [goalId] detail page route
