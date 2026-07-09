// Edge runtime — runs in middleware and edge route handlers.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
