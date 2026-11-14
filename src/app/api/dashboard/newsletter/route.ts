/**
 * @swagger
 * /api/dashboard/newsletter:
 *   get:
 *     summary: Newsletter subscription status for the current user (by account email)
 *     tags:
 *       - Dashboard
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Whether the account email is on the active subscriber list
 *   post:
 *     summary: Subscribe the current user's account email to the newsletter
 *     tags:
 *       - Dashboard
 *     security:
 *       - sessionAuth: []
 *   delete:
 *     summary: Unsubscribe the current user's account email from the newsletter
 *     tags:
 *       - Dashboard
 *     security:
 *       - sessionAuth: []
 *   patch:
 *     summary: Set preferred newsletter email locale (en or ar) for an active newsletter subscription
 *     tags:
 *       - Dashboard
 *     security:
 *       - sessionAuth: []
 */

import { dashboardNewsletterController } from "@/server/modules/dashboard-newsletter/dashboard-newsletter.controller";
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";

const wrap = compose(withErrorHandler, withAuth);

export const GET = wrap((req) => dashboardNewsletterController.getStatus(req));
export const POST = wrap((req) => dashboardNewsletterController.subscribe(req));
export const DELETE = wrap((req) =>
  dashboardNewsletterController.unsubscribe(req),
);
export const PATCH = wrap((req) =>
  dashboardNewsletterController.patchLocale(req),
);
