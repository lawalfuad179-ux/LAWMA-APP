import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true; data: { url: string } };

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } }, { status: 401 });
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'invalid_input', message: 'Image is required.' } }, { status: 400 });
    }

    const file = formData.get('image');
    if (!file || !(file instanceof File)) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'invalid_input', message: 'Image file is required.' } }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'file_too_large', message: 'Image must be under 10 MB.' } }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'invalid_type', message: 'Only JPG, PNG, or WebP images are accepted.' } }, { status: 400 });
    }

    const blob = await put(`complaints/${session.residentId}/${Date.now()}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    logger.info('complaint.image.uploaded', { residentId: session.residentId });

    return NextResponse.json<Success>({ ok: true, data: { url: blob.url } });
  } catch (error) {
    logger.error('complaint.image.upload.failed', { error: String(error) });
    return NextResponse.json<Failure>({ ok: false, error: { code: 'server_error', message: 'Image upload failed. Try again.' } }, { status: 500 });
  }
}
