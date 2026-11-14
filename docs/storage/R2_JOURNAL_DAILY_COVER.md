# Cloudflare R2: journal daily cover images

This document describes how **per-day journal cover images** are stored in **Cloudflare R2** (same bucket and S3-compatible API as [user avatars](./R2_USER_AVATAR_STORAGE.md)), how metadata lives in **`user_media_files`**, and how **`journal_daily.cover_image_id`** links each calendar day to one image row.

When in doubt, use the [Source map](#source-map) below.

---

## Goals and scope

| Area                                                        | Storage                                         | Notes                                                                                    |
| ----------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Admin / CMS media (`media_files`, Cloudinary)               | **Cloudinary**                                  | Unchanged.                                                                               |
| User profile photo                                          | **R2** under `avatars/…`                        | See [R2_USER_AVATAR_STORAGE.md](./R2_USER_AVATAR_STORAGE.md).                            |
| **Journal daily cover** (one image per `journal_daily` row) | **R2** under `user-media/journal_daily_cover/…` | Presigned **PUT** from the browser; DB row in `user_media_files`; FK on `journal_daily`. |

**Out of scope:** arbitrary attachments on journal _entries_ (text entries), or multiple images per day beyond the single cover.

---

## High-level architecture

```mermaid
sequenceDiagram
  participant Browser
  participant NextAPI as Next_App_API
  participant DB as Postgres
  participant R2 as R2_S3_API

  Browser->>NextAPI: POST .../journal-daily-cover/presign
  Note over NextAPI: Session, ensure journal_daily row,<br/>plan limit if net-new cover, build object key
  NextAPI->>Browser: uploadUrl, objectKey, headers, journalDailyId

  Browser->>R2: PUT file to presigned URL

  Browser->>NextAPI: POST .../journal-daily-cover/complete
  Note over NextAPI: Parse key → user + daily id,<br/>HeadObject, transaction:<br/>insert user_media_files,<br/>set cover_image_id,<br/>delete previous media + R2
  NextAPI->>DB: INSERT user_media_files; UPDATE journal_daily
  NextAPI->>R2: DeleteObject previous key (best-effort)
  NextAPI->>Browser: coverImageUrl, coverImageId, journalDailyId
```

1. **Presign:** The authenticated user sends a calendar **`date`** (YYYY-MM-DD), **`contentType`**, and **`fileSize`**. The server ensures a `journal_daily` row exists for that user+date, checks subscription limits when the day has **no** cover yet, builds a unique object key, and returns a presigned PUT URL.
2. **Direct upload:** The browser PUTs bytes to R2 (same pattern as avatars).
3. **Complete:** The server validates the object key belongs to the session user and matches the expected journal-daily segment, runs **`HeadObject`** for size and MIME type, then in a **transaction** inserts **`user_media_files`**, sets **`journal_daily.cover_image_id`**, and removes the previous **`user_media_files`** row and R2 object when replacing a cover.

**Read paths:** List/read APIs for daily journals **left-join** `user_media_files` and expose **`coverImageUrl`** to the client without storing a duplicate URL on `journal_daily`.

---

## Environment variables and feature gate

Journal daily covers use the **same R2 cluster** as avatars.

| Mechanism                    | Location                                               | Meaning                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Required env set             | [`src/server/lib/env.ts`](../../src/server/lib/env.ts) | Same five variables as avatars (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`).                                                                        |
| **`r2AvatarStorageEnabled`** | `env.ts`                                               | When `true`, both avatar uploads **and** journal daily cover uploads are allowed. When `false`, presign/complete for journal covers respond with **503** (“User media upload to storage is not configured”). |

There is no separate env flag for journal covers by design: one bucket, one operator checklist.

---

## Constants and object key layout

Shared constants: [`src/shared/constants/user-media.constants.ts`](../../src/shared/constants/user-media.constants.ts)

| Constant                                    | Typical value         | Role                                                  |
| ------------------------------------------- | --------------------- | ----------------------------------------------------- |
| `USER_MEDIA_ALLOWED_IMAGE_TYPES`            | jpeg, png, webp, gif  | Allowed `Content-Type` values (aligned with avatars). |
| `USER_MEDIA_MAX_IMAGE_BYTES`                | 5 MiB                 | Presign body check and `HeadObject` on complete.      |
| `USER_MEDIA_OBJECT_KEY_PREFIX`              | `user-media`          | Top segment of every user-media key.                  |
| `USER_MEDIA_USAGE_TYPE.JOURNAL_DAILY_COVER` | `journal_daily_cover` | Stored in `user_media_files.usage_type`.              |

Key builder: [`src/server/modules/user-media/r2-journal-daily-cover.keys.ts`](../../src/server/modules/user-media/r2-journal-daily-cover.keys.ts)

### Object key format (new uploads)

```
user-media/journal_daily_cover/{userId}/{journalDailyId}/{cuid2}.{ext}
```

- **`userId`** — Session user; `parseJournalDailyCoverObjectKey` rejects keys that do not start with the expected prefix for that user.
- **`journalDailyId`** — Primary key of `journal_daily` for that user+date (created or touched in presign via `ensureDailyForUserDate`).
- **`cuid2` + extension** — Unique file name segment; extension is derived from the declared MIME type (`jpg`, `png`, `webp`, `gif`).

### Legacy migration keys

Historical rows may use keys under the **`legacy/`** prefix (see Drizzle migration that backfilled old URL-based covers).  
[`shouldSkipR2DeleteForObjectKey`](../../src/server/modules/user-media/r2-journal-daily-cover.keys.ts) returns **`true`** for those keys so **complete/replace does not call `DeleteObject`** on R2 for URLs that were never stored as real objects in this bucket.

---

## Database model

| Table              | Relevant columns                                                    | Notes                                                                           |
| ------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `journal_daily`    | `cover_image_id` → `user_media_files.id`                            | Nullable; one optional cover per user+date row.                                 |
| `user_media_files` | `object_key`, `public_url`, `usage_type`, `uploaded_by`, `bytes`, … | One row per stored object; `usage_type = journal_daily_cover` for this feature. |

Entity definitions:

- [`src/server/modules/journals/journal.entity.ts`](../../src/server/modules/journals/journal.entity.ts)
- [`src/server/modules/user-media/user-media.entity.ts`](../../src/server/modules/user-media/user-media.entity.ts)

---

## Server implementation

### R2 primitives (shared with avatars)

[`src/server/lib/r2.ts`](../../src/server/lib/r2.ts)

- **`presignR2PutObject(objectKey, contentType)`** — Used for journal covers (same 5-minute expiry pattern as avatar presign).
- **`publicUrlForR2ObjectKey(key)`** — Stored on `user_media_files.public_url` and returned as `coverImageUrl` after complete.
- **`headR2Object` / `deleteR2Object`** — Verify upload; best-effort cleanup of the **previous** object when the user replaces a cover.

### Journal daily cover service

[`src/server/modules/user-media/journal-daily-cover.service.ts`](../../src/server/modules/user-media/journal-daily-cover.service.ts)

| Method               | Behavior                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`presignUpload`**  | Requires `r2AvatarStorageEnabled`. Validates size and MIME. Ensures `journal_daily` for `dto.date`. Loads daily row; runs **`assertCanAddJournalDailyCoverImage`** when there is no existing cover (plan limit on **net new** images). Builds key, returns presigned PUT + `journalDailyId`.                                                                              |
| **`completeUpload`** | Parses object key → `journalDailyId` for this user. Loads daily row; re-checks plan limit for net-new cover. `HeadObject` validates size and content type. **Transaction:** insert `user_media_files`, `setCoverImageId`, then if there was a previous `cover_image_id`, load old row, **optional `DeleteObject`** (unless `legacy/`), delete old `user_media_files` row. |

DTOs: [`src/server/modules/user-media/journal-daily-cover.dto.ts`](../../src/server/modules/user-media/journal-daily-cover.dto.ts)

- **Presign body:** `date` (YYYY-MM-DD), `contentType`, `fileSize`.
- **Complete body:** `objectKey` (ownership enforced by parser + daily lookup).

Controller: [`src/server/modules/user-media/journal-daily-cover.controller.ts`](../../src/server/modules/user-media/journal-daily-cover.controller.ts)

### HTTP API

| Method | Path                                                     | Auth    |
| ------ | -------------------------------------------------------- | ------- |
| `POST` | `/api/dashboard/user-media/journal-daily-cover/presign`  | Session |
| `POST` | `/api/dashboard/user-media/journal-daily-cover/complete` | Session |

Route wrappers:

- [`src/app/api/dashboard/user-media/journal-daily-cover/presign/route.ts`](../../src/app/api/dashboard/user-media/journal-daily-cover/presign/route.ts)
- [`src/app/api/dashboard/user-media/journal-daily-cover/complete/route.ts`](../../src/app/api/dashboard/user-media/journal-daily-cover/complete/route.ts)

### Subscription / plan limits

[`src/server/modules/subscriptions/entitlement-guards.ts`](../../src/server/modules/subscriptions/entitlement-guards.ts) — **`assertCanAddJournalDailyCoverImage`**

- Compares count of `user_media_files` for the user with `usage_type = journal_daily_cover` to **`PlanFeatures.maxJournalsImages`** (see [`subscription-entitlements.ts`](../../src/server/modules/subscriptions/subscription-entitlements.ts)).
- **Replacing** an existing day cover does **not** increment that count (still one row per stored object; old row is removed when swap succeeds).
- On limit, the server throws **`PlanLimitExceededException`** (`403`, `PLAN_LIMIT_EXCEEDED`, `details.kind = journal_images`). The journals UI maps this to a translated toast (see client helper below).

### Listing dailies with cover URL

[`src/server/modules/journals/journal.repository.ts`](../../src/server/modules/journals/journal.repository.ts) — `findManyDaily` **left-joins** `user_media_files` on `journal_daily.cover_image_id` and selects `coverImageUrl` from `user_media_files.public_url`.

---

## Client implementation

### Browser helper

[`src/lib/assets/r2-journal-daily-cover-upload.ts`](../../src/lib/assets/r2-journal-daily-cover-upload.ts)

- **`uploadJournalDailyCoverFromFile(file, dateYyyyMmDd, onProgress, options?)`**
  1. `POST .../presign` with `{ date, contentType: file.type, fileSize: file.size }`.
  2. **`XMLHttpRequest` `PUT`** to `uploadUrl` with returned headers (progress support).
  3. `POST .../complete` with `{ objectKey }`.

API errors use [`ApiJsonRequestError`](../../src/lib/api/api-json-request-error.ts) so callers can branch on `error.code` (e.g. plan limit).

### UI entry points

- **Sidebar day cover:** [`src/components/journals/daily-summary-card.tsx`](../../src/components/journals/daily-summary-card.tsx) — upload control when **`avatarR2UploadEnabled`** is true from dashboard bootstrap (same flag name as avatars; indicates R2 user-media path is available).
- **Gallery:** [`src/components/journals/journals-daily-gallery.tsx`](../../src/components/journals/journals-daily-gallery.tsx) — read-only display of `coverImageUrl` for the month.

Bootstrap: [`GET /api/dashboard/settings`](../../src/app/api/dashboard/settings/route.ts) exposes **`avatarR2UploadEnabled`** (same as `r2AvatarStorageEnabled`). On the **VPS**, when R2 is enabled, set **`NEXT_PUBLIC_R2_PUBLIC_URL`** to the same origin as **`R2_PUBLIC_BASE_URL`** so `env.ts` validation matches production URLs (see `docker-compose.yml` comment).

---

## Next.js `next/image`

Journal cover URLs are normal HTTPS URLs on **`R2_PUBLIC_BASE_URL`**. The same **`next.config.ts`** [`images.remotePatterns`](../../next.config.ts) used for avatars applies; see the avatar doc for build-time `NEXT_PUBLIC_R2_PUBLIC_URL` notes.

---

## Security summary

| Topic                  | Mitigation                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Anonymous uploads      | Presign and complete require session auth.                                                                                       |
| Wrong user / wrong day | Object key must parse as `user-media/journal_daily_cover/{sessionUserId}/{journalDailyId}/…`; daily row must belong to the user. |
| Oversized / wrong type | Zod + size on presign; `HeadObject` on complete.                                                                                 |
| Short-lived writes     | Presigned PUT expires in **300 seconds** (shared presigner config).                                                              |
| Plan abuse             | Count check on presign and again on complete for **net-new** covers (`403` + `PLAN_LIMIT_EXCEEDED`).                             |

---

## Troubleshooting

| Symptom                                        | Things to check                                                                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upload control missing on journal sidebar      | Same as avatars: all five R2 env vars set; **`avatarR2UploadEnabled`** in bootstrap.                                                              |
| `503` on journal presign/complete              | R2 cluster not configured (`r2AvatarStorageEnabled` false).                                                                                       |
| `403` `PLAN_LIMIT_EXCEEDED` / `journal_images` | Free plan cap on distinct `user_media_files` rows for `journal_daily_cover`; upgrade or delete old covers / replace in place does not add a slot. |
| `422` on complete                              | PUT not finished, wrong `Content-Type`, or object missing / invalid type or size.                                                                 |
| PUT fails from browser                         | Bucket **CORS** for your app origin and `PUT`.                                                                                                    |
| Image broken in UI / `next/image`              | `R2_PUBLIC_BASE_URL` and `remotePatterns` hostname alignment.                                                                                     |
| Old cover not deleted from R2                  | Only keys that do **not** start with `legacy/` are deleted from R2; failures are best-effort (add logging if you need visibility).                |

---

## Source map

| Concern                                      | Primary files                                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Env gate (`r2AvatarStorageEnabled`)          | `src/server/lib/env.ts`                                                                                                              |
| S3 client, presign, public URL, head, delete | `src/server/lib/r2.ts`                                                                                                               |
| Key build / parse / legacy skip              | `src/server/modules/user-media/r2-journal-daily-cover.keys.ts`                                                                       |
| Presign + complete business logic            | `src/server/modules/user-media/journal-daily-cover.service.ts`                                                                       |
| HTTP + Zod                                   | `journal-daily-cover.controller.ts`, `journal-daily-cover.dto.ts`, `src/app/api/dashboard/user-media/journal-daily-cover/*/route.ts` |
| User media table                             | `user-media.entity.ts`, `user-media.repository.ts`                                                                                   |
| Daily row + join URL                         | `journal.entity.ts`, `journal.repository.ts`, `journal.service.ts`                                                                   |
| Plan limit guard                             | `entitlement-guards.ts`, `exceptions.ts` (`PlanLimitExceededException`)                                                              |
| Shared MIME / size / prefix / usage type     | `src/shared/constants/user-media.constants.ts`                                                                                       |
| Client upload                                | `src/lib/assets/r2-journal-daily-cover-upload.ts`                                                                                    |
| UI                                           | `daily-summary-card.tsx`, `journals-page.tsx`, `journals-daily-gallery.tsx`                                                          |
| Avatar doc (shared R2 setup)                 | [docs/storage/R2_USER_AVATAR_STORAGE.md](./R2_USER_AVATAR_STORAGE.md)                                                                |
