# Feedbacks System Documentation

This document describes the complete feedbacks implementation currently present in the codebase.

## 1) What It Solves

The system provides:

- End-user feedback submission from dashboard (`suggestion` or `complaint`)
- End-user feedback history tracking with filtering and pagination
- Support/admin feedback desk for triage (`new`, `reviewed`, `closed`)
- Role-aware access control (user vs support/admin)
- Database-backed pagination/filtering/sorting
- Email acknowledgment on feedback creation (configurable via admin setting)

## 2) Core Domain Model

### Feedback Type Enum

Defined in [src/shared/enums/feedback-type.enum.ts](../../src/shared/enums/feedback-type.enum.ts):

- `suggestion`
- `complaint`

### Feedback Status Enum

Defined in [src/shared/enums/feedback-status.enum.ts](../../src/shared/enums/feedback-status.enum.ts):

- `new`
- `reviewed`
- `closed`

### Feedback DTO

Defined in [src/shared/types/feedback.types.ts](../../src/shared/types/feedback.types.ts):

- `id`
- `userId`
- `userEmail?` (optional, used in support/admin listing)
- `type`
- `subject`
- `description`
- `status`
- `createdAt`
- `updatedAt`

## 3) Database Schema and Migrations

### Schema

Defined in [src/db/schema.ts](../../src/db/schema.ts):

- Table: `feedback`
  - `id` (PK)
  - `user_id` (FK -> `user.id`, cascade delete)
  - `type` (check-constrained: suggestion/complaint)
  - `subject`
  - `description`
  - `status` (check-constrained: new/reviewed/closed)
  - `created_at`
  - `updated_at`

### Migrations

- [drizzle/0006_feedbacks.sql](../../drizzle/0006_feedbacks.sql)
  - creates `feedback` table + constraints + indexes
  - adds app setting column:
    `send_feedback_confirmation_email boolean not null default true`

Migration registry is tracked in [drizzle/meta/\_journal.json](../../drizzle/meta/_journal.json).

## 4) Roles and Access Rules

### Roles

Support role is available in [src/shared/enums/user-role.enum.ts](../../src/shared/enums/user-role.enum.ts):

- `user`
- `admin`
- `support`

### Route Access

- User feedback page: `/dashboard/feedbacks` (authenticated user)
- Support desk routes: `/support/*` (support + admin only)
  - layout guard in [src/app/[locale]/support/layout.tsx](../../src/app/%5Blocale%5D/support/layout.tsx)

### API Access Logic

- `list` endpoint behavior:
  - `user`: only own feedback entries
  - `support`/`admin`: all feedback entries
- `updateStatus` and `delete`:
  - allowed only for `support`/`admin`
- `getById`:
  - `user`: only own feedback entry
  - `support`/`admin`: any feedback entry

## 5) Backend Architecture

### Route Handlers

- [src/app/api/feedbacks/route.ts](../../src/app/api/feedbacks/route.ts)
  - `GET` list
  - `POST` create
- [src/app/api/feedbacks/[id]/route.ts](../../src/app/api/feedbacks/%5Bid%5D/route.ts)
  - `GET` by id
  - `DELETE` feedback
- [src/app/api/feedbacks/[id]/status/route.ts](../../src/app/api/feedbacks/%5Bid%5D/status/route.ts)
  - `PATCH` status

All routes use `withAuth` and centralized error handling via composition.

### Controller

Defined in [src/server/modules/feedbacks/feedback.controller.ts](../../src/server/modules/feedbacks/feedback.controller.ts):

- Parses query params (`status`, `type`, `sortDirection`, `page`, `limit`)
- Uses pagination pipe
- Resolves user id + role from request context
- Returns standardized response shape with optional pagination meta

### DTO/Validation

Defined in [src/server/modules/feedbacks/feedback.dto.ts](../../src/server/modules/feedbacks/feedback.dto.ts):

- Create schema: `type`, `subject`, `description`
- List schema: `status`, `type`, `sortDirection`, `page`, `limit`
- Update status schema: `status`

### Service

Defined in [src/server/modules/feedbacks/feedback.service.ts](../../src/server/modules/feedbacks/feedback.service.ts):

- Role-based read/update/delete policies
- DTO mapping
- Email acknowledgment trigger after create
- Uses app setting `sendFeedbackConfirmationEmail` to enable/disable email sending

### Repository

Defined in [src/server/modules/feedbacks/feedback.repository.ts](../../src/server/modules/feedbacks/feedback.repository.ts):

- Pagination via `limit` + `offset`
- Filtering by `status` and `type`
- Sorting by `createdAt` (`asc` / `desc`)
- `count(*)` query for total
- **Join with `user` table for `userEmail` in one query**
  - avoids N+1 pattern

## 6) Email Acknowledgment Flow

### Email Utility

