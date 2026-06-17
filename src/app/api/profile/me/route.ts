import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const resident = await db.resident.findUnique({
    where: { id: session.residentId },
    select: { name: true, avatarUrl: true, address: true, lga: true },
  });

  if (!resident) return NextResponse.json({ ok: false }, { status: 404 });

  return NextResponse.json({ ok: true, name: resident.name, avatarUrl: resident.avatarUrl, address: resident.address, lga: resident.lga });
}
