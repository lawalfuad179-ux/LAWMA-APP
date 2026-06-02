'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LAGOS_LGAS } from '@/constants';

import { completeOnboarding } from '../onboarding/actions';
import styles from './page.module.css';

type Step = 'phone' | 'otp' | 'profile';
type Mode = 'signin' | 'signup';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');

  const [mode, setMode] = useState<Mode>(modeParam === 'signup' ? 'signup' : 'signin');
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [transition, setTransition] = useState<'enter' | 'leave'>('enter');

  // Profile fields (signup)
  const [name, setName] = useState('');
  const [lga, setLga] = useState('');
  const [address, setAddress] = useState('');
  const [residentId, setResidentId] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTransition('enter');
  }, []);

  useEffect(() => {
    setMode(modeParam === 'signup' ? 'signup' : 'signin');
  }, [modeParam]);

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

  function toggleMode() {
    const next: Mode = mode === 'signin' ? 'signup' : 'signin';
    setMode(next);
    router.replace(`/login?mode=${next}`, { scroll: false });
    setError('');
    setCode('');
  }

  async function sendOtp() {
    setError('');

    const cleanedPhone = phone.trim();
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedPhone && !cleanedEmail) {
      setError('Enter your phone number or email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(cleanedPhone ? { phoneNumber: cleanedPhone } : {}),
          ...(cleanedEmail ? { email: cleanedEmail } : {}),
        }),
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
      setError('Enter the 6-digit code.');
      return;
    }

    const cleanedPhone = phone.trim();
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedPhone && !cleanedEmail) {
      setError('Phone number or email required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(cleanedPhone ? { phoneNumber: cleanedPhone } : {}),
          ...(cleanedEmail ? { email: cleanedEmail } : {}),
          code,
        }),
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

      if (data.data.isNewResident && mode === 'signup') {
        setResidentId(data.data.residentId);
        switchStep('profile');
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

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !name || !lga || !address) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.set('email', email);
    formData.set('name', name);
    formData.set('lga', lga);
    formData.set('address', address);

    try {
      const result = await completeOnboarding(formData);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const lgaOptions = LAGOS_LGAS.map((l) => ({ value: l, label: l }));

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => router.push('/')} type="button" aria-label="Back to home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 5 5 12 12 19" />
          </svg>
          <span className={styles.backText}>Back</span>
        </button>
        <ThemeToggle className={styles.toggleOverride} />

        <div className={styles.logoWrap}>
          <img src="/logo-light.png" alt="LAWMA" className={styles.logoLight} />
          <img src="/logo-dark.png" alt="LAWMA" className={styles.logoDark} />
        </div>

        <div className={`${styles.stage} ${transition === 'enter' ? styles.enter : styles.leave}`}>
          {step === 'phone' && (
            <div className={styles.header}>
              <h1 className={styles.title}>{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>
              <p className={styles.subtitle}>
                {mode === 'signin'
                  ? 'Enter your phone number to sign in.'
                  : 'Enter your phone number to get started.'}
              </p>
              <button className={styles.modeToggle} onClick={toggleMode} type="button">
                {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className={styles.header}>
              <button
                type="button"
                className={styles.backStepBtn}
                onClick={() => switchStep('phone')}
                aria-label="Change phone number"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 5 5 12 12 19" />
                </svg>
              </button>
              <h1 className={styles.title}>Verify code</h1>
              <p className={styles.subtitle}>
                Enter the code sent to <span className={styles.phoneDisplay}>{phone}</span>
              </p>
            </div>
          )}

          {step === 'profile' && (
            <div className={styles.header}>
              <h1 className={styles.title}>Complete your profile</h1>
              <p className={styles.subtitle}>Set up your account for waste collection services.</p>
            </div>
          )}
        </div>

        {step === 'phone' && (
          <form
            onSubmit={(e) => { e.preventDefault(); sendOtp(); }}
            className={styles.form}
          >
            <Input
              label="Email Address"
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              autoComplete="email"
            />
            <Input
              label="Phone Number"
              type="tel"
              inputMode="numeric"
              placeholder="080 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={error}
              maxLength={15}
              autoFocus={!email}
              autoComplete="tel"
            />
            <Button type="submit" size="lg" isLoading={loading}>
              Send Code
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form
            onSubmit={(e) => { e.preventDefault(); verifyOtp(); }}
            className={styles.form}
          >
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
            <Button type="submit" size="lg" isLoading={loading}>
              Verify
            </Button>
          </form>
        )}

        {step === 'profile' && (
          <form onSubmit={submitProfile} className={styles.form}>
            <Input
              label="Email Address"
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              autoComplete="email"
            />
            <Input
              label="Full Name"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={error}
              autoFocus
              autoComplete="name"
            />
            <Select
              label="Local Government Area"
              options={lgaOptions}
              placeholder="Select your LGA"
              value={lga}
              onChange={(e) => setLga(e.target.value)}
            />
            <Input
              label="Street Address"
              placeholder="Your home or estate address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={error}
              autoComplete="street-address"
            />
            <Button type="submit" size="lg" isLoading={loading}>
              Complete Setup
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <AuthContent />
    </Suspense>
  );
}
