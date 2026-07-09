import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const complaint = await db.complaint.findUnique({ where: { id } });
  if (!complaint) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  if (complaint.residentId !== session.residentId) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  await db.complaint.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const complaint = await db.complaint.findUnique({ where: { id } });
  if (!complaint) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  if (complaint.residentId !== session.residentId) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  let body: { issueType?: string; area?: string; address?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (body.issueType !== undefined) data.issueType = body.issueType;
  if (body.area !== undefined) data.area = body.area;
  if (body.address !== undefined) data.address = body.address;
  if (body.description !== undefined) data.description = body.description;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 422 });
  }

  await db.complaint.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
