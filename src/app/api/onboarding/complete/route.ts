import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { completeOnboardingSchema } from '@/lib/validators/auth';
import { track } from '@/lib/analytics';

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true; data: { completed: true } };

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = completeOnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: parsed.error.issues[0]?.message || 'Check your input.' } },
        { status: 400 },
      );
    }

    await db.resident.update({
      where: { id: session.residentId },
      data: {
        lga: parsed.data.lga,
        address: parsed.data.address,
        onboardingCompletedAt: new Date(),
      },
    });

    track('signup_completed', { residentId: session.residentId });

    return NextResponse.json<Success>({ ok: true, data: { completed: true } });
  } catch (error) {
    logger.error('onboarding.complete.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } },
      { status: 500 },
    );
  }
}
