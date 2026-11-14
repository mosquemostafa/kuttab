# Assets Library (Images First) - Implementation Plan

This plan implements the SRD for a Cloudinary-backed image library in the Content Dashboard using backend-first APIs and module-first architecture.

## 1) Delivery Phases

### Phase A - Foundations

1. Add Cloudinary configuration layer
2. Add DB migrations for `media_files`
3. Add shared constants/validation for folders and mime limits

### Phase B - Backend Module

1. Create `assets` backend module:

- `src/server/modules/assets/asset.dto.ts`
- `src/server/modules/assets/asset.repository.ts`
- `src/server/modules/assets/asset.service.ts`
- `src/server/modules/assets/asset.controller.ts`

2. Add API routes under `src/app/api/content/assets/**`
3. Add guard composition (`withErrorHandler`, `withContentManager`)
4. Add Swagger JSDoc for all new endpoints

### Phase C - Upload + Progress Flow

1. Implement signed upload init endpoint
2. Implement frontend XHR progress tracking in upload UI
3. Implement completion/finalization endpoint
4. Persist Cloudinary metadata into `media_files`

### Phase D - Content Dashboard UI (Images)

1. Build drag-and-drop uploader component
2. Build upload queue/progress panel
3. Build searchable assets listing (grid/list)
4. Add copy URL and delete actions
5. Add folder selection UX

### Phase E - Localization + QA

1. Add EN/AR translation namespaces
2. Add metadata titles/descriptions for `/content/items`
3. End-to-end smoke tests and typecheck/lint

## 2) Config Plan

