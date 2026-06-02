export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export type ComplaintIssueType = 'MISSED_PICKUP' | 'ILLEGAL_DUMPING' | 'OVERFLOWING_BIN' | 'OTHER';

export type ComplaintStatusType = 'SUBMITTED' | 'IN_REVIEW' | 'ASSIGNED' | 'RESOLVED';

export type BillStatusType = 'PENDING' | 'PAID' | 'OVERDUE';

export type PaymentStatusType = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REVERSED';

export type CollectionStatusType = 'SCHEDULED' | 'DELAYED' | 'MISSED' | 'COMPLETED';

export type NotificationType =
  | 'COLLECTION_REMINDER'
  | 'DELAYED_PICKUP'
  | 'COMPLAINT_UPDATE'
  | 'PAYMENT_CONFIRMATION'
  | 'ANNOUNCEMENT';
