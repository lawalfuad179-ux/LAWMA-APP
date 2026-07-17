'use client';

import { Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, X } from 'lucide-react';
import StarIcon from '@/components/icons/star-icon';
import type { AnimatedIconHandle } from '@/components/icons/types';

import { Button } from '@/components/ui/Button';
import { LottiePlayer } from '@/components/ui/LottiePlayer';
import { useSwipeDownToClose } from '@/hooks/useSwipeDownToClose';
import paymentSuccessData from '@/../public/animations/payment-success.json';
import paymentSuccessPulseData from '@/../public/animations/payment-success-pulse.json';
import paymentFailedData from '@/../public/animations/payment-failed.json';
import styles from './PaymentVerifySheet.module.css';

type VerifyStatus = 'verifying' | 'success' | 'failed';

/** The CSS reset can't stop JS-driven Lottie frames — gate them here. */
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}

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
    pointsAwarded: number;
    newBalance: number;
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retriesRef = useRef(0);
  const MAX_RETRIES = 10;
  const sheetRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<AnimatedIconHandle>(null);

  // Play the star fill-in once the reward chip actually has something to
  // celebrate — a short delay so it lands just after the chip appears
  // rather than competing with the main success checkmark's own entrance.
  useEffect(() => {
    if (paymentDetails && paymentDetails.pointsAwarded > 0) {
      const t = setTimeout(() => starRef.current?.startAnimation(), 300);
      return () => clearTimeout(t);
    }
  }, [paymentDetails]);

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
          pointsAwarded: data.pointsAwarded ?? 0,
          newBalance: data.newBalance ?? 0,
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

  useSwipeDownToClose(handleRef, sheetRef, () => {
    if (status !== 'verifying') close(status === 'success');
  });

  const reducedMotion = usePrefersReducedMotion();

  // Modal manners (same standard as the Navbar dialogs): focus moves into
  // the sheet, Escape closes it once there's a settled outcome, and Tab
  // stays inside while it's open.
  useEffect(() => {
    if (!open) return;
    sheetRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && status !== 'verifying') {
        close(status === 'success');
        return;
      }
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const focusables = sheetRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, status, close]);

  if (!open) return null;

  return (
    <>
      <div
        className={styles.backdrop}
        onClick={() => {
          if (status !== 'verifying') close(status === 'success');
        }}
      />
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-verify-title"
        tabIndex={-1}
      >
        <div ref={handleRef} className={styles.handle} />
        <div className={styles.content}>

          {status === 'verifying' && (
            <>
              <div className={styles.spinner} />
              <h2 id="payment-verify-title" className={styles.title}>Verifying your payment…</h2>
              <p className={styles.subtitle}>Please wait while we confirm your transaction.</p>
            </>
          )}

          {status === 'success' && (
            <>
              {reducedMotion ? (
                <span className={`${styles.staticMark} ${styles.staticMarkSuccess}`} aria-hidden="true">
                  <Check size={40} strokeWidth={2.5} />
                </span>
              ) : !entranceDone ? (
                <LottiePlayer
                  key="entrance"
                  animationData={paymentSuccessData}
                  loop={false}
                  autoplay
                  style={{ width: 160, height: 160 }}
                  onComplete={() => requestAnimationFrame(() => setEntranceDone(true))}
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
              <h2 id="payment-verify-title" className={styles.title}>Payment Successful!</h2>
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
              {paymentDetails && paymentDetails.pointsAwarded > 0 && (
                <div className={styles.rewardChip} role="status">
                  <StarIcon ref={starRef} size={15} strokeWidth={1.8} className={styles.rewardChipIcon} />
                  <span>
                    <strong>+{paymentDetails.pointsAwarded} reward points</strong>
                    {paymentDetails.newBalance > 0 ? ` · balance ${paymentDetails.newBalance} pts` : null}
                  </span>
                </div>
              )}
              <Button size="lg" onClick={() => close(true)}>Done</Button>
            </>
          )}

          {status === 'failed' && (
            <>
              {reducedMotion ? (
                <span className={`${styles.staticMark} ${styles.staticMarkFailed}`} aria-hidden="true">
                  <X size={40} strokeWidth={2.5} />
                </span>
              ) : (
                <LottiePlayer
                  animationData={paymentFailedData}
                  loop={false}
                  autoplay
                  style={{ width: 160, height: 160 }}
                />
              )}
              <h2 id="payment-verify-title" className={styles.title}>Payment Not Confirmed</h2>
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
              {/* The retry loop must not be a dead end — after repeated
                  failures there has to be a person to reach. */}
              <a className={styles.supportLink} href="mailto:support@lawma.gov.ng?subject=Payment%20not%20confirmed">
                Still not confirmed? Contact LAWMA support
              </a>
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
