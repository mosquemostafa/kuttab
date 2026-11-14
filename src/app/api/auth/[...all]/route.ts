/**
 * @swagger
 * /api/auth/sign-up/email:
 *   post:
 *     summary: Register a new user account
 *     description: Better Auth email/password sign-up. All POST /api/auth requests require Content-Type application/json (Swagger sends it when a JSON body is defined).
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password (min 8 characters)
 *               name:
 *                 type: string
 *                 description: User's full name
 *               callbackURL:
 *                 type: string
 *                 description: Optional redirect after sign-up (path or absolute URL)
 *             required:
 *               - email
 *               - password
 *               - name
 *     responses:
 *       200:
 *         description: User account created successfully
 *       400:
 *         description: Invalid input or email already exists
 *       500:
 *         description: Server error
 *
 * /api/auth/sign-in/email:
 *   post:
 *     summary: Sign in to user account
 *     description: Better Auth email/password sign-in. Requires application/json. Session is set via Set-Cookie; sign in first in this browser to reuse cookies on other Auth calls.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *               rememberMe:
 *                 type: boolean
 *                 description: Keep user signed in
 *               callbackURL:
 *                 type: string
 *                 description: Optional redirect after sign-in
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Successfully signed in
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Server error
 *
 * /api/auth/sign-out:
 *   post:
 *     summary: Sign out from user account
 *     description: Terminate the session. Better Auth requires Content-Type application/json; send body {}. Requires the session cookie (sign in via POST /api/auth/sign-in/email in this browser first).
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Empty JSON object
 *             additionalProperties: false
 *     responses:
 *       200:
 *         description: Successfully signed out
 *       401:
 *         description: Not authenticated
 *       415:
 *         description: Missing or non-JSON Content-Type (send application/json)
 *
 * /api/auth/get-session:
 *   get:
 *     summary: Get current session (Better Auth)
 *     description: Better Auth exposes GET /get-session (not /session). Send the session cookie. Returns { session, user } or null when unauthenticated.
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Session and user when authenticated; when logged out Better Auth may return null or an empty payload depending on version—see Better Auth get-session docs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   type: object
 *                   description: Active session (Better Auth Session type)
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     image:
 *                       type: string
 *                       nullable: true
 *                     role:
 *                       type: string
 *       401:
 *         description: Not authenticated or invalid session
 *
 * /api/auth/request-password-reset:
 *   post:
 *     summary: Request password reset
 *     description: Send a password reset email. Requires application/json. Optional redirectTo should match your reset page path (e.g. with locale).
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               redirectTo:
 *                 type: string
 *                 description: URL (or path) to open after reset link (token in query)
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 *
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password (Better Auth)
 *     description: POST /reset-password under /api/auth. Requires application/json. Body must use newPassword and token (from reset email query string), not password.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password (min length enforced server-side)
 *               token:
 *                 type: string
 *                 description: Reset token from email link (?token=…)
 *             required:
 *               - newPassword
 *               - token
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token / validation error
 *
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password (Better Auth)
 *     description: POST /change-password under /api/auth. Requires application/json and session cookie. Body uses currentPassword and newPassword (not oldPassword). Optional revokeOtherSessions invalidates other devices.
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password (Better Auth field name)
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *               revokeOtherSessions:
 *                 type: boolean
 *                 description: If true, sign out other sessions (default false if omitted)
 *             required:
 *               - currentPassword
 *               - newPassword
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or incorrect current password
 *       401:
 *         description: Not authenticated (missing or invalid session)
 *
 * /api/auth/sign-in/social:
 *   post:
 *     summary: Start OAuth / social sign-in (Better Auth)
 *     description: POST /sign-in/social — initiates GitHub or Google OAuth (returns JSON with redirect URL or sets Location). Requires application/json. Not GET /oauth/{provider}.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google, github]
 *                 description: Social provider id
 *               callbackURL:
 *                 type: string
 *                 description: Where to send the user after successful sign-in
 *               newUserCallbackURL:
 *                 type: string
 *                 description: Redirect if the user is newly registered
 *               errorCallbackURL:
 *                 type: string
 *                 description: Redirect on OAuth error
 *               disableRedirect:
 *                 type: boolean
 *                 description: If true, returns provider URL in JSON instead of redirecting
 *     responses:
 *       200:
 *         description: JSON with url and redirect flag, or session when using idToken flow
 *       302:
 *         description: Redirect to provider when disableRedirect is false
 *       404:
 *         description: Unknown provider
 *
 * /api/auth/callback/{provider}:
 *   get:
 *     summary: OAuth callback (Better Auth)
 *     description: Provider redirects here after authorization (e.g. /api/auth/callback/github). Query parameters include code and state; do not call manually from Swagger unless completing a real OAuth round-trip.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github]
 *         description: OAuth provider id
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from provider
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: CSRF state from sign-in/social step
 *     responses:
 *       302:
 *         description: Redirect into app with session cookie set
 *       400:
 *         description: Invalid or missing OAuth parameters
 */

import { auth } from "@/server/lib/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
