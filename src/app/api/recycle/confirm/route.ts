import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { calcPointsForScan } from '@/lib/rewards';
import { logger } from '@/lib/logger';
import type { RecycleAiReport } from '@/lib/ai';

const schema = z.object({
  imageUrl: z.string().url(),
  report: z.object({
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
type Success = { ok: true; data: { activityId: string; pointsEarned: number; newBalance: number } };

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

    const { imageUrl, report } = parsed.data;

    const existingCount = await db.recycleActivity.count({ where: { residentId: session.residentId } });
    const isFirstScan = existingCount === 0;
    const pointsEarned = calcPointsForScan(report as RecycleAiReport, isFirstScan);

    const [activity, rewardAccount] = await db.$transaction(async (tx) => {
      const act = await tx.recycleActivity.create({
        data: {
          residentId: session.residentId,
          imageUrl,
          aiReport: report as object,
          pointsEarned,
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      const acct = await tx.rewardAccount.upsert({
        where: { residentId: session.residentId },
        update: {
          balance: { increment: pointsEarned },
          totalEarned: { increment: pointsEarned },
        },
        create: {
          residentId: session.residentId,
          balance: pointsEarned,
          totalEarned: pointsEarned,
          totalRedeemed: 0,
        },
      });

      await tx.pointTransaction.create({
        data: {
          residentId: session.residentId,
          amount: pointsEarned,
          type: isFirstScan ? 'BONUS_FIRST_SCAN' : 'EARNED_RECYCLING',
          description: `Recycling scan: ${report.recyclableCount} recyclable item${report.recyclableCount !== 1 ? 's' : ''} identified`,
          activityId: act.id,
        },
      });

      await tx.notification.create({
        data: {
          residentId: session.residentId,
          title: `+${pointsEarned} Recycling Points Earned!`,
          body: `Great work! You earned ${pointsEarned} points for recycling${isFirstScan ? ' (includes first-scan bonus)' : ''}. Keep it up to unlock bill discounts.`,
          type: 'RECYCLING_REWARD',
          referenceId: act.id,
        },
      });

      return [act, acct];
    });

    logger.info('recycle.confirm.success', { residentId: session.residentId, activityId: activity.id, pointsEarned });

    return NextResponse.json<Success>({
      ok: true,
      data: { activityId: activity.id, pointsEarned, newBalance: rewardAccount.balance },
    }, { status: 201 });
  } catch (error) {
    logger.error('recycle.confirm.failed', { error: String(error) });
    return NextResponse.json<Failure>({ ok: false, error: { code: 'server_error', message: 'Something went wrong.' } }, { status: 500 });
  }
}
