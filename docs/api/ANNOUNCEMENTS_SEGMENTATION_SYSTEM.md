# Announcements and User Segmentation System Documentation

This document describes the complete announcements implementation and user segmentation update currently present in the codebase.

## 1) What It Solves

The system provides:

- Admin-managed announcements (draft/published) with bilingual content (Arabic + English)
- Targeted delivery by audience:
  - all users
  - specific role (`user`, `support`, `admin`)
  - specific user segment
- Unseen announcement tracking per user with idempotent mark-as-seen
- End-user updates history page with seen state
- Modal-based first-seen announcement experience across dashboard pages
- Segment CRUD for admins
- Per-user segment assignment from the admin users table
- Segment-aware sorting in the admin users list

## 2) Core Domain Model

### Announcement Type Enum

Defined in [src/shared/enums/announcement-type.enum.ts](../../src/shared/enums/announcement-type.enum.ts):

- `feature`
- `improvement`
- `fix`
- `maintenance`
- `alert`
- `promotion`

### Announcement Target Type Enum

Defined in DB schema and SQL migration:

- `all`
- `role`
- `segment`

Files:

- [src/db/schema.ts](../../src/db/schema.ts)
- [drizzle/0008_announcements.sql](../../drizzle/0008_announcements.sql)

### Segment DTO

Defined in [src/shared/types/segment.types.ts](../../src/shared/types/segment.types.ts):

- `id`
- `name`
- `emoji`
- `createdAt`
- `updatedAt`

### Announcement DTOs

Defined in [src/shared/types/announcement.types.ts](../../src/shared/types/announcement.types.ts):

- `AnnouncementDTO`
  - `id`, `titleAr`, `titleEn`, `contentAr`, `contentEn`, `type`, `publishedAt`
- `AnnouncementHistoryItemDTO`
  - all fields above + `seen`
- `AdminAnnouncementDTO`
  - announcement fields + targeting fields + publication fields + `seenCount`

### User Model Extension

User contracts now include segment information.

Files:

- [src/shared/types/user.types.ts](../../src/shared/types/user.types.ts)
- [src/server/modules/users/user.entity.ts](../../src/server/modules/users/user.entity.ts)

Added fields:

- `segmentId: string | null`
- `segment: { id, name, emoji } | null`

## 3) Database Schema and Migrations

### Segments

Migration: [drizzle/0007_segments.sql](../../drizzle/0007_segments.sql)

- Creates `segment` table:
  - `id` (PK)
  - `name` (unique)
  - `emoji`
  - `created_at`, `updated_at`
- Adds `user.segment_id` FK -> `segment.id` (`ON DELETE SET NULL`)
- Adds indexes:
  - `user_segment_id_idx`
  - `segment_name_idx`

### Announcements

Migration: [drizzle/0008_announcements.sql](../../drizzle/0008_announcements.sql)

- Creates enum `announcement_target_type`
- Creates `announcement` table:
  - `id` (PK)
  - content fields (initially `title`, `content`)
  - `type`
  - `target_type`, `target_value`
  - `created_by` FK -> `user.id` (`ON DELETE CASCADE`)
  - `created_at`, `published_at`, `expires_at`
- Creates `users_announcement` table (seen join table):
  - `id` (PK)
  - `user_id` FK -> `user.id` (`ON DELETE CASCADE`)
  - `announcement_id` FK -> `announcement.id` (`ON DELETE CASCADE`)
  - `seen_at`
  - unique (`user_id`, `announcement_id`)
- Adds indexes for query performance

### Announcements i18n Column Upgrade

Migration: [drizzle/0009_announcement_i18n_fields.sql](../../drizzle/0009_announcement_i18n_fields.sql)

- Renames:
  - `title` -> `title_ar`
  - `content` -> `content_ar`
- Adds:
  - `title_en`
  - `content_en`
- Backfills English columns from Arabic values
- Sets English columns as `NOT NULL`

### Drizzle Schema Source

Current source of truth: [src/db/schema.ts](../../src/db/schema.ts)

Key tables:

- `segment`
- `announcement`
- `usersAnnouncement`
- `user` (with `segmentId`)

## 4) Targeting and Visibility Rules

Targeting is implemented in [src/server/modules/announcements/announcement.repository.ts](../../src/server/modules/announcements/announcement.repository.ts), mainly through `getUserTargetedAnnouncements(userId)`.

An announcement is visible to a user only when all conditions are true:

1. Published: `published_at IS NOT NULL`
2. Not expired:
   - `expires_at IS NULL` OR
   - `expires_at > now()`
3. Audience match:
   - `target_type = all`, or
   - `target_type = role` and `target_value = user.role`, or
   - `target_type = segment` and `target_value = user.segment_id`

Seen tracking behavior:

