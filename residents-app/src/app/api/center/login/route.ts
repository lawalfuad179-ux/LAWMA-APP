import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { loginOperator } from '@/lib/center-auth';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };

const schema = z.object({
  staffCode: z.string().min(1).max(32),
  passcode: z.string().min(1).max(64),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: 'Enter your staff code and passcode.' } },
        { status: 400 },
      );
    }

    const session = await loginOperator(parsed.data.staffCode, parsed.data.passcode);
    if (!session) {
      // Single generic message for both unknown-code and wrong-passcode, so the
      // kiosk cannot be used to discover valid staff codes.
      logger.info('center.login.rejected', { staffCode: parsed.data.staffCode });
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_credentials', message: 'Staff code or passcode is incorrect.' } },
        { status: 401 },
      );
    }

    logger.info('center.login.success', {
      operatorId: session.operatorId,
      centerId: session.centerId,
    });

    return NextResponse.json({
      ok: true,
      data: { operatorName: session.operatorName, centerName: session.centerName },
    });
  } catch (error) {
    logger.error('center.login.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } },
      { status: 500 },
    );
  }
}
