import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getSession } from '@/lib/auth';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ ok: false, error: 'Only JPEG, PNG, WebP or HEIC images are allowed' }, { status: 415 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'File exceeds 10 MB limit' }, { status: 413 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const blob = await put(filename, file, {
    access: 'public',
    addRandomSuffix: false,
  });

  return NextResponse.json({ ok: true, url: blob.url });
}
