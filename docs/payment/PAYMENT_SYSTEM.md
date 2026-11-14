# Payment & Subscription System Documentation

## Purpose

This document describes the current backend payment/subscription system implementation in Modawim, including:

- Architecture and module boundaries
- Data model and domain enums
- Plan catalog and entitlement resolution
- API endpoints (user + admin)
- Current behavior vs. not-yet-implemented behavior
- Operational notes, risks, and next steps

This documentation is implementation-accurate for the current codebase state.

---

## Current Status (Important)

The system is currently in a hybrid state:

- Implemented and functional:
  - Manual admin activation flow
  - Trial start flow
  - Subscription CRUD-like admin actions (extend, renew, change plan, cancel, notes)
  - Admin invoice refund flow (with eligibility guard)
  - Entitlements resolution based on active plan period
  - Subscription event timeline retrieval
- Not implemented yet:
  - Real payment gateway checkout/session creation
  - Real webhook signature verification and mutation logic for Paymob/Kashier

In short: **manual/backoffice flows work; automated gateway payment flow is scaffolded but not complete yet**.

---

## Code Structure

Core module files:

- `src/server/modules/subscriptions/subscription.dto.ts`
- `src/server/modules/subscriptions/subscription.controller.ts`
- `src/server/modules/subscriptions/subscription.service.ts`
- `src/server/modules/subscriptions/subscription.repository.ts`
- `src/server/modules/subscriptions/subscription-entitlements.ts`
- `src/shared/types/subscription.types.ts`
- `src/server/db/schema.ts` (tables, indexes, checks)

API route layer:

- User routes: `src/app/api/plans`, `src/app/api/entitlements`, `src/app/api/subscription/**`
- Admin routes: `src/app/api/admin/subscriptions/**`, `src/app/api/admin/invoices/[id]/refund`
- Webhooks: `src/app/api/webhooks/paymob`, `src/app/api/webhooks/kashier`

---

## Domain Model

### Subscription

Main record per user (unique user -> one subscription row).

Key fields:

- `id`, `userId`
- `plan`: `free | trial | pro | business`
- `status`: `active | past_due | cancelled | expired`
- `planStartedAt`, `planExpiresAt`
- `autoRenew`, `trialUsed`
- `activatedBy`: `gateway | manual | trial`
- Gateway refs (`gateway`, `gatewaySubscriptionId`, `gatewayCustomerId`)
- `notes`, timestamps

Important DB constraints:

- Unique index on `subscriptions.user_id`
- Check: manual activation requires `activatedByUserId`

### Invoice

Billing records linked to subscription.

Key fields:

- `subscriptionId`, `amount`, `currency`
- `status`: `paid | pending | failed | refunded | partially_refunded`
- `refundedAmount`, `refundReason`
- `paymentMethod`, gateway/payment references
- `periodStart`, `periodEnd`, `paidAt`

Important DB constraints:

- `refundedAmount` required for refunded statuses
- `refundReason` required for refunded statuses
- non-negative and `refundedAmount <= amount`
- unique `(gateway, gatewayPaymentId)` when non-null

### Subscription Event

Audit timeline records linked to subscription.

Used to record lifecycle and admin actions (trial start, manual activation, renew, extend, cancel, refund, etc.).

---

## Plan Catalog & Entitlements

Defined in `subscription-entitlements.ts`.

Plans:

- `free`
- `trial`
- `pro`
- `business`

Each plan has:

- `features` (max habits, analytics, CSV export, reminders)
- `config` (price, currency, renewal days, emoji, localized display name)

### Entitlement Resolution Rule

Entitlements are currently derived primarily by plan period:

- If no subscription or `planExpiresAt <= now` => `free`
- If `planExpiresAt > now` => current `subscription.plan`

Current product rule intentionally ignores `status` and `autoRenew` when resolving entitlements.

---

## Lifecycle Behaviors

### Manual activation (admin)

Creates:

- Subscription row
- Activation event (`manually_activated`)
- Invoice row

Guard:

- Fails if user already has a subscription row.

### Trial start (user)

If no subscription row:

- Creates a trial subscription row (`autoRenew=true`, `trialUsed=true`)
- Writes trial-started event

If row exists:

- Blocks if `trialUsed=true`
- Blocks if current plan period still active
- Otherwise updates row to trial and writes event

### Cancel/resume by user

- Cancel toggles `autoRenew=true`
- Resume toggles `autoRenew=false`

### Admin extend / renew / change plan / cancel

