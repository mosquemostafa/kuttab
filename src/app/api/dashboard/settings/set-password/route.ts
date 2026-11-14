import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { dashboardSettingsController } from "@/server/modules/dashboard-settings/dashboard-settings.controller";

const wrap = compose(withErrorHandler, withAuth);

export const POST = wrap((req) => dashboardSettingsController.setPassword(req));
