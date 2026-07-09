'use client';

import { useMemo, useState } from 'react';
import type { Bill } from '@prisma/client';
import { Download, ChevronDown, Star, Receipt } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PayNowButton } from './PayNowButton';
import { BILL_STATUS_LABELS } from '@/constants';
import { computeAutoRedeem, pointsToKobo } from '@/lib/rewards';
import styles from './page.module.css';

type FilterValue = 'ALL' | Bill['status'];

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'ALL', label: 'All bills' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PAID', label: 'Paid' },
];

function formatKobo(amountKobo: number) {
  return `₦${(amountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BillHistoryList({ bills, rewardBalance }: { bills: Bill[]; rewardBalance: number }) {
  const [filter, setFilter] = useState<FilterValue>('ALL');

  const filtered = useMemo(
    () => (filter === 'ALL' ? bills : bills.filter((b) => b.status === filter)),
    [bills, filter]
  );

  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionEyebrow}>
          <Receipt size={15} strokeWidth={1.5} />
          <span>Bill History</span>
        </div>
        <div className={styles.filterSelectWrap}>
          <select
            className={styles.filterSelect}
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterValue)}
            aria-label="Filter bill history"
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <ChevronDown size={14} strokeWidth={2} className={styles.filterSelectIcon} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.filterEmpty}>No bills in this category.</p>
      ) : (
        <div className={styles.list}>
          {filtered.map((bill) => {
            const isOutstanding = bill.status === 'PENDING' || bill.status === 'OVERDUE';
            const projectedPoints = isOutstanding
              ? computeAutoRedeem(bill.amountKobo, bill.discountKobo, rewardBalance)
              : 0;
            const projectedDiscountKobo = pointsToKobo(projectedPoints);
            const effectiveAmountKobo = bill.amountKobo - bill.discountKobo - projectedDiscountKobo;

            return (
              <Card key={bill.id} className={styles.billCard}>
                <div className={styles.billTop}>
                  <div className={styles.billPeriod}>
                    {new Date(bill.periodStart).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    {' — '}
                    {new Date(bill.periodEnd).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <Badge
                    label={BILL_STATUS_LABELS[bill.status]}
                    variant={
                      bill.status === 'PAID' ? 'success' :
                      bill.status === 'OVERDUE' ? 'error' : 'warning'
                    }
                  />
                </div>
                <div className={styles.billBottom}>
                  {isOutstanding && (bill.discountKobo > 0 || projectedDiscountKobo > 0) ? (
                    <div className={styles.billAmountStack}>
                      <span className={styles.billAmountStrike}>{formatKobo(bill.amountKobo)}</span>
                      <span className={styles.billAmount}>{formatKobo(effectiveAmountKobo)}</span>
                    </div>
                  ) : (
                    <span className={styles.billAmount}>{formatKobo(bill.amountKobo)}</span>
                  )}
                  <div className={styles.billDue}>
                    Due {new Date(bill.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                {isOutstanding && (bill.discountKobo > 0 || projectedDiscountKobo > 0) && (
                  <p className={styles.billDiscountNote}>
                    <Star size={12} strokeWidth={1.8} />
                    {projectedDiscountKobo > 0
                      ? `${projectedPoints} pts (₦${(projectedDiscountKobo / 100).toLocaleString('en-NG')}) will apply on Pay Now`
                      : `₦${(bill.discountKobo / 100).toLocaleString('en-NG')} reward credit applied`}
                  </p>
                )}
                {isOutstanding && (
                  <PayNowButton billId={bill.id} label={`Pay Now — ${formatKobo(effectiveAmountKobo)}`} />
                )}
                {bill.status === 'PAID' && (
                  <a
                    href={`/api/payments/receipt/${bill.id}`}
                    className={styles.receiptLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download size={14} strokeWidth={1.6} />
                    Download receipt (PDF)
                  </a>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
