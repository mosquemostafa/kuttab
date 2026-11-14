# FCM topic subscriptions

Last updated: 2026-04-13

This document describes how **FCM topic subscriptions** work in this project: naming, server logic, persistence, APIs, and known limitations. For the broader FCM stack (client SDK, service worker, direct token sends), see [SYSTEM.md](./SYSTEM.md).

---

## 1. Why topics

FCM lets you target many devices by **topic name** instead of enumerating tokens. We assign each registration token to a small set of topics derived from the user’s **role**, optional **segment**, and a **global** broadcast topic. Admin tools can then send notifications to `role_*`, `segment_*`, or `all_users`.

Topics are **not** the same as Firestore data: they live on Firebase’s side per token. We **mirror** the effective subscription set on each token document in Firestore (`topics: string[]`) so the dashboard and debugging UIs can show what the server last reconciled.

---

## 2. Topic naming

| Kind    | Pattern        | When it applies                                                                                             |
| ------- | -------------- | ----------------------------------------------------------------------------------------------------------- |
| Global  | `all_users`    | Every user with a token (normalized user lookup; fallback if user missing uses role topic for `null` role). |
| Role    | `role_<role>`  | `<role>` is the normalized app role (lowercase), e.g. `role_user`, `role_admin`.                            |
| Segment | `segment_<id>` | Only if the user has a non-empty segment id; `<id>` is the segment document id.                             |

Implementation: `buildRoleTopic`, `buildSegmentTopic`, `ALL_USERS_TOPIC` in `src/server/modules/fcm/fcm.service.ts`, plus `buildDesiredTopicsForUser`.

**Desired set** for a user is always:

1. `all_users`
2. `role_<normalizedRole>`
3. `segment_<segmentId>` if present

Duplicates are removed (`uniqueTopics`).

---

## 3. Source of truth for “what should this user have?”

`buildDesiredTopicsForUser(userId)` loads the user via `userRepository.findRoleAndSegmentById` and builds the list above. If the user record is missing, it falls back to `[all_users, role_<null role normalization>]`.

This is the **only** input to topic sync for that user. Client apps do not pick topics; the server decides from DB state.

---

## 4. Core algorithm: `syncTokenTopics`

For one FCM **registration token** string, the server:

1. Reads **`currentTopics`**: the list stored on the token doc in Firestore (or `[]` if missing / invalid).
2. Reads **`desiredTopics`**: from `buildDesiredTopicsForUser(userId)`.
3. Computes set differences:
   - **`toSubscribe`**: topics in **desired** but not in **current** (missing on the doc).
   - **`toUnsubscribe`**: topics in **current** but not in **desired** (should be removed).

4. Calls Firebase Admin:
   - `subscribeToTopic(token, topic)` for each item in `toSubscribe`.
   - `unsubscribeFromTopic(token, topic)` for each item in `toUnsubscribe`.

5. Builds **`nextTopics`** (what we will persist):
   - Start from a **copy of `current`** (Firestore’s list).
   - Add each topic that appeared in **successful** subscribe results.
   - Remove each topic that appeared in **successful** unsubscribe results.

6. Returns `{ topics: nextTopics, subscribeFailed, unsubscribeFailed }`.

Relevant code: `syncTokenTopics`, `subscribeTokenToTopics`, `unsubscribeTokenFromTopics` in `fcm.service.ts`.

### 4.1 What gets persisted

- **`topics`** on the document is set to `syncedTopics.topics` (i.e. `nextTopics`) when a write happens (see flows below).
- **`topicsUpdatedAt`** is updated when those fields are written alongside other token updates.

---

## 5. Guarantees and limitations

### 5.1 New topics (not on the doc yet)

A topic that is **not** in `currentTopics` is only **added** to `nextTopics` if `subscribeToTopic` reports success (`successCount > 0`). If subscribe **fails**, that topic is **not** merged into `nextTopics`, so we generally **do not** persist a brand-new topic string without a successful subscribe.

### 5.2 Topics already listed on the doc

Topics that appear in **both** `desired` and `current` are **not** sent through `toSubscribe` again. They remain in the initial `Set(current)` without a fresh subscribe call. So:

- If Firestore **incorrectly** listed a topic the token never had on FCM, or FCM **dropped** a subscription but the doc was not updated, the system **does not** verify FCM state for that topic on every register; it trusts the stored list for the “already present” path.

**Implication:** DB and FCM can drift for “already listed” topics. Mitigations used in this codebase:

- **`POST /api/fcm/sync-topics`** runs `resyncUserTokenTopics` for **all** tokens of the current user (same `syncTokenTopics` logic, then patches docs when `topics` change).
- **Admin role / segment updates** call `fcmService.resyncUserTokenTopics(userId)` after the user record changes (`user.service.ts`: `updateUserRole`, `updateUserSegment`).

