import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { buildContentHash, runScanGuard } from '@/lib/recycle-guard';
import type { RecycleAiReport } from '@/lib/ai';

const schema = z.object({
  imageUrl: z.string().url(),
  imageHash: z.string().optional(),
  report: z.object({
    imageValid: z.boolean().optional(),
    items: z.array(z.object({
      name: z.string(),
      recyclable: z.boolean(),
      category: z.string(),
      instruction: z.string(),
    })),
    summary: z.string(),
    recyclableCount: z.number().int().min(0),
    nonRecyclableCount: z.number().int().min(0),
    environmentalImpact: z.string(),
    tips: z.array(z.string()),
  }),
});

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true; data: { activityId: string } };

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'invalid_input', message: 'Invalid report data.' } }, { status: 400 });
    }

    const { imageUrl, imageHash, report } = parsed.data;
    const contentHash = buildContentHash(report as RecycleAiReport);

    // Anti-abuse guard (cooldown / dup-image / dup-content). Cheap to keep —
    // it protects the AI compute budget even though no rewards are at stake.
    const guardError = await runScanGuard(session.residentId, imageUrl, imageHash, contentHash);
    if (guardError) {
      const status = guardError.code === 'cooldown_active' || guardError.code === 'daily_limit_reached' ? 429 : 409;
      return NextResponse.json<Failure>({ ok: false, error: guardError }, { status });
    }

    const activity = await db.recycleActivity.create({
      data: {
        residentId: session.residentId,
        imageUrl,
        imageHash: imageHash ?? null,
        contentHash,
        aiReport: report as object,
        pointsEarned: 0,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    logger.info('recycle.confirm.success', { residentId: session.residentId, activityId: activity.id });

    return NextResponse.json<Success>({
      ok: true,
      data: { activityId: activity.id },
    }, { status: 201 });
  } catch (error) {
    logger.error('recycle.confirm.failed', { error: String(error) });
    return NextResponse.json<Failure>({ ok: false, error: { code: 'server_error', message: 'Something went wrong.' } }, { status: 500 });
  }
}
