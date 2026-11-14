# Assets Library (Images First) - SRD

This document defines the Software Requirements for the new Content Dashboard Assets Library, starting with image management using Cloudinary storage.

## 1) Problem and Goal

The Content Dashboard needs a reusable, backend-driven media library that supports image upload and management for web and future mobile clients.

Primary goals:

- Upload images/files to cloud storage
- Organize assets by folders
- Search and browse assets
- Copy URLs quickly
- Delete assets safely
- Provide real upload progress from actual upload bytes (frontend `XMLHttpRequest`)
- Keep all business logic in backend modules and API routes (no server-action-only logic)

## 2) Scope (Phase 1)

In scope:

- Content Manager dashboard pages for image library
- Image upload via signed flow through backend
- Folder organization in Cloudinary under configured root
- Metadata persistence in Postgres (`media_files`)
- Search, list, delete, copy URL workflows
- Drag-and-drop upload UI
- Real progress indicator sourced from `XMLHttpRequest.upload.onprogress`

Out of scope (later phases):

- Video/raw file full management UX
- Image transformations editor
- Bulk operations advanced workflows
- Versioning/history of media edits

## 3) User Roles and Access

Roles:

- `content_manager`
- `admin` (full override)

Permissions in this feature:

- Upload assets: content_manager/admin
- View/search assets: content_manager/admin
- Delete assets: content_manager/admin
- Organize folders (via upload folder path): content_manager/admin

## 4) Functional Requirements

### FR-1 Upload Assets

The user can upload one or multiple images using:

- File picker
- Drag-and-drop area

Behavior:

- Files are validated before upload (size, type)
- Upload is initiated by backend APIs using signed Cloudinary flow
- Uploaded records are persisted in DB
- UI shows per-file status and progress

### FR-2 Folder Organization

All uploads must be placed under:

- `CLOUDINARY_ROOT_FOLDER` (config variable)

Folder strategy:

- `${CLOUDINARY_ROOT_FOLDER}/images/...`
- `${CLOUDINARY_ROOT_FOLDER}/files/...` (reserved for next phase)

Phase 1 default image folder example:

- `${CLOUDINARY_ROOT_FOLDER}/images/general`

### FR-3 Search and Browse

User can:

- List assets with pagination
- Filter by folder
- Filter by format/resource type
- Search by filename, public_id, tags

Phase 1 search strategy (explicit):

- Text search is primarily by `original_filename` (ILIKE)
- Optional secondary text search by `public_id` (ILIKE)
- Tag filtering uses exact tag match semantics (`tags` contains requested tag values)
- Folder and format/resourceType are exact filters

### FR-4 Copy URLs

User can copy:

- `secure_url` (primary)
- `cloudinary_url` (optional secondary)

### FR-5 Delete Asset

Deleting an asset must:

1. Delete from Cloudinary by `public_id`
2. Delete/soft-delete DB record (decision in plan)
3. Return unified API response and updated list state

### FR-6 Real Progress

Progress must come from real uploaded bytes, not synthetic timers.

Required behavior:

- Frontend uploads to Cloudinary using `XMLHttpRequest`
- Frontend uses `XMLHttpRequest.upload.onprogress` for per-file progress
- Progress UI is driven by actual `loaded/total` bytes
- Backend is not required to persist upload-progress state

## 5) Non-Functional Requirements

- Architecture compliance with module-first backend
- API-first logic reusable by mobile apps
- Strong validation and typed DTOs
- Localized UI (Arabic/English)
- Secure signed upload (no unsigned admin upload)
- Observability: errors and upload state diagnostics

## 6) Cloudinary Integration Requirements

References:

- https://cloudinary.com/documentation
- https://cloudinary.com/documentation/react_integration
- https://cloudinary.com/documentation/node_integration

Requirements:

- Use Cloudinary Node SDK on backend
- Use signed upload flow through API
- Store and use `public_id` as canonical external identifier
- Persist returned metadata from Cloudinary in DB
- Enforce folder naming using root config variable
- For raw file delivery (PDF/ZIP and similar), Cloudinary Security must allow delivery.
- If disabled, direct raw URLs return `401` and assets may show `Access control: Blocked for delivery` in Cloudinary Media Library.
- Setup path: Cloudinary Console -> Settings -> Security -> enable "Allow PDF and ZIP delivery".

## 7) Data Model Requirements

