'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const setupSchema = z.object({
  email: z.string().email('Enter a valid email.').max(200),
  name: z.string().min(2).max(100),
  lga: z.string().min(2).max(100),
  address: z.string().min(5).max(200),
});

type ActionResult =
  | { ok: true; data?: unknown }
  | { ok: false; error: { code: string; message: string } };

export async function completeOnboarding(formData: FormData): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } };
    }

    const parsed = setupSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { ok: false, error: { code: 'invalid_input', message: 'Please check your entries.' } };
    }

    await db.resident.update({
      where: { id: session.residentId },
      data: {
        email: parsed.data.email.toLowerCase().trim(),
        name: parsed.data.name,
        lga: parsed.data.lga,
        address: parsed.data.address,
      },
    });

    revalidatePath('/dashboard');
    logger.info('onboarding.completed', { residentId: session.residentId });
    return { ok: true };
  } catch (error) {
    logger.error('onboarding.complete.failed', { error: String(error) });
    return { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } };
  }
}
