import { z } from 'zod';

export const phoneNumberSchema = z
  .string()
  .min(10, 'Phone number is too short.')
  .max(15, 'Phone number is too long.')
  .regex(/^\+?[0-9]+$/, 'Enter a valid phone number.');

export const otpCodeSchema = z
  .string()
  .length(6, 'OTP must be 6 digits.')
  .regex(/^[0-9]+$/, 'OTP must contain only numbers.');

export const addressSetupSchema = z.object({
  name: z.string().min(2, 'Name is required.').max(100),
  lga: z.string().min(2, 'Please select your Local Government Area.'),
  address: z.string().min(5, 'Please enter your street address.').max(200),
});

export const complaintSchema = z.object({
  issueType: z.enum(['MISSED_PICKUP', 'ILLEGAL_DUMPING', 'OVERFLOWING_BIN', 'OTHER'], {
    message: 'Please select an issue type.',
  }),
  area: z.string().min(2, 'Please enter your area.').max(100),
  address: z.string().min(5, 'Please enter the address.').max(200),
  description: z.string().max(500).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const paymentInitSchema = z.object({
  billId: z.string().uuid('Invalid bill reference.'),
});
