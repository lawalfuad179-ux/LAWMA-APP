type LogLevel = 'info' | 'warn' | 'error';

type LogPayload = Record<string, unknown>;

function formatLog(level: LogLevel, event: string, payload?: LogPayload) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    event,
    ...payload,
  };
  return JSON.stringify(entry);
}

export const logger = {
  info(event: string, payload?: LogPayload) {
    // eslint-disable-next-line no-console
    console.info(formatLog('info', event, payload));
  },
  warn(event: string, payload?: LogPayload) {
    // eslint-disable-next-line no-console
    console.warn(formatLog('warn', event, payload));
  },
  error(event: string, payload?: LogPayload) {
    // eslint-disable-next-line no-console
    console.error(formatLog('error', event, payload));
  },
};
