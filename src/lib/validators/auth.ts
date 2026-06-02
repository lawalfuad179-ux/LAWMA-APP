import { z } from 'zod';

export const signUpSchema = z.object({
  name: z.string().min(2, 'Enter your full name.').max(100),
  phoneNumber: z
    .string()
    .min(10, 'Enter a valid Nigerian phone number.')
    .max(15)
    .regex(/^(\+?234|0)[0-9]{10}$/, 'Enter a valid Nigerian phone number.'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .regex(/[a-zA-Z]/, 'Use at least one letter.')
    .regex(/[0-9]/, 'Use at least one number.'),
});

export const signInSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, 'Enter a valid Nigerian phone number.')
    .max(15)
    .regex(/^(\+?234|0)[0-9]{10}$/, 'Enter a valid Nigerian phone number.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const forgotPasswordSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, 'Enter a valid Nigerian phone number.')
    .max(15)
    .regex(/^(\+?234|0)[0-9]{10}$/, 'Enter a valid Nigerian phone number.'),
});

export const resetPasswordSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, 'Enter a valid Nigerian phone number.')
    .max(15)
    .regex(/^(\+?234|0)[0-9]{10}$/, 'Enter a valid Nigerian phone number.'),
  code: z.string().length(6, 'Enter a valid 6-digit code.').regex(/^[0-9]+$/),
  password: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .regex(/[a-zA-Z]/, 'Use at least one letter.')
    .regex(/[0-9]/, 'Use at least one number.'),
});

export const completeOnboardingSchema = z.object({
  lga: z.string().min(2, 'Select your Local Government Area.').max(100),
  address: z.string().min(5, 'Enter your street address.').max(200),
});

/** Normalize Nigerian phone numbers to +234 format */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('234')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+234${cleaned.slice(1)}`;
  return `+${cleaned}`;
}
