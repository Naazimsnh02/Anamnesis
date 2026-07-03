import path from "path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
};

// Source-map upload (for readable stack traces) needs SENTRY_AUTH_TOKEN +
// SENTRY_ORG/SENTRY_PROJECT; without them this just skips that step and
// otherwise passes the config through unchanged — safe with no Sentry
// project configured yet (see src/instrumentation.ts).
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: false,
});
