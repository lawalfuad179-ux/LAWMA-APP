import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

import { getSession } from '@/lib/auth';
import { analyzeWasteImage } from '@/lib/ai';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true; data: { imageUrl: string; report: Awaited<ReturnType<typeof analyzeWasteImage>> } };

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
      return NextResponse.json<Failure>({ ok: false, error: { code: 'invalid_type', message: 'Only JPG, PNG, WebP, or HEIC images are accepted.' } }, { status: 400 });
    }

    const blob = await put(`recycle/${session.residentId}/${Date.now()}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    const report = await analyzeWasteImage(blob.url);

    logger.info('recycle.scan.completed', { residentId: session.residentId, recyclableCount: report.recyclableCount });

    return NextResponse.json<Success>({ ok: true, data: { imageUrl: blob.url, report } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong.';
    logger.error('recycle.scan.failed', { error: String(error) });
    return NextResponse.json<Failure>({ ok: false, error: { code: 'server_error', message } }, { status: 500 });
  }
}