- `extend`: add days, reactivate if expired
- `renew`: add plan-config renewal days
- `change-plan`: reset plan period from now, create invoice + event
- `cancel`: immediate hard cancel (`status=cancelled`, `planExpiresAt=now`) + event

### Admin refund

Flow:

- Find invoice by id
- Validate status is refundable (`paid` or `partially_refunded`)
- Validate refund amount math (including cumulative amount)
- Update invoice status and refund fields
- Optionally revoke access (`subscription.status=cancelled`, `planExpiresAt=now`)
- Write `payment_refunded` event

---

## API Surface

## Public/User Endpoints

### `GET /api/plans`

Returns:

- `data.features` keyed by plan
- `data.config` keyed by plan

### `GET /api/entitlements` (auth)

Returns resolved current plan + feature gates for current user.

### `GET /api/subscription` (auth)

Returns current subscription row for current user or `null`.

### `GET /api/subscription/invoices` (auth)

Returns current user invoices (newest first).

### `POST /api/subscription/checkout` (auth)

Currently scaffolded only. Returns placeholder payload with `checkoutUrl: null`.

### `POST /api/subscription/cancel` (auth)

Sets `autoRenew=true`.

### `POST /api/subscription/resume` (auth)

Sets `autoRenew=false`.

### `POST /api/subscription/trial/start` (auth)

Starts trial when eligible.

## Admin Endpoints

### `GET /api/admin/subscriptions`

Paginated list with filters:

- `status`
- `plan`
- `activatedBy`
- `page`
- `limit`

(`expiringSoon` filter was intentionally removed.)

### `GET /api/admin/subscriptions/{id}`

`{id}` is **subscriptionId** (aligned with other admin sub-routes).

Returns:

- `subscription` (or `null` if not found)
- `invoices` for that subscription id

### `POST /api/admin/subscriptions/activate`

Manual activation flow (creates subscription + event + invoice).

### `PATCH /api/admin/subscriptions/{id}/extend`

Extend period by `addedDays`.

### `PATCH /api/admin/subscriptions/{id}/renew`

Renew by plan renewal days.

### `PATCH /api/admin/subscriptions/{id}/change-plan`

Change plan and reset period from now.

### `POST /api/admin/subscriptions/{id}/cancel`

Hard cancel. Request body now accepts only:

- `notes?`

(`reason` and `immediate` were removed to match implementation.)

### `PATCH /api/admin/subscriptions/{id}/notes`

Update internal notes.

### `GET /api/admin/subscriptions/{id}/events`

Returns ordered event timeline (newest first).

### `PATCH /api/admin/invoices/{id}/refund`

Manual refund with optional access revocation.

## Webhooks

### `POST /api/webhooks/paymob`

### `POST /api/webhooks/kashier`

Currently placeholders returning `{ received: true }`.

Not yet implemented:

- Signature verification
- Idempotency handling
- Mutation and reconciliation logic

---

## Validation & Guards Summary

Input validation uses Zod DTO schemas.

Notable guards:

- Trial cannot start twice
- Trial cannot start while active period exists
- Refund only for `paid` or `partially_refunded` invoices
- Refund amount and cumulative refund cannot exceed invoice amount
- Admin activation blocked if user already has subscription row

---

## Security & Consistency Notes

- Admin routes are protected with `withAdmin`.
- User routes requiring identity use `withAuth`.
- Webhook security is pending and must be completed before production gateway enablement.
- Event timeline now has real query implementation and should be treated as audit source.

---

## Known Limitations

1. Checkout is not integrated with payment gateways yet.
2. Webhook handlers are placeholders (no signature/idempotency).
3. Refund flow currently stores single `refundReason` field on invoice (latest reason), not a separate refund history ledger table.
4. Some state transitions are pragmatic for current phase (for example hard cancel behavior).

---

## Recommended Next Milestones

1. Implement gateway checkout session creation for selected gateways.
2. Implement webhook verification + idempotency + event mapping.
3. Add reconciliation jobs for payment/subscription drift handling.
4. Add integration tests for full subscription lifecycle.
5. Consider explicit financial ledger/history records if advanced finance reporting is required.

---

## Quick Test Checklist

- Admin activate subscription creates: subscription + event + invoice.
- Trial start blocks after `trialUsed=true`.
- Cancel/resume toggle `autoRenew`.
- Admin events endpoint returns timeline entries after each admin action.
- Refund:
  - rejects `pending`/`failed`
  - allows `paid`
  - supports partial then full refund
  - optionally revokes access
- `GET /api/admin/subscriptions/{id}` works with subscription id and returns matching invoices.