- Seen state is stored in `users_announcement`
- Unseen = targeted announcements with no row in `users_announcement`
- Marking seen uses upsert-safe behavior (`onConflictDoNothing`) for idempotency

## 5) Roles and Access Rules

### Admin-only endpoints

- `/api/admin/announcements*`
- `/api/admin/segments*`
- `/api/admin/users/{id}/segment`

All protected with:

- `withAdmin`
- `withErrorHandler`

### Authenticated user endpoints

- `/api/announcements`
- `/api/announcements/unseen`
- `/api/announcements/unseen-count`
- `/api/announcements/mark-seen`

Protected with:

- `withAuth`
- `withErrorHandler`

## 6) Backend Architecture

### Announcements Module

Files:

- [src/server/modules/announcements/announcement.dto.ts](../../src/server/modules/announcements/announcement.dto.ts)
- [src/server/modules/announcements/announcement.controller.ts](../../src/server/modules/announcements/announcement.controller.ts)
- [src/server/modules/announcements/announcement.service.ts](../../src/server/modules/announcements/announcement.service.ts)
- [src/server/modules/announcements/announcement.repository.ts](../../src/server/modules/announcements/announcement.repository.ts)

Highlights:

- DTO validation via Zod (`create`, `update`, `markSeen`, list queries)
- Service maps DB rows to transport DTOs and enforces not-found behavior
- Repository handles all targeting, unseen logic, seen inserts, and paginated admin/user listing

### Segments Module

Files:

- [src/server/modules/segments/segment.dto.ts](../../src/server/modules/segments/segment.dto.ts)
- [src/server/modules/segments/segment.controller.ts](../../src/server/modules/segments/segment.controller.ts)
- [src/server/modules/segments/segment.service.ts](../../src/server/modules/segments/segment.service.ts)
- [src/server/modules/segments/segment.repository.ts](../../src/server/modules/segments/segment.repository.ts)

Highlights:

- Name uniqueness handling maps DB unique violations to `ConflictException`
- Supports search by segment `name` or `emoji`
- Supports paginated list/get/create/update/delete

### Users Module Integration

Relevant files:

- [src/server/modules/users/admin-user.controller.ts](../../src/server/modules/users/admin-user.controller.ts)
- [src/server/modules/users/dto/admin-mutations.dto.ts](../../src/server/modules/users/dto/admin-mutations.dto.ts)
- [src/server/modules/users/user.service.ts](../../src/server/modules/users/user.service.ts)
- [src/server/modules/users/user.repository.ts](../../src/server/modules/users/user.repository.ts)

Highlights:

- Adds user segment mutation: `updateUserSegment(userId, segmentId)`
- Enriches user list/detail payloads with segment object
- Adds `segmentId` as an allowed sort key in list query contracts

## 7) API Endpoints Summary

### Admin Announcements

Routes:

- [src/app/api/admin/announcements/route.ts](../../src/app/api/admin/announcements/route.ts)
- [src/app/api/admin/announcements/[id]/route.ts](../../src/app/api/admin/announcements/%5Bid%5D/route.ts)

Endpoints:

- `GET /api/admin/announcements?page=&limit=`
  - list with pagination and seen stats
- `POST /api/admin/announcements`
  - create draft or publish immediately
- `PATCH /api/admin/announcements/{id}`
  - update content and publication/expires timestamps
- `DELETE /api/admin/announcements/{id}`

Request shape (create):

- `titleAr`, `titleEn`
- `contentAr`, `contentEn`
- `type`
- `targetType`
- `targetValue` (required for `role`/`segment`, null for `all`)
- `publish` (boolean)
- `expiresAt` (nullable datetime)

### User Announcements

Routes:

- [src/app/api/announcements/route.ts](../../src/app/api/announcements/route.ts)
- [src/app/api/announcements/unseen/route.ts](../../src/app/api/announcements/unseen/route.ts)
- [src/app/api/announcements/unseen-count/route.ts](../../src/app/api/announcements/unseen-count/route.ts)
- [src/app/api/announcements/mark-seen/route.ts](../../src/app/api/announcements/mark-seen/route.ts)

Endpoints:

- `GET /api/announcements?page=&limit=`
  - paginated history with `seen` boolean
- `GET /api/announcements/unseen`
  - list unseen targeted announcements
- `GET /api/announcements/unseen-count`
  - unseen count for badge/bootstrap
- `POST /api/announcements/mark-seen`
  - marks selected announcement ids seen for current user

### Admin Segments

Routes:

- [src/app/api/admin/segments/route.ts](../../src/app/api/admin/segments/route.ts)
- [src/app/api/admin/segments/[id]/route.ts](../../src/app/api/admin/segments/%5Bid%5D/route.ts)

Endpoints:

