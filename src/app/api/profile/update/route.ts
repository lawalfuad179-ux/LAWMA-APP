import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body: { name?: string; address?: string; lga?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { name, address, lga } = body;

  if (!name?.trim() || !address?.trim() || !lga?.trim()) {
    return NextResponse.json({ ok: false, error: 'Name, address and LGA are required' }, { status: 422 });
  }

  const resident = await db.resident.update({
    where: { id: session.residentId },
    data: { name: name.trim(), address: address.trim(), lga: lga.trim() },
    select: { id: true, name: true, address: true, lga: true },
  });

  return NextResponse.json({ ok: true, data: resident });
}
