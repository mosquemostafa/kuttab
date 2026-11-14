# Support Tickets System Documentation

This document describes the complete support tickets implementation currently present in the codebase.

## 1) What It Solves

The system provides:

- End-user ticket submission and tracking from dashboard
- Support/admin queue management with status updates and delete actions
- Role-aware access control (user vs support/admin)
- Database-backed pagination/filtering/sorting
- Email acknowledgment on ticket creation (configurable via admin setting)

## 2) Core Domain Model

### Ticket Status Enum

Defined in [src/shared/enums/ticket-status.enum.ts](../../src/shared/enums/ticket-status.enum.ts):

- `open`
- `resolved`
- `closed`

### Ticket DTO

Defined in [src/shared/types/support-ticket.types.ts](../../src/shared/types/support-ticket.types.ts):

- `id`
- `userId`
- `userEmail?` (optional, used for support/admin listing)
- `subject`
- `description`
- `status`
- `createdAt`
- `updatedAt`

## 3) Database Schema and Migrations

### Schema

Defined in [src/db/schema.ts](../../src/db/schema.ts):

- Enum: `support_ticket_status`
- Table: `support_ticket`
  - `id` (PK)
  - `user_id` (FK -> `user.id`, cascade delete)
  - `subject`
  - `description`
  - `status`
  - `created_at`
  - `updated_at`

### Migrations

- [drizzle/0004_support_tickets.sql](../../drizzle/0004_support_tickets.sql)
  - creates enum/table/fk/indexes
- [drizzle/0005_support_ticket_confirmation_email_setting.sql](../../drizzle/0005_support_ticket_confirmation_email_setting.sql)
  - adds app setting column:
    `send_support_ticket_confirmation_email boolean not null default true`

Migration registry is tracked in [drizzle/meta/\_journal.json](../../drizzle/meta/_journal.json).

## 4) Roles and Access Rules

### Roles

Support role added to [src/shared/enums/user-role.enum.ts](../../src/shared/enums/user-role.enum.ts):

- `user`
- `admin`
- `support`

### Route Access

- User support page: `/dashboard/support` (authenticated user)
- Support desk routes: `/support/*` (support + admin only)
  - layout guard in [src/app/[locale]/support/layout.tsx](../../src/app/%5Blocale%5D/support/layout.tsx)

### API Access Logic

- `list` endpoint behavior:
  - `user`: only own tickets
  - `support`/`admin`: all tickets
- `updateStatus` and `delete`:
  - allowed only for `support`/`admin`
- `getById`:
  - `user`: only own ticket
  - `support`/`admin`: any ticket

## 5) Backend Architecture

### Route Handlers

- [src/app/api/support/tickets/route.ts](../../src/app/api/support/tickets/route.ts)
  - `GET` list
  - `POST` create
- [src/app/api/support/tickets/[id]/route.ts](../../src/app/api/support/tickets/%5Bid%5D/route.ts)
  - `GET` by id
  - `DELETE` ticket
- [src/app/api/support/tickets/[id]/status/route.ts](../../src/app/api/support/tickets/%5Bid%5D/status/route.ts)
  - `PATCH` status

All routes use `withAuth` and centralized error handling via composition.

### Controller

Defined in [src/server/modules/support-tickets/support-ticket.controller.ts](../../src/server/modules/support-tickets/support-ticket.controller.ts):

- Parses query params (`status`, `sortDirection`, `page`, `limit`)
- Uses pagination pipe
- Resolves user id + role from request context
- Returns standardized response shape with optional pagination meta

### DTO/Validation

Defined in [src/server/modules/support-tickets/support-ticket.dto.ts](../../src/server/modules/support-tickets/support-ticket.dto.ts):

- Create schema: `subject` + `description`
- List schema: `status`, `sortDirection`, `page`, `limit`
- Update status schema: `status`

### Service

Defined in [src/server/modules/support-tickets/support-ticket.service.ts](../../src/server/modules/support-tickets/support-ticket.service.ts):

- Role-based read/update/delete policies
- DTO mapping
- Email acknowledgment trigger after create
- Uses app setting `sendSupportTicketConfirmationEmail` to enable/disable email sending

### Repository

Defined in [src/server/modules/support-tickets/support-ticket.repository.ts](../../src/server/modules/support-tickets/support-ticket.repository.ts):

- Pagination via `limit` + `offset`
- Filtering by status
- Sorting by `createdAt` (`asc` / `desc`)
- `count(*)` query for total
- **Join with `user` table for `userEmail` in one query**
  - avoids N+1 pattern

## 6) Email Acknowledgment Flow

