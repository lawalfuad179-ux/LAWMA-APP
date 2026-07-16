import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { normalizePhone } from '@/lib/validators/auth';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email as string | undefined;
  const phoneNumber = body?.phoneNumber as string | undefined;
  const identifier = email || phoneNumber;

  if (!identifier) {
    return NextResponse.json({ ok: false, exists: false }, { status: 400 });
  }

  let resident: { id: string; passwordHash: string | null } | null = null;

  if (email) {
    resident = await db.resident.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, passwordHash: true },
    });
  } else if (phoneNumber) {
    // Two phone conventions exist in the data. /api/auth/signup and /signin
    // store and look up the normalized +234 form, while the OTP path stores
    // whatever the caller sent (bare digits). Checking both means an account
    // is found regardless of which path created it — otherwise a
    // password-signup user is told "no account found" at sign-in.
    const candidates = Array.from(
      new Set([normalizePhone(phoneNumber), phoneNumber.trim()]),
    );
    resident = await db.resident.findFirst({
      where: { phoneNumber: { in: candidates } },
      select: { id: true, passwordHash: true },
    });
  }

  return NextResponse.json({
    ok: true,
    exists: !!resident,
    hasPassword: !!resident?.passwordHash,
  });
}
