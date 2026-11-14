import * as Sentry from "@sentry/nextjs";

import { getSentryInitOptions } from "./lib/sentry-init";

const base = getSentryInitOptions();

Sentry.init(base);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
