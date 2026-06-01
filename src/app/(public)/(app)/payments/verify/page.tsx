'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export default function VerifyPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txRef = searchParams.get('tx_ref');
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');

  useEffect(() => {
    if (!txRef) {
      setStatus('failed');
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payments/status?tx_ref=${txRef}`);
        const data = await res.json();

        if (data.status === 'SUCCESSFUL') {
          setStatus('success');
        } else {
          // Poll again after a delay
          setTimeout(checkStatus, 3000);
        }
      } catch {
        setTimeout(checkStatus, 3000);
      }
    };

    // Start checking after 3 seconds to let webhook arrive
    const timer = setTimeout(checkStatus, 3000);
    return () => clearTimeout(timer);
  }, [txRef]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {status === 'verifying' && (
          <>
            <div className={styles.spinner} />
            <h1 className={styles.title}>Verifying your payment...</h1>
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
            <p className={styles.subtitle}>Could not verify your payment. Please check your payment history.</p>
            <Button size="lg" variant="secondary" onClick={() => router.push('/payments')}>
              View Bills
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