### Table: `media_files`

Required columns:

- `id` uuid PK
- `public_id` text unique not null
- `cloudinary_url` text not null
- `secure_url` text not null
- `resource_type` text not null (`image | video | raw`)
- `format` text nullable
- `width` integer nullable
- `height` integer nullable
- `bytes` bigint not null
- `folder` text not null
- `original_filename` text nullable
- `tags` jsonb not null default `[]`
- `uploaded_by` text not null FK (`users.id`)
- `created_at` timestamp not null default now
- `updated_at` timestamp not null default now

Type-alignment requirement:

- `uploaded_by` must use the same DB type as `users.id`
- In the current schema, `users.id` is text, so `uploaded_by` is text in Phase 1
- If `users.id` is migrated in future, this column must be migrated to match

Example row:

- `id`: uuid
- `public_id`: `modawim/marketing/hero_banner`
- `secure_url`: `https://res.cloudinary.com/...`
- `resource_type`: `image`
- `format`: `png`
- `bytes`: `248933`
- `folder`: `marketing`
- `tags`: `["hero", "landing"]`

## 8) API Requirements (Backend-First)

Base path:

- `/api/content/assets`

Endpoints (phase 1):

- `POST /api/content/assets/upload/signature`
  - Validates upload intent (folder, filename, mime)
  - Returns signed Cloudinary upload params

- `POST /api/content/assets/upload/complete`
  - Finalizes after frontend Cloudinary success
  - Must not trust client-reported metadata as source of truth
  - Backend verifies uploaded asset against Cloudinary before persistence (by `public_id`)
  - Persists metadata in `media_files`

- `GET /api/content/assets`
  - List/search/filter assets

- `GET /api/content/assets/:id`
  - Asset details

- `DELETE /api/content/assets/:id`
  - Delete in Cloudinary and DB

## 9) Backend Architecture Requirements

Follow current architecture:

- Route handlers: `src/app/api/**/route.ts`
- Module: `src/server/modules/assets/`
  - `asset.controller.ts`
  - `asset.service.ts`
  - `asset.repository.ts`
  - `asset.dto.ts`
- Guarding:
  - `withContentManager` (or admin override)
  - `withErrorHandler`

No upload/delete business logic in server actions.

## 10) Frontend Requirements (Content Dashboard)

Pages:

- `/content/items` (initial image library page)

UI requirements:

- Drag-and-drop upload zone
- Upload queue with per-file progress/status
- Search input and filters
- Folder selector/input
- Asset grid/list with preview
- Copy secure URL action
- Delete action with confirmation
- Empty/loading/error states
- RTL/LTR support

## 11) Validation Rules

Phase 1 image constraints:

- Allowed mime types: image/\* (refined allowlist in plan)
- Max file size per upload: configurable (env)
- Folder path sanitized and scoped under root
- Tags normalized and length-limited

## 12) Security Requirements

- Signed upload only for privileged users
- Never expose Cloudinary API secret to client
- Enforce role checks on all asset APIs
- Validate folder path cannot escape configured root
- Validate ownership/authorization for delete/list operations
- `upload/complete` must re-validate asset metadata from Cloudinary before DB write

Phase 1 explicit non-requirement:

- No rate limiting on upload-signature endpoint for now (deferred)

## 13) Error Handling

Use standardized API error contract.

Expected error categories:

- Validation errors (422)
- Unauthorized/forbidden (401/403)
- Cloudinary upstream failure (502/500 mapped)
- Asset not found (404)
- Conflict (duplicate/public_id mismatch) (409)

## 14) Acceptance Criteria (Phase 1)

- Content manager/admin can upload images via drag-drop and picker
- Upload progress is shown per file using real XHR progress events
- Uploaded files are stored under `${CLOUDINARY_ROOT_FOLDER}/images/...`
- Metadata is persisted in `media_files`
- Assets can be searched, listed, copied, and deleted
- APIs are reusable by non-web clients
- EN/AR localization present for core UI strings
- Architecture remains module-first and consistent with existing backend patterns
- List endpoint uses offset pagination (`page`, `limit`)

## 15) Delivery URL Strategy (Deferred)

Phase 1 decision:

- Eager transformations are deferred
- Keep original secure URLs in persistence and APIs

Required TODO for Phase 2:

- Add delivery transformation strategy for web consumption (at minimum `q_auto,f_auto`)
