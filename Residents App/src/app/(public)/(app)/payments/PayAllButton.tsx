'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type Props = {
  label: string;
};

export function PayAllButton({ label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePayAll() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/initialize-all', {
        method: 'POST',
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
      <Button size="sm" onClick={handlePayAll} disabled={loading}>
        {loading ? 'Processing…' : label}
      </Button>
      {error && <p style={{ marginTop: 8, fontSize: 13, color: 'var(--color-error)' }}>{error}</p>}
    </div>
  );
}
