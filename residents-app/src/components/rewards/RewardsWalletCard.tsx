import Link from 'next/link';
import { ArrowRight, Wallet } from 'lucide-react';

import styles from './RewardsWalletCard.module.css';

type LastCredit = {
  amountPoints: number;
  description: string;
  createdAt: Date;
};

type Props = {
  balancePoints: number;
  /** Latest EARNED_* ledger row, if any — the "you just got paid" moment. */
  lastCredit: LastCredit | null;
  /** Dashboard variant: whole card links to /payments. */
  compact?: boolean;
};

const naira = (points: number) => `₦${points.toLocaleString('en-NG')}`;

function relativeDay(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

/**
 * The reward wallet's home. The whole pitch is "your waste pays your bill" —
 * this card is where a resident actually sees that happen: the balance, the
 * last credit, and where the money goes next.
 */
export function RewardsWalletCard({ balancePoints, lastCredit, compact }: Props) {
  const body = (
    <>
      <span className={styles.mark} aria-hidden="true">
        <Wallet size={19} strokeWidth={1.8} />
      </span>

      <div className={styles.info}>
        <span className={styles.label}>Reward wallet</span>
        {balancePoints > 0 ? (
          <span className={styles.caption}>
            {lastCredit
              ? `+${naira(lastCredit.amountPoints)} ${relativeDay(lastCredit.createdAt)} · auto-applies to your next bill`
              : 'Auto-applies to your next waste bill'}
          </span>
        ) : (
          <span className={styles.caption}>
            Pay bills in-app or drop sorted recyclables at a LAWMA centre — credit lands here
          </span>
        )}
      </div>

      <div className={styles.amountWrap}>
        <span className={styles.amount}>{naira(balancePoints)}</span>
        {balancePoints > 0 && (
          <span className={styles.points}>
            {balancePoints.toLocaleString('en-NG')} point{balancePoints === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {compact && <ArrowRight size={16} strokeWidth={1.8} className={styles.chevron} aria-hidden="true" />}
    </>
  );

  if (compact) {
    return (
      <Link href="/payments" className={`${styles.card} ${styles.cardLink}`} aria-label="Reward wallet — view payments">
        {body}
      </Link>
    );
  }

  return <div className={styles.card}>{body}</div>;
}
