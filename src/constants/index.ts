export const LAGOS_LGAS = [
  'Agege',
  'Ajeromi-Ifelodun',
  'Alimosho',
  'Amuwo-Odofin',
  'Apapa',
  'Badagry',
  'Epe',
  'Eti-Osa',
  'Ibeju-Lekki',
  'Ifako-Ijaiye',
  'Ikeja',
  'Ikorodu',
  'Kosofe',
  'Lagos Island',
  'Lagos Mainland',
  'Mushin',
  'Ojo',
  'Oshodi-Isolo',
  'Shomolu',
  'Surulere',
] as const;

export type LagosLga = typeof LAGOS_LGAS[number];

export const COMPLAINT_ISSUE_TYPES = [
  { value: 'MISSED_PICKUP', label: 'Missed Pickup' },
  { value: 'ILLEGAL_DUMPING', label: 'Illegal Dumping' },
  { value: 'OVERFLOWING_BIN', label: 'Overflowing Bin' },
  { value: 'OTHER', label: 'Other Issue' },
] as const;

export const COMPLAINT_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  IN_REVIEW: 'In Review',
  ASSIGNED: 'Assigned',
  RESOLVED: 'Resolved',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  SUCCESSFUL: 'Successful',
  FAILED: 'Failed',
};

export const BILL_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
};

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const OTP_EXPIRY_MINUTES = 5;
export const OTP_LENGTH = 6;
export const OTP_COOLDOWN_SECONDS = 60;
