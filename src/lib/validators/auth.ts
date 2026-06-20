import { z } from 'zod';

const strictPassword = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .regex(/[A-Z]/, 'Use at least one uppercase letter.')
  .regex(/[a-z]/, 'Use at least one lowercase letter.')
  .regex(/[0-9]/, 'Use at least one number.')
  .regex(/[^a-zA-Z0-9]/, 'Use at least one special character.');

export const signUpSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  lga: z.string().min(2).max(100).optional(),
  email: z.string().email('Enter a valid email address.').max(200).optional(),
  phoneNumber: z
    .string()
    .min(10, 'Enter a valid Nigerian phone number.')
    .max(15)
    .regex(/^(\+?234|0)[0-9]{10}$/, 'Enter a valid Nigerian phone number.')
    .optional(),
  password: strictPassword,
}).refine((d) => d.phoneNumber || d.email, { message: 'Phone number or email is required.' });

export const signInSchema = z.object({
  phoneNumber: z.string().optional(),
  email: z.string().optional(),
  password: z.string().min(1, 'Enter your password.'),
}).refine((d) => d.phoneNumber || d.email, { message: 'Phone number or email is required.' });

export const setPasswordSchema = z.object({
  password: strictPassword,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: strictPassword,
});

export const forgotPasswordSchema = z.object({
  phoneNumber: z.string().min(10).max(15).regex(/^(\+?234|0)[0-9]{10}$/).optional(),
  email: z.string().email().max(200).optional(),
}).refine((d) => d.phoneNumber || d.email, { message: 'Phone number or email is required.' });

export const resetPasswordSchema = z.object({
  phoneNumber: z.string().min(10).max(15).regex(/^(\+?234|0)[0-9]{10}$/).optional(),
  email: z.string().email().max(200).optional(),
  code: z.string().length(6, 'Enter a valid 6-digit code.').regex(/^[0-9]+$/),
  password: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .regex(/[a-zA-Z]/, 'Use at least one letter.')
    .regex(/[0-9]/, 'Use at least one number.'),
}).refine((d) => d.phoneNumber || d.email, { message: 'Phone number or email is required.' });

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
