import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import { db } from '@/lib/db';

// Deliberately a different cookie name and a different table to the resident
// session in src/lib/auth.ts. An operator session must never satisfy a
// resident check, or vice versa — they are separate trust domains sharing
// one deployment.
const CENTER_COOKIE_NAME = 'lawma_center_session';

// Short by design: a kiosk is a shared device on a counter. If staff walk away,
// the till should not stay open all week the way a resident's phone can.
const CENTER_SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

export type CenterSessionData = {
  operatorId: string;
  operatorName: string;
  centerId: string;
  centerName: string;
  sessionId: string;
};

/**
 * Resolves the current operator session from the kiosk cookie.
 * Returns null when absent, unknown, expired, or the operator/centre has since
 * been deactivated — deactivation takes effect on the next request rather than
 * waiting for the session to lapse.
 */
export async function getCenterSession(): Promise<CenterSessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CENTER_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.centerSession.findUnique({
    where: { token },
    include: { operator: { include: { center: true } } },
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await db.centerSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  if (!session.operator.isActive || !session.operator.center.isActive) return null;

  return {
    operatorId: session.operator.id,
    operatorName: session.operator.name,
    centerId: session.operator.center.id,
    centerName: session.operator.center.name,
    sessionId: session.id,
  };
}

/**
 * Verifies a staff code + passcode pair and opens a kiosk session.
 * Returns null on any failure — the caller must not distinguish "no such staff
 * code" from "wrong passcode" in its response, so a passer-by cannot use the
 * login screen to enumerate valid staff codes.
 */
export async function loginOperator(
  staffCode: string,
  passcode: string,
): Promise<CenterSessionData | null> {
  const operator = await db.centerOperator.findUnique({
    where: { staffCode: staffCode.trim().toUpperCase() },
    include: { center: true },
  });
  if (!operator || !operator.isActive || !operator.center.isActive) return null;

  const ok = await bcrypt.compare(passcode, operator.passcodeHash);
  if (!ok) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + CENTER_SESSION_DURATION_MS);

  const session = await db.centerSession.create({
    data: { operatorId: operator.id, token, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(CENTER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return {
    operatorId: operator.id,
    operatorName: operator.name,
    centerId: operator.center.id,
    centerName: operator.center.name,
    sessionId: session.id,
  };
}

/** Ends the kiosk session and clears the cookie. */
export async function logoutOperator(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CENTER_COOKIE_NAME)?.value;
  if (token) {
    await db.centerSession.deleteMany({ where: { token } }).catch(() => {});
    cookieStore.delete(CENTER_COOKIE_NAME);
  }
}

export async function hashPasscode(passcode: string): Promise<string> {
  return bcrypt.hash(passcode, 10);
}
