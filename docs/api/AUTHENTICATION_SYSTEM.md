# Authentication System Documentation

This document explains how authentication works in this project from end to end, based on the current implementation.

## 1) Authentication Stack At A Glance

- Identity/auth engine: Better Auth
- Session transport: cookie-based session managed by Better Auth
- Entry route for auth protocol: `/api/auth/[...all]`
- Primary auth methods:
  - Email/password (sign up, sign in, reset password)
  - OAuth social login (Google, GitHub)
- Authorization model:
  - Route-level guards (`withAuth`, `withAdmin`, `withSupportStaff`, `withContentManager`)
  - Layout-level role checks for dashboard surfaces
- Persistence:
  - Drizzle adapter with tables: `users`, `sessions`, `accounts`, `verifications`
- Email delivery:
  - Resend for authentication emails (verification + password reset), with Gmail SMTP retained for other transactional emails and as a fallback when Resend is not configured

## 2) Core Files And Responsibilities

### Better Auth Setup

- `src/server/lib/auth.ts`
  - Creates Better Auth instance.
  - Configures trusted origins and host trust.
  - Connects Better Auth to Drizzle (`drizzleAdapter`).
  - Enables account linking.
  - Configures email/password, password reset, and email verification behavior.
  - Configures social providers (Google, GitHub).
  - Enables plugins:
    - `nextCookies()` for Next.js cookie/session integration
    - `admin(...)` for role-aware admin APIs

### Auth API Route

- `src/app/api/auth/[...all]/route.ts`
  - Exposes Better Auth handler through `toNextJsHandler(auth)`.
  - This is the single HTTP gateway for Better Auth operations.

### Auth Service (App-Level Wrapper)

- `src/server/modules/auth/auth.service.ts`
  - Wraps Better Auth API calls for:
    - `registerWithEmail`
    - `loginWithEmail`
    - `requestPasswordReset`
    - `resetPassword`
  - Applies project-specific behavior after sign-up:
    - Reads app settings (`requireEmailVerification`)
    - Can force-set `emailVerified` in DB when verification is disabled.

### Client Auth Helpers

- `src/lib/auth-client.ts`
  - Creates Better Auth React client.
  - Exposes social sign-in helpers:
    - `signInWithGoogle()`
    - `signInWithGithub()`

### Server Actions For Auth Pages

- `src/app/[locale]/auth/register/action.ts`
- `src/app/[locale]/auth/login/action.ts`
- `src/app/[locale]/auth/forgot-password/action.ts`
- `src/app/[locale]/auth/reset-password/action.ts`

These actions:

- Validate form input (Zod schemas from `src/lib/schemas.ts`).
- Call `authService` methods.
- Convert backend/API errors into user-facing `ActionResult` objects.

### Guards And Wrappers

- `src/server/guards/auth.guard.ts` -> authenticated user required.
- `src/server/guards/admin.guard.ts` -> authenticated admin required.
- `src/server/guards/support-staff.guard.ts` -> admin or support role required.
- `src/server/guards/content-manager.guard.ts` -> admin or content manager role required.
- `src/server/decorators/compose.ts` -> wrapper composition utility.
- `src/server/decorators/with-error-handler.ts` -> centralized exception mapping.

### Session Access Utility (Server Actions)

- `src/server/utils/action-auth.ts`
  - Standard way for server actions to fetch current request headers + session.

### Edge/Proxy Access Control

- `src/proxy.ts`
  - Distinguishes public vs protected paths.
  - Redirects unauthenticated users from protected paths to localized login route.
  - Redirects already-authenticated users away from `/auth/*` pages to dashboard.
  - Redirects already-authenticated users away from localized landing root (`/`, `/ar`, `/en`) to localized dashboard overview.

### Email Sender

- `src/server/lib/auth-email.ts`
  - Sends authentication emails via Resend (verification + password reset), with a safe fallback to Gmail SMTP when Resend is not configured.
- `src/server/lib/email.ts`
  - Nodemailer Gmail transporter for transactional emails (support/feedback confirmations).
  - Localized HTML/text templates reused by auth for:
    - email verification
    - password reset

## 3) Data Model Used By Authentication

Defined in `src/server/db/schema.ts`:

- `users`
  - identity + profile + authorization fields (including `role`, `emailVerified`, ban fields)
- `sessions`
  - active sessions and expiry/token metadata
- `accounts`
  - provider links (`credential`, `google`, `github`, etc.) and tokens
- `verifications`
  - verification/reset token data managed by Better Auth

