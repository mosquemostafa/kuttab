import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { fcmController } from "@/server/modules/fcm/fcm.controller";

const wrap = compose(withErrorHandler, withAuth);

export const POST = wrap((req) => fcmController.syncTopics(req));
