'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const setupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(100).optional().or(z.literal('')),
  lga: z.string().min(2, 'Please select your LGA.').max(100).optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters.').max(200),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  phoneNumber: z.string().min(10, 'Enter a valid Nigerian phone number.').optional().or(z.literal('')),
});

type ActionResult =
  | { ok: true; data?: unknown }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string> } };

export async function completeOnboarding(formData: FormData): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } };
    }

    const raw = Object.fromEntries(formData);
    const parsed = setupSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [field, issues] of Object.entries(parsed.error.flatten().fieldErrors)) {
        fieldErrors[field] = (issues as string[])?.[0] ?? 'Invalid value.';
      }
      return { ok: false, error: { code: 'invalid_input', message: 'Please check your entries.', fieldErrors } };
    }

    const updateData: Record<string, string> = {
      address: parsed.data.address,
    };
    if (parsed.data.name) updateData.name = parsed.data.name;
    if (parsed.data.lga) updateData.lga = parsed.data.lga;
    if (parsed.data.email) updateData.email = parsed.data.email;
    if (parsed.data.phoneNumber) updateData.phoneNumber = parsed.data.phoneNumber;

    await db.resident.update({
      where: { id: session.residentId },
      data: updateData,
    });

    revalidatePath('/dashboard');
    logger.info('onboarding.completed', { residentId: session.residentId });
    return { ok: true };
  } catch (error) {
    logger.error('onboarding.complete.failed', { error: String(error) });
    return { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } };
  }
}
