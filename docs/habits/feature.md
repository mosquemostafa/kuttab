- grouping habits by topic
- tracking steak
- habits of goal as counter and habits of goals as streak
- grid view and list view in the daily
- complete all button
- weekly view
- habits will be boolean achieve and not ones with counter like drink water
- analytics and graphs
- daily and weekly and monthly and yearly view
- custom repetition modes
- motivation note
- ability to archive a habit
- showing a progress bar in the daily views
- tags system

## Schema

habits

- id
- userId
- name: string not null
- description: string
- tag: string
- color TEXT,
- repetitionType "daily" | "weekly" | "monthly"
- specificDays: number[] (0 - > 6 in weekly , 1 -> 31 in monthly)
- bestStreak: number;
- totalTarget: number;
- isArchived: boolean;
- motivationNote?: string;
- position: number
- startDate: Date;
- endDate: Date;
- createdAt: Date;
- updatedAt: Date;

habits completions

- id
- habit_id
- user_id
- completed_on
- created_at
  UNIQUE (habit_id, completed_on)

=====

now its time to create a new module called habits

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────
CREATE TYPE repetition_type AS ENUM ('daily', 'weekly', 'monthly');

-- ─────────────────────────────────────────
-- HABITS
-- ─────────────────────────────────────────
CREATE TABLE habits (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

-- display
name TEXT NOT NULL,
description TEXT,
tag TEXT,
color TEXT,
icon TEXT,
position SMALLINT NOT NULL DEFAULT 0,
motivation_note TEXT,

-- repetition
repetition_type repetition_type NOT NULL DEFAULT 'daily',
specific_days SMALLINT[] NOT NULL DEFAULT '{}',
-- daily → always empty {}
-- weekly → [0..6] 0 = Sun, 6 = Sat
-- monthly → [1..31]

-- streak
current_streak INT NOT NULL DEFAULT 0,
best_streak INT NOT NULL DEFAULT 0,

-- lifecycle
start_date DATE NOT NULL DEFAULT CURRENT_DATE,
end_date DATE,
is_archived BOOLEAN NOT NULL DEFAULT FALSE,

created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- HABIT COMPLETIONS
-- ─────────────────────────────────────────
CREATE TABLE habit_completions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
completed_on DATE NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

UNIQUE (habit_id, completed_on)
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────

-- active habits per user, ordered for display
CREATE INDEX idx_habits_user_active
ON habits (user_id, position)
WHERE is_archived = FALSE;

-- archived habits per user
CREATE INDEX idx_habits_user_archived
ON habits (user_id, updated_at DESC)
WHERE is_archived = TRUE;

-- completions by user + date (daily/weekly/monthly views, progress bar)
CREATE INDEX idx_completions_user_date
ON habit_completions (user_id, completed_on DESC);

-- completions by habit + date (streak calc, per-habit analytics)
CREATE INDEX idx_completions_habit_date
ON habit_completions (habit_id, completed_on DESC);
