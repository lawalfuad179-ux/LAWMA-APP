import { logger } from '@/lib/logger';

type EventName =
  | 'signup_started'
  | 'signup_completed'
  | 'signup_abandoned'
  | 'login_success'
  | 'login_failed'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'tutorial_started'
  | 'tutorial_completed'
  | 'tutorial_skipped'
  | 'dashboard_first_visit';

export function track(event: EventName, data?: Record<string, unknown>) {
  logger.info(`analytics.${event}`, { ...data, timestamp: new Date().toISOString() });
}
