import styles from './RewardHistoryList.module.css';

export type RewardLedgerRow = {
  id: string;
  amount: number;
  description: string;
  createdAt: string; // ISO — serialized across the server/client boundary
};

/**
 * The wallet's ledger, in the same dashed till-slip idiom as the kiosk
 * receipts — earns read as +₦, redemptions as −₦, so the "waste pays the
 * bill" loop is visible end to end.
 */
export function RewardHistoryList({ rows }: { rows: RewardLedgerRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>Wallet activity</h2>
      <div className={styles.list}>
        {rows.map((t) => (
          <div className={styles.row} key={t.id}>
            <div className={styles.meta}>
              <span className={styles.desc}>{t.description}</span>
              <span className={styles.date}>
                {new Date(t.createdAt).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <span className={`${styles.amount} ${t.amount < 0 ? styles.amountOut : ''}`}>
              {t.amount < 0 ? '−' : '+'}₦{Math.abs(t.amount).toLocaleString('en-NG')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
