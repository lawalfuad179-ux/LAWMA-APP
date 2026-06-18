import crypto from 'crypto';

import { db } from '@/lib/db';
import type { RecycleAiReport } from '@/lib/ai';

const GUARD = {
  COOLDOWN_MS:            5 * 60 * 1000,        // 5 minutes between confirmed scans
  DAILY_LIMIT:            10,                    // max confirmed scans per 24 h
  DAILY_WINDOW_MS:        24 * 60 * 60 * 1000,  // 24 hours
  CONTENT_HASH_WINDOW_MS: 24 * 60 * 60 * 1000,  // same items blocked for 24 h
  IMAGE_HASH_WINDOW_MS:   7  * 24 * 60 * 60 * 1000, // same file blocked for 7 days
};

export type GuardError = { code: string; message: string };

/** SHA-256 of sorted recyclable item names — catches the same pile of items scanned repeatedly */
export function buildContentHash(report: RecycleAiReport): string {
  const key = report.items
    .filter((i) => i.recyclable)
    .map((i) => i.name.toLowerCase().trim())
    .sort()
    .join('|');
  return crypto.createHash('sha256').update(key || '__no_recyclables__').digest('hex');
}

/**
 * Runs all 5 abuse-protection layers in order (cheapest first).
 * Returns a GuardError on the first violation, null if all checks pass.
 */
export async function runScanGuard(
  residentId: string,
  imageUrl: string,
  imageHash: string | undefined,
  contentHash: string,
): Promise<GuardError | null> {
  // ── Layer 1: imageUrl idempotency ──────────────────────────────────────
  // Prevents the same image URL being confirmed more than once.
  const existing = await db.recycleActivity.findFirst({
    where: { residentId, imageUrl },
    select: { id: true },
  });
  if (existing) {
    return { code: 'already_confirmed', message: 'This scan has already been claimed.' };
  }

  // ── Layer 2: exact image file hash (7-day window) ──────────────────────
  // Catches the same image file re-uploaded under a different URL.
  if (imageHash) {
    const hashWindow = new Date(Date.now() - GUARD.IMAGE_HASH_WINDOW_MS);
    const imageDup = await db.recycleActivity.findFirst({
      where: {
        residentId,
        imageHash,
        status: 'CONFIRMED',
        confirmedAt: { gte: hashWindow },
      },
      select: { id: true },
    });
    if (imageDup) {
      return { code: 'duplicate_image', message: 'This photo was already used recently. Take a new one.' };
    }
  }

  // ── Layer 3: cooldown between scans (5 minutes) ────────────────────────
  // Prevents rapid-fire confirming.
  const cooldownSince = new Date(Date.now() - GUARD.COOLDOWN_MS);
  const recentScan = await db.recycleActivity.findFirst({
    where: {
      residentId,
      status: 'CONFIRMED',
      confirmedAt: { gte: cooldownSince },
    },
    orderBy: { confirmedAt: 'desc' },
    select: { confirmedAt: true },
  });
  if (recentScan) {
    const waitSec = Math.ceil(
      (GUARD.COOLDOWN_MS - (Date.now() - recentScan.confirmedAt!.getTime())) / 1000,
    );
    return {
      code: 'cooldown_active',
      message: `Please wait ${waitSec}s before your next scan.`,
    };
  }

  // ── Layer 4: daily scan cap (10 per 24 hours) ──────────────────────────
  const dayWindow = new Date(Date.now() - GUARD.DAILY_WINDOW_MS);
  const todayCount = await db.recycleActivity.count({
    where: {
      residentId,
      status: 'CONFIRMED',
      confirmedAt: { gte: dayWindow },
    },
  });
  if (todayCount >= GUARD.DAILY_LIMIT) {
    return {
      code: 'daily_limit_reached',
      message: `You've reached today's scan limit (${GUARD.DAILY_LIMIT} per day). Try again tomorrow.`,
    };
  }

  // ── Layer 5: content fingerprint (same items, 24-hour window) ──────────
  // Catches different photos of the same pile of recyclables.
  const contentWindow = new Date(Date.now() - GUARD.CONTENT_HASH_WINDOW_MS);
  const contentDup = await db.recycleActivity.findFirst({
    where: {
      residentId,
      contentHash,
      status: 'CONFIRMED',
      confirmedAt: { gte: contentWindow },
    },
    select: { id: true },
  });
  if (contentDup) {
    return { code: 'duplicate_content', message: 'These same items were already scanned today.' };
  }

  return null;
}
