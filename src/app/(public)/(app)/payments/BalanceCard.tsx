'use client';

import { useState } from 'react';
import { Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import styles from './BalanceCard.module.css';

type Props = {
  totalKobo: number;
  pendingCount: number;
  overdueCount: number;
};

function formatKobo(amountKobo: number) {
  return `₦${(amountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BalanceCard({ totalKobo, pendingCount, overdueCount }: Props) {
  const [showAmount, setShowAmount] = useState(true);

  return (
    <Card className={styles.card}>
      <span className={styles.label}>Outstanding Balance</span>
      <div className={styles.amountRow}>
        <span className={`${styles.amount} ${showAmount ? styles.visible : styles.hidden}`}>
          {showAmount ? formatKobo(totalKobo) : '******'}
        </span>
        <button
          className={styles.toggleBtn}
          onClick={() => setShowAmount((v) => !v)}
          type="button"
          aria-label={showAmount ? 'Hide balance' : 'Show balance'}
        >
          {showAmount ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
        </button>
      </div>
      {pendingCount > 0 || overdueCount > 0 ? (
        <span className={styles.meta}>
          {overdueCount > 0 ? (
            <><TriangleAlert size={12} strokeWidth={1.5} /> {overdueCount} overdue, {pendingCount} pending</>
          ) : (
            <>{pendingCount} pending {pendingCount === 1 ? 'bill' : 'bills'}</>
          )}
        </span>
      ) : null}
    </Card>
  );
}
