import { cookies } from 'next/headers';
import crypto from 'crypto';

import { db } from '@/lib/db';

const SESSION_COOKIE_NAME = 'lawma_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type SessionData = {
  residentId: string;
  sessionId: string;
};

/**
 * Retrieves the current session from the cookie.
 * Returns null if no valid session exists.
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { token },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    // Session expired — clean it up
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    residentId: session.residentId,
    sessionId: session.id,
  };
}

/**
 * Creates a new session for a resident and sets the session cookie.
 */
export async function createSession(residentId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.session.create({
    data: {
      residentId,
      token,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return token;
}

/**
 * Destroys the current session and removes the cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {});
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}
