import { NextResponse } from 'next/server';

import { db } from '@/lib/db';

const REQUIRED_ENV = [
  'DATABASE_URL',
  'FLUTTERWAVE_PUBLIC_KEY',
  'FLUTTERWAVE_SECRET_KEY',
  'FLUTTERWAVE_SECRET_HASH',
  'NEXT_PUBLIC_APP_URL',
  'SMTP_HOST',
  'SMTP_USER',
  'INTERNAL_CRON_SECRET',
  'GEMINI_API_KEY',
] as const;

type HealthCheck = {
  ok: boolean;
  checkedAt: string;
  checks: {
    database: { ok: boolean; latencyMs?: number; error?: string };
    schema: { ok: boolean; error?: string };
    env: { ok: boolean; missing: string[] };
  };
};

export async function GET() {
  const checkedAt = new Date().toISOString();
  const checks: HealthCheck['checks'] = {
    database: { ok: false },
    schema: { ok: false },
    env: { ok: true, missing: [] },
  };

  // Env vars
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  checks.env = { ok: missing.length === 0, missing };

  // DB connectivity
  const dbStart = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (e) {
    checks.database = { ok: false, latencyMs: Date.now() - dbStart, error: String(e).slice(0, 200) };
  }

  // Schema spot-check: confirm bills.discount_kobo exists (the column that
  // bit us in the original P2022 production incident).
  try {
    await db.$queryRaw`SELECT "discount_kobo" FROM "bills" LIMIT 0`;
    checks.schema = { ok: true };
  } catch (e) {
    checks.schema = { ok: false, error: String(e).slice(0, 200) };
  }

  const ok = checks.database.ok && checks.schema.ok && checks.env.ok;
  const status = ok ? 200 : 503;

  return NextResponse.json<HealthCheck>({ ok, checkedAt, checks }, { status });
}
