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
  { value: 'MISSED_PICKUP', label: 'Missed Pickup', description: 'Your scheduled waste pickup was skipped' },
  { value: 'ILLEGAL_DUMPING', label: 'Illegal Dumping', description: 'Waste dumped in an unauthorized location' },
  { value: 'OVERFLOWING_BIN', label: 'Overflowing Bin', description: 'A public or shared bin is overflowing' },
  { value: 'PSP_MISCONDUCT', label: 'PSP Misconduct', description: 'Complaint about PSP operator conduct' },
  { value: 'WASTE_BURNING', label: 'Waste Burning', description: 'Illegal burning of waste materials' },
  { value: 'OTHER', label: 'Other Issue', description: 'Any other waste management issue' },
] as const;

export const COMPLAINT_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  IN_REVIEW: 'In Review',
  ASSIGNED: 'Assigned',
  RESOLVED: 'Resolved',
};

export const COMPLAINT_STATUS_ORDER: string[] = [
  'SUBMITTED',
  'IN_REVIEW',
  'ASSIGNED',
  'RESOLVED',
];

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  SUCCESSFUL: 'Successful',
  FAILED: 'Failed',
  REVERSED: 'Reversed',
};

export const BILL_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
};

export const COLLECTION_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  DELAYED: 'Delayed',
  MISSED: 'Missed',
  COMPLETED: 'Completed',
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

export const DAYS_OF_WEEK_SHORT = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  COLLECTION_REMINDER: 'Collection Reminder',
  DELAYED_PICKUP: 'Delayed Pickup',
  COMPLAINT_UPDATE: 'Complaint Update',
  PAYMENT_CONFIRMATION: 'Payment Confirmation',
  ANNOUNCEMENT: 'LAWMA Announcement',
  RECYCLING_REWARD: 'Recycling Reward',
};

export const RECYCLING_TIPS = [
  { category: 'Home', title: 'Plastic Bottles', description: 'Rinse, crush, and remove caps. Drop at designated collection points.' },
  { category: 'Home', title: 'Cardboard & Paper', description: 'Flatten boxes. Keep dry. Separate from food waste.' },
  { category: 'Home', title: 'Aluminum Cans', description: 'Rinse and crush. Separate from general waste.' },
  { category: 'Home', title: 'Organic Waste', description: 'Food scraps can be composted. Do not mix with plastics.' },
  { category: 'Markets', title: 'Market Waste', description: 'Separate organic market waste from plastics and metals.' },
  { category: 'Markets', title: 'Polythene Bags', description: 'Reduce usage. Reuse where possible. Dispose responsibly.' },
  { category: 'Businesses', title: 'E-Waste', description: 'Batteries and electronics require special disposal. Do not mix.' },
  { category: 'Businesses', title: 'Commercial Waste', description: 'Businesses must register for dedicated collection services.' },
  { category: 'Illegal Dumping', title: 'Report Illegal Dumping', description: 'Use the report feature to alert LAWMA of illegal dumping sites.' },
] as const;

export const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'var(--color-status-info)',
  DELAYED: 'var(--color-status-warning)',
  MISSED: 'var(--color-status-error)',
  COMPLETED: 'var(--color-status-success)',
  SUBMITTED: 'var(--color-status-info)',
  IN_REVIEW: 'var(--color-status-warning)',
  ASSIGNED: 'var(--color-status-warning)',
  RESOLVED: 'var(--color-status-success)',
  PENDING: 'var(--color-status-warning)',
  PAID: 'var(--color-status-success)',
  OVERDUE: 'var(--color-status-error)',
  FAILED: 'var(--color-status-error)',
  SUCCESSFUL: 'var(--color-status-success)',
  REVERSED: 'var(--color-status-error)',
};

export const OTP_EXPIRY_MINUTES = 5;
export const OTP_LENGTH = 6;
export const OTP_COOLDOWN_SECONDS = 60;
