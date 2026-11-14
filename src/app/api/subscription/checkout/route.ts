import { subscriptionController } from "@/server/modules/subscriptions/subscription.controller";
import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";

const wrap = compose(withErrorHandler, withAuth);

export const POST = wrap((req) => subscriptionController.checkout(req));