- Email transport and templates in [src/lib/email.ts](../../src/lib/email.ts)
- Template: `getFeedbackReceivedEmailTemplate(...)`

### Trigger Point

After feedback creation in service:

1. Create feedback row
2. Load app settings + requester profile
3. If `sendFeedbackConfirmationEmail === true` and user has email:
   - send acknowledgment email asynchronously

### Admin Control Toggle

- Setting key (service-level): `sendFeedbackConfirmationEmail`
- Backed by DB column: `send_feedback_confirmation_email`
- Admin UI toggle in [src/components/admin/app-settings-card.tsx](../../src/components/admin/app-settings-card.tsx)
- Passed from page/action/service/repository chain:
  - [src/app/[locale]/admin/settings/page.tsx](../../src/app/%5Blocale%5D/admin/settings/page.tsx)
  - [src/app/[locale]/admin/settings/action.ts](../../src/app/%5Blocale%5D/admin/settings/action.ts)
  - [src/server/modules/app-settings/app-settings.service.ts](../../src/server/modules/app-settings/app-settings.service.ts)
  - [src/server/modules/app-settings/app-settings.repository.ts](../../src/server/modules/app-settings/app-settings.repository.ts)

## 7) Frontend Pages and Components

### User-Facing Feedback Page

- Route: [src/app/[locale]/dashboard/feedbacks/page.tsx](../../src/app/%5Blocale%5D/dashboard/feedbacks/page.tsx)
- UI: [src/components/dashboard/feedbacks/feedbacks-panel.tsx](../../src/components/dashboard/feedbacks/feedbacks-panel.tsx)
- Features:
  - create feedback form (`type` + `subject` + `description`)
  - list own feedback
  - filter by type/status
  - backend pagination controls
  - localized pagination labels

### Support/Admin Feedback Desk

- Route: [src/app/[locale]/support/feedbacks/page.tsx](../../src/app/%5Blocale%5D/support/feedbacks/page.tsx)
- UI: [src/components/support/feedbacks-management-table.tsx](../../src/components/support/feedbacks-management-table.tsx)
- Features:
  - queue table
  - status update per row
  - delete with confirmation
  - details dialog
  - type/status filter + date sort
  - backend pagination controls
  - joined user email display
  - Gmail compose links for email field

### API Client

Client methods are exposed under:

- [src/lib/api-client.ts](../../src/lib/api-client.ts)
  - `feedbacks.list`
  - `feedbacks.getById`
  - `feedbacks.create`
  - `feedbacks.updateStatus`
  - `feedbacks.delete`

## 8) Localization Coverage

Feedbacks UI translations are implemented in:

- [src/messages/en/dashboard.json](../../src/messages/en/dashboard.json)
- [src/messages/ar/dashboard.json](../../src/messages/ar/dashboard.json)

Metadata coverage includes feedback pages in:

- [src/messages/en/metadata.json](../../src/messages/en/metadata.json)
- [src/messages/ar/metadata.json](../../src/messages/ar/metadata.json)

Admin setting toggle labels are in:

- [src/messages/en/adminSettings.json](../../src/messages/en/adminSettings.json)
- [src/messages/ar/adminSettings.json](../../src/messages/ar/adminSettings.json)

## 9) Hydration Stability Notes

To avoid SSR/client mismatch in feedback lists:

- Both feedback UIs include an `isHydrated` gate before rendering dynamic list states.
- Header totals render a hydration-safe value before client hydration completes.

Affected files:

- [src/components/dashboard/feedbacks/feedbacks-panel.tsx](../../src/components/dashboard/feedbacks/feedbacks-panel.tsx)
- [src/components/support/feedbacks-management-table.tsx](../../src/components/support/feedbacks-management-table.tsx)

## 10) Operational Checklist

When setting this up in another environment:

1. Run DB migrations.
2. Ensure email env vars are configured (`GMAIL_*`).
3. Verify roles include `support`.
4. Confirm admin setting `sendFeedbackConfirmationEmail` is set as intended.
5. Smoke-test endpoints and both UIs.

## 11) Quick API Contract Summary

Base: `/api/feedbacks`

- `GET /api/feedbacks`
  - Query: `status?`, `type?`, `sortDirection?`, `page?`, `limit?`
  - Returns paginated `FeedbackDTO[]`
- `POST /api/feedbacks`
  - Body: `{ type, subject, description }`
- `GET /api/feedbacks/:id`
- `PATCH /api/feedbacks/:id/status`
  - Body: `{ status }`
- `DELETE /api/feedbacks/:id`

All endpoints require authentication.

## 12) Related Supporting Changes

The feedbacks implementation also integrates with support/admin shells and dashboard user menu navigation:

- support sidebar entry for `/support/feedbacks`
- user dropdown entry for `/dashboard/feedbacks`

These are related but not required to understand feedback CRUD mechanics themselves.
