'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { LottiePlayer } from '@/components/ui/LottiePlayer';
import paymentSuccessData from '@/../public/animations/payment-success.json';
import paymentSuccessPulseData from '@/../public/animations/payment-success-pulse.json';
import paymentFailedData from '@/../public/animations/payment-failed.json';
import styles from './PaymentVerifySheet.module.css';

type VerifyStatus = 'verifying' | 'success' | 'failed';

function PaymentVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txRef = searchParams.get('tx_ref');
  const transactionId = searchParams.get('transaction_id');

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<VerifyStatus>('verifying');
  const [entranceDone, setEntranceDone] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    amountKobo: number;
    periodStart: string | null;
    periodEnd: string | null;
    isBulk: boolean;
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retriesRef = useRef(0);
  const MAX_RETRIES = 10;

  const checkStatus = useCallback(async () => {
    if (!txRef) return;
    try {
      const params = new URLSearchParams({ tx_ref: txRef });
      if (transactionId) params.set('transaction_id', transactionId);
      const res = await fetch(`/api/payments/status?${params}`);
      const data = await res.json();

      if (data.status === 'SUCCESSFUL') {
        setPaymentDetails({
          amountKobo: data.amountKobo,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          isBulk: data.isBulk ?? false,
        });
        setStatus('success');
      } else if (data.status === 'FAILED') {
        setStatus('failed');
      } else {
        retriesRef.current += 1;
        if (retriesRef.current >= MAX_RETRIES) {
          setStatus('failed');
        } else {
          timerRef.current = setTimeout(checkStatus, 3000);
        }
      }
    } catch {
      retriesRef.current += 1;
      if (retriesRef.current >= MAX_RETRIES) {
        setStatus('failed');
      } else {
        timerRef.current = setTimeout(checkStatus, 3000);
      }
    }
  }, [txRef, transactionId]);

  useEffect(() => {
    if (!txRef) return;
    setOpen(true);
    setStatus('verifying');
    setEntranceDone(false);
    setPaymentDetails(null);
    retriesRef.current = 0;
    checkStatus();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [txRef, checkStatus]);

  const close = useCallback((refreshPage = false) => {
    setOpen(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    router.replace('/payments', { scroll: false });
    if (refreshPage) router.refresh();
  }, [router]);

  if (!open) return null;

  return (
    <>
      <div
        className={styles.backdrop}
        onClick={() => {
          if (status !== 'verifying') close(status === 'success');
        }}
      />
      <div className={styles.sheet} role="dialog" aria-modal="true">
        <div className={styles.handle} />
        <div className={styles.content}>

          {status === 'verifying' && (
            <>
              <div className={styles.spinner} />
              <h2 className={styles.title}>Verifying your payment…</h2>
              <p className={styles.subtitle}>Please wait while we confirm your transaction.</p>
            </>
          )}

          {status === 'success' && (
            <>
              {!entranceDone ? (
                <LottiePlayer
                  key="entrance"
                  animationData={paymentSuccessData}
                  loop={false}
                  autoplay
                  style={{ width: 160, height: 160 }}
                  onComplete={() => setEntranceDone(true)}
                />
              ) : (
                <LottiePlayer
                  key="pulse"
                  animationData={paymentSuccessPulseData}
                  loop
                  autoplay
                  style={{ width: 160, height: 160 }}
                />
              )}
              <h2 className={styles.title}>Payment Successful!</h2>
              <p className={styles.subtitle}>
                {paymentDetails
                  ? paymentDetails.isBulk
                    ? `₦${(paymentDetails.amountKobo / 100).toLocaleString('en-NG')} paid — all outstanding waste bills cleared.`
                    : paymentDetails.periodStart
                      ? `₦${(paymentDetails.amountKobo / 100).toLocaleString('en-NG')} paid for your ${new Date(paymentDetails.periodStart).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })} waste collection bill. Your account is now up to date.`
                      : `₦${(paymentDetails.amountKobo / 100).toLocaleString('en-NG')} paid. Your waste bill is now cleared.`
                  : 'Your waste collection bill has been paid and your account is now up to date.'
                }
              </p>
              <Button size="lg" onClick={() => close(true)}>Done</Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <LottiePlayer
                animationData={paymentFailedData}
                loop={false}
                autoplay
                style={{ width: 160, height: 160 }}
              />
              <h2 className={styles.title}>Payment Not Confirmed</h2>
              <p className={styles.subtitle}>
                We couldn&apos;t verify your payment. If money left your account, it will be reversed automatically.
              </p>
              <div className={styles.failedActions}>
                <Button
                  size="lg"
                  onClick={() => {
                    retriesRef.current = 0;
                    setStatus('verifying');
                    checkStatus();
                  }}
                >
                  Check Again
                </Button>
                <Button size="lg" variant="secondary" onClick={() => close(false)}>
                  Dismiss
                </Button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}

export function PaymentVerifySheet() {
  return (
    <Suspense fallback={null}>
      <PaymentVerifyContent />
    </Suspense>
  );
}