- `GET /api/admin/segments?q=&page=&limit=`
- `POST /api/admin/segments`
- `GET /api/admin/segments/{id}`
- `PATCH /api/admin/segments/{id}`
- `DELETE /api/admin/segments/{id}`

### Admin User Segment Assignment

Route:

- [src/app/api/admin/users/[id]/segment/route.ts](../../src/app/api/admin/users/%5Bid%5D/segment/route.ts)

Endpoint:

- `PATCH /api/admin/users/{id}/segment`
  - body: `{ segmentId: string | null }`

## 8) Frontend Integration

### Dashboard Bootstrap and Modal Flow

The dashboard layout preloads unseen announcements, then opens a modal when needed.

Files:

- [src/app/[locale]/(dashboards)/dashboard/layout.tsx](<../../src/app/%5Blocale%5D/(dashboards)/dashboard/layout.tsx>)
- [src/components/announcements/announcement-provider.tsx](../../src/components/announcements/announcement-provider.tsx)
- [src/components/announcements/announcement-carousel-modal.tsx](../../src/components/announcements/announcement-carousel-modal.tsx)

Behavior:

1. Server layout fetches unseen count and unseen list using request cookies.
2. `AnnouncementProvider` receives initial data.
3. If unseen announcements exist, modal opens automatically.
4. Closing modal triggers mark-all-seen behavior.
5. Badge count is reset in client state.

### Updates/News Page

Files:

- [src/app/[locale]/(dashboards)/dashboard/updates/page.tsx](<../../src/app/%5Blocale%5D/(dashboards)/dashboard/updates/page.tsx>)
- [src/components/announcements/updates-news-list.tsx](../../src/components/announcements/updates-news-list.tsx)

Behavior:

- Shows paginated history of targeted announcements
- Marks unseen items seen when they are loaded in history
- Uses locale-aware title/content (`titleAr`/`titleEn`, `contentAr`/`contentEn`)

### Header Badge Integration

Files:

- [src/components/header-user-controls.tsx](../../src/components/header-user-controls.tsx)
- [src/components/announcements/announcement-badge.tsx](../../src/components/announcements/announcement-badge.tsx)

Behavior:

- Updates link points to `/updates`
- Badge displays unseen count (`99+` cap)

### Admin Announcement Management UI

Files:

- [src/app/[locale]/(dashboards)/admin/announcements/page.tsx](<../../src/app/%5Blocale%5D/(dashboards)/admin/announcements/page.tsx>)
- [src/components/admin/admin-announcements-table.tsx](../../src/components/admin/admin-announcements-table.tsx)

Features:

- Create with target type + target value
- Segment picker with search
- Draft/publish toggle
- Edit/delete existing announcements
- Seen count and pagination

### Admin Segment Management UI

Files:

- [src/app/[locale]/(dashboards)/admin/segments/page.tsx](<../../src/app/%5Blocale%5D/(dashboards)/admin/segments/page.tsx>)
- [src/components/admin/segments-table.tsx](../../src/components/admin/segments-table.tsx)

Features:

- Search, create, edit, delete segments
- Paginated listing

### Admin Users Segment Assignment UI

Files:

- [src/components/admin/users-table.tsx](../../src/components/admin/users-table.tsx)
- [src/components/admin/user-actions.tsx](../../src/components/admin/user-actions.tsx)
- [src/components/admin/user-segment-dialog.tsx](../../src/components/admin/user-segment-dialog.tsx)

Features:

- Segment column in users table
- Sort by segment
- Update segment from row actions

## 9) Localization Coverage

Added namespaces in [src/i18n/request.ts](../../src/i18n/request.ts):

- `adminSegments`
- `announcements`
- `adminAnnouncements`

Bilingual announcement fields are persisted per row and rendered by locale.

## 10) Caching and Runtime Notes

### Unseen Count Caching

`/api/announcements/unseen-count` uses `unstable_cache` with 60s revalidation.

File:

- [src/app/api/announcements/unseen-count/route.ts](../../src/app/api/announcements/unseen-count/route.ts)

### Hydration Safety

Admin and user announcement lists use hydration-aware loading patterns to avoid SSR/client mismatch.

## 11) Operational Checklist

1. Run migrations (`0007`, `0008`, `0009`).
2. Verify new tables and enum exist in DB.
3. Validate admin CRUD flows:
   - segments
   - announcements
   - user segment assignment
4. Validate user flows:
   - unseen modal on dashboard
   - updates page history
   - unseen badge behavior
5. Verify role/segment targeting behavior with test users.
6. Verify Swagger docs for new endpoints in `/api-docs`.

## 12) Known Naming Notes in Current Implementation

- The admin segment route/page currently uses `segments` in URL and metadata keys.
  - route: `/admin/segments`
  - metadata keys include `admin.segments.*`

This is part of the currently staged implementation and documented as-is.