Add server config for Cloudinary and root folder:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_ROOT_FOLDER`

Notes:

- `CLOUDINARY_ROOT_FOLDER` is required and must be used by service methods.
- Folder helper should produce scoped paths:
  - `${root}/images/${subfolder}`
  - `${root}/files/${subfolder}` (future)
- For raw file links (PDF/ZIP/docs), enable delivery in Cloudinary Security settings.
- Setup path: Cloudinary Console -> Settings -> Security -> enable "Allow PDF and ZIP delivery".

## 3) Database Plan

### 3.1 `media_files`

Create Drizzle schema + SQL migration with:

- `id uuid primary key default gen_random_uuid()`
- `public_id text unique not null`
- `cloudinary_url text not null`
- `secure_url text not null`
- `resource_type text not null`
- `format text`
- `width integer`
- `height integer`
- `bytes bigint not null`
- `folder text not null`
- `original_filename text`
- `tags jsonb not null default '[]'::jsonb`
- `uploaded_by text not null references users(id) on delete cascade`
- `created_at timestamp not null default now()`
- `updated_at timestamp not null default now()`

Type alignment:

- `uploaded_by` must match `users.id` type exactly.
- Current project schema uses `users.id` as text, so `uploaded_by` is text in Phase 1.

Indexes:

- `media_files_uploaded_by_idx`
- `media_files_folder_idx`
- `media_files_resource_type_idx`
- `media_files_created_at_idx`
- Optional trigram index for search fields if needed later

## 4) API Contract Plan

### 4.1 Upload Signature

`POST /api/content/assets/upload/signature`

Request:

- `fileName`
- `fileSize`
- `mimeType`
- `folder` (logical folder under `/images`)
- `tags[]` (optional)

Response:

- `upload` object (signed params needed by client)
- `targetFolder`

### 4.2 Upload Complete

`POST /api/content/assets/upload/complete`

Request:

- Cloudinary callback/result payload fields needed for persistence

Trust-boundary rule (required):

- Do not persist client-reported metadata directly.
- Backend re-fetches/verifies asset metadata from Cloudinary by `public_id` before DB insert.

Response:

- persisted `media_file` DTO

### 4.3 List/Search

`GET /api/content/assets`

Query params:

- `q`
- `folder`
- `resourceType`
- `format`
- `page`
- `limit`

Response:

- paginated list + meta

Phase 1 query semantics:

- Pagination: offset-based (`page`, `limit`)
- Text search: `ILIKE` on `original_filename` (primary), optional `public_id`
- Tags: filter by exact tag match/containment
- Folder/format/resourceType: exact filters

### 4.4 Delete

`DELETE /api/content/assets/{id}`

Behavior:

- remove Cloudinary asset by `public_id`
- remove DB row or mark deleted (decision below)

## 5) Backend Module Design

### 5.1 DTOs

Validate:

- upload init payload
- upload complete payload
- listing query filters
- delete id params

### 5.2 Service

Responsibilities:

- folder path composition and sanitization
- signed upload generation
- Cloudinary interaction (upload destroy/admin APIs)
- metadata mapping into DB model
- search orchestration

### 5.3 Repository

Responsibilities:

- CRUD for `media_files`
- paginated filtering/search

## 6) Progress Strategy (Frontend XHR)

Chosen strategy:

- Client uploads directly to Cloudinary using signed params from backend
- Frontend tracks upload bytes via `XMLHttpRequest.upload.onprogress`
- Frontend renders per-file progress from `loaded/total`
- Backend only handles signature generation and metadata finalization

Important note:

- XHR progress is real transport progress from the browser upload stream.
- No progress table or polling endpoint is required.

## 7) Folder Rules

Normalize folder input and enforce:

- Final folder always starts with `${CLOUDINARY_ROOT_FOLDER}/images`
- Reject traversal and invalid path segments
- Example:
  - input `marketing` -> `${root}/images/marketing`
  - empty -> `${root}/images/general`

## 8) UI Plan (Content Dashboard)

Create components:

- `assets-dropzone.tsx`
- `assets-upload-queue.tsx`
- `assets-library-toolbar.tsx`
- `assets-grid.tsx`
- `asset-card.tsx`

UX requirements:

- drag-and-drop + click upload
- per-file progress and status badges
- search field and folder filter
- copy URL quick action
- delete with confirmation dialog
- retry failed upload

Folder UX decision (resolved for Phase 1):

- Use predefined folder selector (Option B)
- Support optional "Add new folder" flow in later phase

## 9) Localization Plan

Add namespace entries in:

- `src/messages/en/contentAssets.json`
- `src/messages/ar/contentAssets.json`

Include labels for:

- upload actions
- drag/drop hints
- status/progress
- search/filter
- copy/delete confirmations
- error messages

Update metadata keys for content pages in existing metadata files.

## 10) Security and Validation Plan

- Guard routes with `withContentManager` (admin allowed)
- Validate mime and size server-side
- Validate folder scope under root
- Do not expose API secret
- Audit log upload/delete actions (optional Phase 2)
- Verify `upload/complete` metadata via Cloudinary server-side fetch before persistence
- If raw files return `401`, check Cloudinary Media Library for `Access control: Blocked for delivery` and enable PDF/ZIP delivery in Security settings

Phase 1 explicit non-requirement:

- No rate limiting on `POST /api/content/assets/upload/signature` for now

## 11) Delete Strategy Decision

Phase 1 default:

- Hard delete in Cloudinary + hard delete DB row

Alternative (Phase 2):

- Soft delete DB + delayed Cloudinary cleanup job

## 12) Testing Plan

### Backend

- Unit tests for folder builder/sanitizer
- Unit tests for role-guarded service methods
- Integration tests for upload-init/complete/list/delete endpoints
- Failure tests for Cloudinary errors and invalid payloads

### Frontend

- Drag/drop interaction tests
- Upload queue state tests
- Search/filter behavior tests
- Copy/delete action tests

### System

- Content manager happy path e2e
- Admin override path e2e
- Arabic/English UI verification

## 13) Milestone Checklist

M1 Foundations:

- Cloudinary config added
- DB schema/migrations added
- No type errors

M2 Backend APIs:

- All endpoints implemented + documented
- Guarding and validation complete

M3 UI:

- Upload/list/search/copy/delete flows completed
- Progress visible and XHR-driven

M4 Release readiness:

- Localization complete
- Lint/typecheck passing
- Smoke tests passing

## 14) Open Decisions (Need confirmation)

1. Delete behavior:

- Hard delete now
- or soft delete with later cleanup

2. Maximum file size and allowed image formats for phase 1

## 15) Deferred Delivery Optimization TODO

Phase 1 decision:

- Defer eager transformations and delivery optimization strategy

Phase 2 TODO:

- Introduce delivery URLs with transformation defaults (at least `q_auto,f_auto`) to avoid oversized raw deliveries
