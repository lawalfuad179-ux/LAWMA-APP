import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body: { name?: string; address?: string; lga?: string; onboardingVersion?: number; avatarUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const data: Record<string, string | number> = {};

  if (body.name?.trim()) data.name = body.name.trim();
  if (body.address?.trim()) data.address = body.address.trim();
  if (body.lga?.trim()) data.lga = body.lga.trim();
  if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl;

  if (body.onboardingVersion !== undefined) {
    data.onboardingVersion = body.onboardingVersion;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 422 });
  }

  const resident = await db.resident.update({
    where: { id: session.residentId },
    data,
    select: { id: true, name: true, address: true, lga: true, onboardingVersion: true },
  });

  return NextResponse.json({ ok: true, data: resident });
}
