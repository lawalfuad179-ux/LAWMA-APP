'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

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
      setError('Could not connect. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button size="sm" onClick={handlePay} disabled={loading}>
        {loading ? 'Processing…' : label}
      </Button>
      {error && <p style={{ marginTop: 8, fontSize: 13, color: 'var(--color-error)' }}>{error}</p>}
    </div>
  );
}
