'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [transition, setTransition] = useState<'enter' | 'leave'>('enter');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTransition('enter');
  }, []);

  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds);
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  function switchStep(to: Step) {
    setTransition('leave');
    setTimeout(() => {
      if (to === 'phone') setCode('');
      setStep(to);
      setError('');
      setTransition('enter');
    }, 200);
  }

  async function sendOtp() {
    setError('');
    const cleaned = phone.trim();
    if (!cleaned) {
      setError('Enter your phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: cleaned }),
      });
      const data = await res.json();

      if (!data.ok) {
        if (data.error?.code === 'cooldown_active') {
          const seconds = parseInt(data.error.message.match(/\d+/)?.[0] || '60');
          startCooldown(seconds);
        }
        setError(data.error?.message || 'Something went wrong.');
        return;
      }

      switchStep('otp');
      startCooldown(60);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError('');
    if (code.length !== 6) {
      setError('Enter the 6-digit code sent to your phone.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone.trim(), code }),
      });
      const data = await res.json();

      if (!data.ok) {
        if (data.error?.code === 'code_expired') {
          setError('Code expired. Request a new one.');
          return;
        }
        setError(data.error?.message || 'Verification failed.');
        return;
      }

      if (data.data.isNewResident) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (cooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error?.message || 'Could not resend code.');
        return;
      }
      startCooldown(60);
      setCode('');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.steps}>
          <span className={`${styles.stepDot} ${step === 'phone' || step === 'otp' ? styles.stepDone : ''}`} />
          <span className={`${styles.stepLine} ${step === 'otp' ? styles.stepLineActive : ''}`} />
          <span className={`${styles.stepDot} ${step === 'otp' ? styles.stepActive : ''}`} />
        </div>

        <div className={`${styles.stage} ${transition === 'enter' ? styles.enter : styles.leave}`}>
          {step === 'phone' ? (
            <div className={styles.header}>
              <h1 className={styles.title}>Sign in</h1>
              <p className={styles.subtitle}>Enter your phone number to get started.</p>
            </div>
          ) : (
            <div className={styles.header}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => switchStep('phone')}
                aria-label="Back"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <h1 className={styles.title}>Verify code</h1>
              <p className={styles.subtitle}>
                Enter the code sent to <span className={styles.phoneDisplay}>{phone}</span>
              </p>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); step === 'phone' ? sendOtp() : verifyOtp(); }}
          className={styles.form}
        >
          {step === 'phone' ? (
            <Input
              label="Phone Number"
              type="tel"
              inputMode="numeric"
              placeholder="080 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={error}
              maxLength={15}
              autoFocus
            />
          ) : (
            <>
              <Input
                label="Verification Code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                error={error}
                maxLength={6}
                autoFocus
                autoComplete="one-time-code"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resendOtp}
                disabled={cooldown > 0}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </Button>
            </>
          )}

          <Button type="submit" size="lg" isLoading={loading}>
            {step === 'phone' ? 'Send Code' : 'Verify'}
          </Button>
        </form>
      </div>
    </div>
  );
}
