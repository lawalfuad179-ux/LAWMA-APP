'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txRef = searchParams.get('tx_ref');
  const transactionId = searchParams.get('transaction_id');
  const flwStatus = searchParams.get('status'); // 'successful' | 'cancelled' | 'failed'

  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!txRef) {
      setStatus('failed');
      return;
    }

    // Flutterwave already told us it failed/was cancelled
    if (flwStatus && flwStatus !== 'successful') {
      setStatus('failed');
      return;
    }

    const checkStatus = async () => {
      try {
        const params = new URLSearchParams({ tx_ref: txRef });
        if (transactionId) params.set('transaction_id', transactionId);

        const res = await fetch(`/api/payments/status?${params}`);
        const data = await res.json();

        if (data.status === 'SUCCESSFUL') {
          setStatus('success');
        } else if (data.status === 'FAILED') {
          setStatus('failed');
        } else {
          // Still pending — retry
          timerRef.current = setTimeout(checkStatus, 3000);
        }
      } catch {
        timerRef.current = setTimeout(checkStatus, 3000);
      }
    };

    // Check immediately on mount (no initial delay)
    checkStatus();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [txRef, transactionId, flwStatus]);

  return (
    <div className={styles.container}>
      {status === 'verifying' && (
        <>
          <div className={styles.spinner} />
          <h1 className={styles.title}>Verifying your payment…</h1>
          <p className={styles.subtitle}>Please wait while we confirm your transaction.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className={styles.checkmark}>✓</div>
          <h1 className={styles.title}>Payment Successful!</h1>
          <p className={styles.subtitle}>Your waste bill has been paid.</p>
          <Button size="lg" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </>
      )}

      {status === 'failed' && (
        <>
          <div className={styles.cross}>✕</div>
          <h1 className={styles.title}>Verification Failed</h1>
          <p className={styles.subtitle}>Could not verify your payment. Please check your payment history or try again.</p>
          <Button size="lg" variant="secondary" onClick={() => router.push('/payments')}>
            View Bills
          </Button>
        </>
      )}
    </div>
  );
}

export default function VerifyPaymentPage() {
  return (
    <div className={styles.page}>
      <Suspense fallback={
        <div className={styles.container}>
          <div className={styles.spinner} />
          <h1 className={styles.title}>Loading…</h1>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