This schema is connected to Better Auth via Drizzle adapter in `src/server/lib/auth.ts`.

## 4) Request/Execution Flows

## 4.1 Registration (Email + Password)

Path through system:

1. User submits register form (`src/components/auth/register-form.tsx`).
2. Form calls server action `registerUser`.
3. Action validates input with `registerSchema`.
4. Action calls `authService.registerWithEmail`.
5. Service calls `auth.api.signUpEmail(...)` with callback URL (`/dashboard`).
6. Service reads app setting `requireEmailVerification`.
7. If verification is disabled, service marks the user as verified in DB via `userRepository.markEmailVerified`.
8. Action returns localized success/error message.

Verification email behavior:

- In Better Auth config (`src/server/lib/auth.ts`):
  - `emailVerification.sendOnSignUp = true`
  - `autoSignInAfterVerification = true`
- Actual email is sent via Resend using the localized template pipeline.

## 4.2 Login (Email + Password)

1. Login form (`src/components/auth/login-form.tsx`) submits credentials.
2. Server action `loginUser` calls `authService.loginWithEmail`.
3. Service calls `auth.api.signInEmail(...)`.
4. Better Auth sets/updates session cookie.
5. Client redirects to `/dashboard` after success.

## 4.3 Social Login (Google/GitHub)

1. Login/register page invokes `signInWithGoogle` or `signInWithGithub` from `src/lib/auth-client.ts`.
2. Better Auth client starts OAuth flow with callback `/dashboard`.
3. Provider returns to Better Auth callback endpoint.
4. Better Auth creates/updates account link in `accounts` table and session in `sessions` table.
5. User lands in dashboard context.

Account linking:

- Enabled globally via `account.accountLinking.enabled = true` in `src/server/lib/auth.ts`.

## 4.4 Forgot Password + Reset Password

Forgot password:

1. User submits email in `forgot-password` form.
2. `requestPasswordReset` action validates email and calls `authService.requestPasswordReset`.
3. Service calls `auth.api.requestPasswordReset({ redirectTo: "/auth/reset-password" })`.
4. Better Auth sends reset URL by invoking `sendResetPassword` callback configured in `src/server/lib/auth.ts`.
5. Callback sends localized email via Resend.

Reset password:

1. User opens link containing token, lands on `/auth/reset-password?token=...`.
2. Action `resetPassword(token, password)` validates token/password.
3. Service calls `auth.api.resetPassword(...)`.
4. Better Auth enforces config:

- reset token expiry: 1 hour
- revoke sessions on reset: enabled

5. UI clears token from URL and redirects user to login.

## 4.5 Session Retrieval For Protected APIs

Pattern in route handlers:

1. Route composes wrappers: `compose(withErrorHandler, withAuth)` (or admin/specialized guard).
2. Guard calls `auth.api.getSession({ headers: req.headers })`.
3. If unauthorized: throws `UnauthorizedException`.
4. If authorized: attaches `session` on request object and calls controller.
5. Controller/service executes business logic.

This same pattern powers admin/support/content role enforcement through corresponding guards.

## 4.6 Session Retrieval For Server Actions

Pattern:

1. Action calls `getActionAuthContext()`.
2. Helper reads request headers using Next `headers()`.
3. Helper resolves session via `auth.api.getSession(...)`.
4. Action/service checks user id and role before sensitive operations.

This is used in:

- dashboard settings actions
- admin settings actions
- other dashboard server actions requiring authenticated user context

## 5) Authorization Model (Roles + Enforcement)

Role enum source: `src/shared/enums/user-role.enum.ts`

Roles:

- `user`
- `admin`
- `support`
- `content_manager`

Important nuance:

- Better Auth admin plugin APIs are directly typed around `user|admin` semantics.
- Custom roles (`support`, `content_manager`) are persisted through repository-level DB update paths where needed.

Enforcement layers:

- API guard layer:
  - `withAuth`: any authenticated user
  - `withAdmin`: admin only
  - `withSupportStaff`: admin or support
  - `withContentManager`: admin or content manager
- App layout layer:
  - dashboard/admin/support/content/docs layouts each verify session/role and reject unauthorized users.

## 6) Route Protection Strategy

`src/proxy.ts` implements coarse-grained access:

- Public route families include `/auth/*` and `/`.
- Protected route families include `/dashboard*`, `/admin*`, `/support*`, `/content*`, `/todos*`, `/settings*`, `/updates*`, `/docs*`.
- If unauthenticated on protected path -> redirect to localized `/auth/login`.
- If authenticated and visiting `/auth/*` -> redirect to localized dashboard route.
- If authenticated and visiting localized landing root (`/`, `/ar`, `/en`) -> redirect to localized `/dashboard/overview`.

