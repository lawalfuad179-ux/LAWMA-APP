'use client';

import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styles from './PayNowButton.module.css';

type Props = {
  billId: string;
  label: string;
};

export function PayNowButton({ billId, label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message || 'Payment failed. Please try again.');
        return;
      }
      window.location.href = json.data.checkoutUrl;
    } catch {
      setError('Could not connect. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.root}>
      {error ? (
        <div className={styles.errorState}>
          <AlertCircle size={16} strokeWidth={1.5} className={styles.errorIcon} />
          <p className={styles.errorText}>{error}</p>
          <button
            className={styles.retryBtn}
            onClick={handlePay}
            type="button"
            disabled={loading}
          >
            <RefreshCw size={14} strokeWidth={1.5} />
            {loading ? 'Retrying…' : 'Try again'}
          </button>
        </div>
      ) : (
        <Button size="sm" onClick={handlePay} isLoading={loading}>
          {label}
        </Button>
      )}
    </div>
  );
}
