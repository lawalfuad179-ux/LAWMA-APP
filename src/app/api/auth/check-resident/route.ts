import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';

type Response = { ok: boolean; exists: boolean };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email as string | undefined;
  const phoneNumber = body?.phoneNumber as string | undefined;
  const identifier = email || phoneNumber;

  if (!identifier) {
    return NextResponse.json({ ok: false, exists: false }, { status: 400 });
  }

  const resident = email
    ? await db.resident.findUnique({ where: { email: email.toLowerCase().trim() } })
    : await db.resident.findUnique({ where: { phoneNumber: identifier } });

  return NextResponse.json({ ok: true, exists: !!resident });
}
