// Node.js runtime — runs on the Vercel server / Node serverless functions.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: 0.1,
    // Attach local variables to stack frames for easier debugging.
    includeLocalVariables: true,
    sendDefaultPii: false,
  });
}
