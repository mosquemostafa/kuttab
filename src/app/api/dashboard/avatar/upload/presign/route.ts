import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { avatarR2Controller } from "@/server/modules/users/avatar-r2.controller";

const wrap = compose(withErrorHandler, withAuth);

export const POST = wrap((req) => avatarR2Controller.presign(req));