### 5.3 Failed unsubscribes

If `unsubscribeFromTopic` fails for a topic, that topic is **not** removed from `nextTopics`, so the doc may still list it even though you intended to drop it (until a later successful unsubscribe).

### 5.4 Summary table

| Situation                                   | Typical outcome                                                             |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| New desired topic, subscribe succeeds       | Topic added to FCM and to persisted `topics`.                               |
| New desired topic, subscribe fails          | Topic **not** added to persisted `topics`.                                  |
| Topic in both desired and current           | No subscribe call; persisted list may retain topic without re-checking FCM. |
| Desired removed topic, unsubscribe succeeds | Removed from FCM and from persisted `topics`.                               |
| Unsubscribe fails                           | May remain in persisted `topics`.                                           |

---

## 6. When topic sync runs

| Trigger                                          | What happens                                                                                                                                                                                                                                                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`POST /api/fcm/register`**                     | Uses `fcmService.register`: skips `syncTokenTopics` when metadata, `isActive`, and stored topics already match desired; otherwise runs `syncTokenTopics` and writes when metadata, reactivation, or post-sync topics differ; may return `already_registered` if nothing changed. |
| **`POST /api/fcm/sync-topics`**                  | `resyncUserTokenTopics(userId)`: every token doc under the user gets `syncTokenTopics`; Firestore is updated when `topics` change.                                                                                                                                               |
| **Admin `updateUserRole` / `updateUserSegment`** | After DB update, `resyncUserTokenTopics(userId)`.                                                                                                                                                                                                                                |

---

## 7. APIs (user)

| Method | Path                       | Role                                                                                                                                   |
| ------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/fcm/register`        | Register/refresh token; conditional write + topic sync. Response includes `status`: `registered` \| `updated` \| `already_registered`. |
| `POST` | `/api/fcm/sync-topics`     | Resync topics for **all** of the caller’s tokens.                                                                                      |
| `GET`  | `/api/fcm/expected-topics` | Returns `topics[]` from `getExpectedTopicsForUser` (desired list for debugging).                                                       |
| `POST` | `/api/fcm/unregister`      | Unsubscribes from topics listed on the doc (best effort), then deletes the doc.                                                        |
| `POST` | `/api/fcm/unregister-all`  | Same unsubscribe-then-delete for every token.                                                                                          |

---

## 8. Admin topic sends

These use FCM **topic** messaging (not per-token multicast to arbitrary lists):

| Endpoint                           | Purpose                 |
| ---------------------------------- | ----------------------- |
| `POST /api/admin/fcm/send-role`    | Send to `role_<role>`.  |
| `POST /api/admin/fcm/send-segment` | Send to `segment_<id>`. |
| `POST /api/admin/fcm/send-all`     | Send to `all_users`.    |

See controller/DTOs under `src/server/modules/fcm/` and route files under `src/app/api/admin/fcm/`.

---

## 9. Firestore shape (per token)

Path: `fcm_tokens/{userId}/tokens/{tokenId}` (token id is typically the FCM token string).

Fields relevant to topics:

- **`topics`**: `string[]` — last reconciled list after `syncTokenTopics` (see limitations above).
- **`topicsUpdatedAt`**: server timestamp when topics were written (with register/resync flows that update topics).

Full token shape for API consumers: `FcmTokenRecord` in `src/shared/types/fcm.types.ts`.

---

## 10. Token deletion and topics

- **`unregister` / `unregister-all` / batch delete after send failures**: the code reads `topics` from the doc (or empty), calls `unsubscribeFromTopic` for each (best effort), then deletes the doc. Stale subscription state on FCM is reduced but not guaranteed if unsubscribe fails.

---

## 11. Debugging in the app

- **`/fcm-test`** (dev-oriented page): can call `register`, list tokens (see `topics` on each row), `expected-topics`, and `sync-topics` to compare desired vs stored vs behavior.

---

## 12. Code map

| Concern                         | Location                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| Topic naming + desired list     | `buildDesiredTopicsForUser`, `buildRoleTopic`, `buildSegmentTopic` — `fcm.service.ts`        |
| Subscribe / unsubscribe + merge | `syncTokenTopics`, `subscribeTokenToTopics`, `unsubscribeTokenFromTopics` — `fcm.service.ts` |
| Register path                   | `fcmService.register` — `fcm.service.ts`; `fcmController.register` — `fcm.controller.ts`     |
| User-wide resync                | `resyncUserTokenTopics` — `fcm.service.ts`                                                   |
| Admin user updates              | `user.service.ts` (`updateUserRole`, `updateUserSegment`)                                    |

---

## 13. Related reading

- [SYSTEM.md](./SYSTEM.md) — client bootstrap, worker, direct sends, sign-out, endpoint list.