### Email Utility

- Email transport and templates in [src/lib/email.ts](../../src/lib/email.ts)
- New template: `getSupportTicketReceivedEmailTemplate(...)`

### Trigger Point

After ticket creation in service:

1. Create ticket row
2. Load app settings + requester profile
3. If `sendSupportTicketConfirmationEmail === true` and user has email:
   - send acknowledgment email asynchronously

### Admin Control Toggle

- Setting key (service-level): `sendSupportTicketConfirmationEmail`
- Backed by DB column: `send_support_ticket_confirmation_email`
- Admin UI toggle in [src/components/admin/registration-settings-card.tsx](../../src/components/admin/registration-settings-card.tsx)
- Passed from page/action/service/repository chain:
  - [src/app/[locale]/admin/settings/page.tsx](../../src/app/%5Blocale%5D/admin/settings/page.tsx)
  - [src/app/[locale]/admin/settings/action.ts](../../src/app/%5Blocale%5D/admin/settings/action.ts)
  - [src/server/modules/app-settings/app-settings.service.ts](../../src/server/modules/app-settings/app-settings.service.ts)
  - [src/server/modules/app-settings/app-settings.repository.ts](../../src/server/modules/app-settings/app-settings.repository.ts)

## 7) Frontend Pages and Components

### User-Facing Support Page

- Route: [src/app/[locale]/dashboard/support/page.tsx](../../src/app/%5Blocale%5D/dashboard/support/page.tsx)
- UI: [src/components/dashboard/support/support-tickets-panel.tsx](../../src/components/dashboard/support/support-tickets-panel.tsx)
- Features:
  - create ticket form
  - list own tickets
  - status filter
  - backend pagination controls
  - localized pagination labels

### Support/Admin Desk

- Route: [src/app/[locale]/support/tickets/page.tsx](../../src/app/%5Blocale%5D/support/tickets/page.tsx)
- UI: [src/components/support/support-tickets-management-table.tsx](../../src/components/support/support-tickets-management-table.tsx)
- Features:
  - queue table
  - status update per row
  - delete with confirmation
  - details dialog
  - status filter + date sort
  - backend pagination controls
  - joined user email display
  - Gmail compose links for email field

### Shared Pagination Localization

Pagination component supports localized text/aria labels:

- [src/components/ui/pagination.tsx](../../src/components/ui/pagination.tsx)

## 8) Localization Coverage

Support tickets UI translations are implemented in:

- [src/messages/en/dashboard.json](../../src/messages/en/dashboard.json)
- [src/messages/ar/dashboard.json](../../src/messages/ar/dashboard.json)

Metadata coverage includes support pages in:

- [src/messages/en/metadata.json](../../src/messages/en/metadata.json)
- [src/messages/ar/metadata.json](../../src/messages/ar/metadata.json)

Admin settings toggle labels:

- [src/messages/en/adminSettings.json](../../src/messages/en/adminSettings.json)
- [src/messages/ar/adminSettings.json](../../src/messages/ar/adminSettings.json)

## 9) Hydration Stability Notes

To avoid SSR/client mismatch in ticket lists:

- Both ticket UIs include an `isHydrated` gate before rendering dynamic list states.
- Header totals render a hydration-safe value before client hydration completes.

Affected files:

- [src/components/dashboard/support/support-tickets-panel.tsx](../../src/components/dashboard/support/support-tickets-panel.tsx)
- [src/components/support/support-tickets-management-table.tsx](../../src/components/support/support-tickets-management-table.tsx)

## 10) Operational Checklist

When setting this up in another environment:

1. Run DB migrations.
2. Ensure email env vars are configured (`GMAIL_*`).
3. Verify roles include `support`.
4. Confirm admin setting `sendSupportTicketConfirmationEmail` is set as intended.
5. Smoke-test endpoints and both UIs.

## 11) Quick API Contract Summary

Base: `/api/support/tickets`

- `GET /api/support/tickets`
  - Query: `status?`, `sortDirection?`, `page?`, `limit?`
  - Returns paginated `SupportTicketDTO[]`
- `POST /api/support/tickets`
  - Body: `{ subject, description }`
- `GET /api/support/tickets/:id`
- `PATCH /api/support/tickets/:id/status`
  - Body: `{ status }`
- `DELETE /api/support/tickets/:id`

All endpoints require authentication.

## 12) Related Supporting Changes

The support tickets implementation also includes support-role integration in user/admin management and navigation:

- role assignment and filtering updates
- support dashboard shell/sidebar/header entries

These are related but not required to understand ticket CRUD mechanics themselves.
