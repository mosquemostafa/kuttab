import { subscriptionController } from "@/server/modules/subscriptions/subscription.controller";
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";

export const runtime = "nodejs";

const wrap = compose(withErrorHandler);

export const POST = wrap((req) =>
  subscriptionController.handleKashierWebhook(req),
);
