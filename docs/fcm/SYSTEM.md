# FCM System (Current Setup)

Last updated: 2026-04-13

This document describes the current Firebase Cloud Messaging (FCM) setup in this project: client bootstrap, token lifecycle, API endpoints, send flow, and failure handling.

## 1) High-level architecture

- **Client SDK**: Firebase Web SDK (`firebase/messaging`) is used in browser code to request permission and issue FCM registration tokens.
- **Service worker**: FCM background handling is integrated into the app worker (`/sw.js`) built from `worker/index.ts`.
- **Backend SDK**: Firebase Admin SDK (`firebase-admin/messaging`) sends notifications and processes per-token send failures.
- **Token storage**: Firestore collection `fcm_tokens/{userId}/tokens/{token}` (one doc per token).

## 2) Core files

- **Client runtime**
  - `src/lib/firebase-client.ts`
  - `src/hooks/use-fcm.ts`
  - `src/components/dashboard/fcm-overview-bootstrap.tsx`
  - `src/components/dashboard/notification-settings.tsx`
  - `src/components/providers.tsx`
  - `src/lib/fcm-client-info.ts`
  - `src/lib/ensure-fcm-service-worker.ts`
  - `src/lib/fcm-unregister-current-device.ts`
  - `src/hooks/use-sign-out.ts`
- **Worker**
  - `worker/index.ts`
- **API + backend**
  - `src/app/api/fcm/*/route.ts`
  - `src/server/modules/fcm/fcm.dto.ts`
  - `src/server/modules/fcm/fcm.controller.ts`
  - `src/server/modules/fcm/fcm.service.ts`
  - `src/lib/api-client.ts`
- **Types**
  - `src/shared/types/fcm.types.ts`

## 3) Token data model

`FcmTokenRecord` includes:

- `token` (document ID and payload value)
- `device`
- `userAgent`
- `os`
- `source` (`browser` or `pwa`)
- `isActive`
- `createdAt`
- `updatedAt`

`source` is currently metadata (useful for diagnostics/admin UI), not send targeting logic.

## 4) Token registration entry points

Production registration occurs from two UX surfaces:

1. **Overview bootstrap** (`/dashboard/overview`)
   - File: `src/components/dashboard/fcm-overview-bootstrap.tsx`
   - Goal: lightweight one-time bootstrap.
   - Behavior:
     - Runs once per tab session (`sessionStorage` guard key).
     - Early return if unsupported environment.
     - Early return unless `Notification.permission === "default"`.
     - Requests permission.
     - If granted: gets token and calls `POST /api/fcm/register`.
     - Silent failure (never blocks page UX).

2. **Settings full flow** (`/dashboard/settings`)
   - File: `src/components/dashboard/notification-settings.tsx`
   - Goal: complete diagnostics + reconciliation flow.
   - Behavior:
     - Handles statuses (`unsupported`, `default`, `blocked`, `needs_activation`, `enabled`).
     - If granted: gets token (if needed), then calls `register`.
     - User can retry/check from UI.
     - Error feedback is visible to the user.

## 5) `POST /api/fcm/register` (conditional registration)

To avoid `listTokens + client-side check + blind upsert`, registration uses:

- **Endpoint**: `POST /api/fcm/register`
- **Route file**: `src/app/api/fcm/register/route.ts`
- **Controller**: `fcmController.register`
- **Service**: `fcmService.register`

Server behavior (single-token doc read):

- If token doc is missing -> write -> return `"registered"`
- If token exists but metadata changed or `isActive !== true` -> write -> return `"updated"`
- If token exists and no relevant change -> skip write -> return `"already_registered"`

This reduces reads/payload compared to listing all tokens and keeps metadata fresh. Topic sync runs as part of this flow.

## 6) Sign-out behavior

Sign-out includes best-effort token cleanup without blocking logout:

- Hook: `src/hooks/use-sign-out.ts`
- Helper: `src/lib/fcm-unregister-current-device.ts`

Flow before auth sign-out:

1. Try to resolve current token via `getToken(...)`.
2. Call `POST /api/fcm/unregister` for that token (best effort).
3. Call Firebase `deleteToken(messaging)` (best effort).
4. Continue logout regardless of failures.

## 7) API endpoints (user scope)

- `GET /api/fcm/tokens` -> list current user token docs.
- `POST /api/fcm/register` -> conditional registration + topic sync (`already_registered` | `registered` | `updated`).
- `POST /api/fcm/unregister` -> remove one token doc.
- `POST /api/fcm/unregister-all` -> remove all token docs for current user.
- `POST /api/fcm/send-test` -> send a test notification to current user tokens.

Admin send endpoints also exist under `/api/admin/fcm/*`.

## 8) Send pipeline and stale token cleanup

Main send logic lives in `fcmService.sendToUser`.

- Reads tokens with `where("isActive", "==", true)`.
- Sends in chunks of 500 via `sendEachForMulticast`.
- Collects failures with token, error code, message.
- Deletes permanently invalid tokens in batches of 500.

Permanent token failure codes are derived from Admin SDK constants:

- `messaging/registration-token-not-registered`
- `messaging/invalid-registration-token`

`invalid-argument` is intentionally **not** treated as permanently invalid token.

## 9) Foreground vs background notification behavior

### Foreground

- `src/components/providers.tsx` registers `onMessage(messaging, ...)`.
- Shows a toast for incoming notifications while app tab is active.

### Background

- `worker/index.ts` loads Firebase compat scripts and initializes messaging in `/sw.js`.
- `onBackgroundMessage`:
  - If payload already has `notification.title/body`, do nothing (avoid duplicate notification display).
  - Otherwise calls `showNotification(...)` manually.
- Handles `notificationclick` to focus/open target URL.

## 10) Service worker notes

- Single worker strategy at `/sw.js` (avoid multi-worker conflicts at `/` scope).
- `ensureMessagingServiceWorker()` waits for active registration/ready state before token operations.
- In production, providers ensure service worker registration and locale sync.

## 11) Current behavior guarantees

- Registration is idempotent and safe under repeated client calls.
- Overview bootstrap runs once per tab session and is intentionally minimal.
- Settings page remains the full “repair/debug” path.
- Logout is resilient: FCM cleanup cannot prevent session sign-out.
- Stale token pruning is conservative and avoids over-deleting on broad errors.

## 12) Known trade-offs

- Overview bootstrap skips work when permission is already `granted` (by design). If registration drift exists, settings page fixes it.
- `isActive` is present and used in send filtering/reactivation checks, but most cleanup paths currently delete docs rather than soft-disable.
- `source` is captured for context, not yet used for targeting/segmentation.

## 13) Topic subscriptions

Topics (`all_users`, `role_*`, optional `segment_*`) are assigned per registration token, synced via the Admin SDK, and stored on each token doc. For **naming, algorithms, guarantees, APIs, and limitations** (including when DB and FCM can drift), see **[TOPICS.md](./TOPICS.md)**.

Brief reference:

- **Sync triggers**: `POST /api/fcm/register`, `POST /api/fcm/sync-topics`, and after admin **role** or **segment** updates (`user.service` → `resyncUserTokenTopics`).
- **Persistence**: `topics: string[]`, `topicsUpdatedAt` on `fcm_tokens/{userId}/tokens/{token}`.
- **Admin sends**: `POST /api/admin/fcm/send-role`, `send-segment`, `send-all`.