Fine-grained role enforcement happens later in server layouts and API guards.

Landing implications:

- Landing page components no longer need client-side session checks for logged-in variants.
- This avoids unnecessary landing-session fetches and prevents authenticated users from seeing landing UI.

## 7) Email Verification And Reset Email Details

Configured in `src/server/lib/auth.ts`:

- Email/password auth is enabled.
- Email verification is required by Better Auth config by default.
- Verification email is sent on sign-up.
- Password reset token expires in one hour.
- Password reset revokes existing sessions.

Delivery pipeline:

1. Better Auth callback provides user + URL.
2. Locale is inferred from callback URL path prefix.
3. Localized subject/body template is chosen (`ar` or `en`).
4. `sendAuthEmail(...)` sends through Resend (falls back to Gmail SMTP when Resend is not configured).

## 8) Admin-Level Auth Operations

Through `userService` and admin-protected routes/controllers, admins can:

- create users
- set roles
- ban/unban users
- revoke sessions
- delete users
- trigger verification emails for newly created users (when not auto-verified)

Core files:

- `src/server/modules/users/admin-user.controller.ts`
- `src/server/modules/users/user.service.ts`
- `src/app/api/admin/users/**/*.ts`

## 9) User Account Security Features

Implemented features include:

- Password complexity validation with shared Zod schema (`src/lib/schemas.ts`).
- Change password flow requiring current password.
- Set password flow for users initially authenticated without credential password.
- Session revocation on password reset.
- Optional admin operation to revoke user sessions.
- Ban/unban support via Better Auth admin API.

## 10) Error Handling And Response Mapping

Auth-related APIs/actions rely on:

- Guard-thrown typed exceptions (`UnauthorizedException`, `ForbiddenException`).
- Central exception mapper (`src/server/exceptions/exception-handler.ts`).
- Action-level mapping of Better Auth `APIError` to localized UI messages.

This yields consistent API error payloads and user-facing action results.

## 11) Configuration Requirements (Environment)

Key env vars for auth stack (validated in `src/server/lib/env.ts`):

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `GMAIL_FROM_EMAIL`, `GMAIL_FROM_NAME`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME` (used for auth emails via Resend)

If any required variable is missing/invalid, app startup fails with explicit validation errors.

## 12) Practical End-To-End Mental Model

Think about auth in four stages:

1. Identity/session engine
   - Better Auth handles credential validation, OAuth, session issuance, verification/reset token lifecycle.
2. Project-specific orchestration
   - `authService` adds app-level policy behavior (for example, conditional auto-verification based on settings).
3. Access control
   - `proxy.ts` controls broad public/protected navigation.
   - guards/layout checks enforce authenticated + role requirements.
4. Domain operations under authenticated context
   - controllers/services use session headers and role checks to execute business operations safely.

This layered design keeps authentication concerns centralized while preserving module-first service/repository boundaries.

## 13) Reference Map (Quick Navigation)

- Auth engine config: `src/server/lib/auth.ts`
- Auth transport route: `src/app/api/auth/[...all]/route.ts`
- Auth service wrapper: `src/server/modules/auth/auth.service.ts`
- Auth client helpers: `src/lib/auth-client.ts`
- Auth schemas: `src/lib/schemas.ts`
- Auth forms:
  - `src/components/auth/register-form.tsx`
  - `src/components/auth/login-form.tsx`
  - `src/components/auth/forgot-password-form.tsx`
  - `src/components/auth/reset-password-form.tsx`
- Auth actions:
  - `src/app/[locale]/auth/register/action.ts`
  - `src/app/[locale]/auth/login/action.ts`
  - `src/app/[locale]/auth/forgot-password/action.ts`
  - `src/app/[locale]/auth/reset-password/action.ts`
- Session helper for actions: `src/server/utils/action-auth.ts`
- Guards:
  - `src/server/guards/auth.guard.ts`
  - `src/server/guards/admin.guard.ts`
  - `src/server/guards/support-staff.guard.ts`
  - `src/server/guards/content-manager.guard.ts`
- Path access rules: `src/lib/paths.ts`
- Proxy redirects: `src/proxy.ts`
- Email sender/templates: `src/server/lib/email.ts`
- User + auth tables: `src/server/db/schema.ts`
