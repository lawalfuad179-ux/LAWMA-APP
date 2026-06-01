export type ActionResult =
  | { ok: true; data?: unknown }
  | { ok: false; error: { code: string; message: string } };

export type ComplaintIssueType = 'MISSED_PICKUP' | 'ILLEGAL_DUMPING' | 'OVERFLOWING_BIN' | 'OTHER';

export type ComplaintStatusType = 'SUBMITTED' | 'IN_REVIEW' | 'ASSIGNED' | 'RESOLVED';

export type BillStatusType = 'PENDING' | 'PAID' | 'OVERDUE';

export type PaymentStatusType = 'PENDING' | 'SUCCESSFUL' | 'FAILED';

export type NotificationType = 'SCHEDULE' | 'PAYMENT' | 'COMPLAINT';
