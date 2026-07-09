import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

import { getSession } from '@/lib/auth';
import { analyzeWasteImage } from '@/lib/ai';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true; data: { imageUrl: string; report: Awaited<ReturnType<typeof analyzeWasteImage>>; imageHash: string } };

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

    const bytes = Buffer.from(await file.arrayBuffer());
    const imageHash = crypto.createHash('sha256').update(bytes).digest('hex');

    const blob = await put(`recycle/${session.residentId}/${Date.now()}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });
    const imageUrl = blob.url;

    const report = await analyzeWasteImage(imageUrl);

    if (!report.imageValid) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'no_waste_detected', message: 'No waste was detected in this image. Make sure the photo clearly shows waste items in good lighting.' } },
        { status: 422 },
      );
    }

    logger.info('recycle.scan.completed', { residentId: session.residentId, recyclableCount: report.recyclableCount });

    return NextResponse.json<Success>({ ok: true, data: { imageUrl, report, imageHash } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong.';
    logger.error('recycle.scan.failed', { error: String(error) });
    return NextResponse.json<Failure>({ ok: false, error: { code: 'server_error', message } }, { status: 500 });
  }
}
