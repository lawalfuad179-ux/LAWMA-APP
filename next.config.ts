import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.100.68'],
};

export default withSentryConfig(nextConfig, {
  // Sentry org/project — read from env so the same code works for any org.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps automatically during `next build`. Requires
  // SENTRY_AUTH_TOKEN to be set at build time on Vercel.
  silent: !process.env.CI,

  // Strip source maps from the client bundle after they upload to Sentry.
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});
