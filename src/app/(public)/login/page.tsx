'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Lock, Hash, User, MapPin, Check } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LAGOS_LGAS } from '@/constants';
import { validateEmailOrPhone, passwordRules, getPasswordErrors, type FieldErrors } from '@/lib/validators/validation';
import { OtpInput } from '@/components/ui/OtpInput';

import { completeOnboarding } from '../onboarding/actions';
import styles from './page.module.css';

type Step = 'phone' | 'otp' | 'profile' | 'reset';
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
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [passwordChecks, setPasswordChecks] = useState<Record<string, boolean>>({});

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verifyInFlight = useRef(false);
  const verifyOtpRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    setTransition('enter');
  }, []);

  useEffect(() => {
    verifyOtpRef.current = verifyOtp;
  });

  useEffect(() => {
    if (code.length === 6 && step === 'otp' && !verifyInFlight.current) {
      verifyOtpRef.current?.();
    }
  }, [code]);

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
    verifyInFlight.current = false;
    setTimeout(() => {
      if (to === 'phone') { setCode(''); setIdentifierTouched(false); }
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

  function normalizePhone(raw: string): string {
    const trimmed = raw.trim();
    return trimmed.startsWith('+')
      ? '+' + trimmed.slice(1).replace(/\D/g, '')
      : trimmed.replace(/\D/g, '');
  }

  async function sendOtp() {
    setError('');

    const cleanedPhone = normalizePhone(phone);
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedPhone && !cleanedEmail) {
      setError('Enter your phone number or email.');
      return;
    }

    // Check for existing account during signup
    if (mode === 'signup') {
      const isEmailField = cleanedEmail && !cleanedPhone;
      const checkRes = await fetch('/api/auth/check-resident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEmailField ? { email: cleanedEmail } : { phoneNumber: cleanedPhone }),
      });
      const checkData = await checkRes.json();
      if (checkData.exists) {
        setError('An account with this email/phone number already exists. Sign in instead.');
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const isEmailField = cleanedEmail && !cleanedPhone;
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEmailField ? { email: cleanedEmail } : { phoneNumber: cleanedPhone }),
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

  async function verifyOtp(overrideCode?: string) {
    if (verifyInFlight.current) return;
    setError('');
    const otpCode = overrideCode || code;
    if (otpCode.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }

    const cleanedPhone = normalizePhone(phone);
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedPhone && !cleanedEmail) {
      setError('Phone number or email required.');
      return;
    }

    verifyInFlight.current = true;
    setLoading(true);
    try {
      const isEmailField = cleanedEmail && !cleanedPhone;
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEmailField ? { email: cleanedEmail } : { phoneNumber: cleanedPhone }),
          code: otpCode,
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
        const method = email ? 'email' : 'phone';
        router.push(`/onboarding?method=${method}`);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
      verifyInFlight.current = false;
    }
  }

  async function resendOtp() {
    if (cooldown > 0) return;
    setError('');
    setLoading(true);
    const cleanedPhone = normalizePhone(phone);
    const cleanedEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedEmail && !cleanedPhone ? { email: cleanedEmail } : { phoneNumber: cleanedPhone }),
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

  function validateField(field: string, value: string) {
    let msg: string | null = null;
    if (field === 'emailOrPhone') msg = validateEmailOrPhone(value);
    if (field === 'email') msg = value && !value.includes('@') ? 'Enter a valid email address.' : null;
    if (field === 'phone') msg = value && !value.replace(/\D/g, '').startsWith('0') && value.length > 3 ? 'Enter a valid phone number.' : null;
    if (field === 'newPassword') {
      const errors = getPasswordErrors(value);
      setPasswordChecks(Object.fromEntries(passwordRules.map((r) => [r.key, r.test(value)])));
      msg = value && errors.length > 0 ? errors.join('. ') + '.' : null;
    }
    if (field === 'confirmPassword') msg = value && value !== newPassword ? 'Passwords do not match.' : null;
    setFieldErrors((prev) => ({ ...prev, [field]: msg || '' }));
    return !msg;
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardNav}>
          <button className={styles.backBtn} onClick={() => router.push('/')} type="button" aria-label="Back to home">
            <ArrowLeft size={18} strokeWidth={1.5} />
            <span className={styles.backText}>Back</span>
          </button>
          <ThemeToggle className={styles.toggleInCard} />
        </div>

        <div className={styles.logoCircle}>
          <img src="/favicon.png" alt="" className={styles.logoFavicon} />
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
            </div>
          )}

          {step === 'otp' && (
            <div className={styles.header}>
              <h1 className={styles.title}>Verify code</h1>
              <p className={styles.subtitle}>
                We sent a 6-digit code to your {email && !phone ? 'email address' : 'phone number'}.
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
            {mode === 'signin' ? (
              <>
                <Input
                  label="Email or Phone"
                  type="text"
                  inputMode={(phone || email).includes('@') ? 'email' : 'text'}
                  placeholder="you@example.com or 080 1234 5678"
                  value={phone || email}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.includes('@')) { setEmail(val); setPhone(''); }
                    else { setPhone(val); setEmail(''); }
                    if (identifierTouched) validateField('emailOrPhone', val);
                  }}
                  onBlur={(e) => {
                    setIdentifierTouched(true);
                    validateField('emailOrPhone', e.target.value);
                  }}
                  error={fieldErrors.emailOrPhone || error}
                  icon={<Mail size={16} strokeWidth={1.5} />}
                  autoFocus
                  autoComplete="username"
                />
                <button className={styles.forgotLink} onClick={() => { setStep('reset'); setError(''); setFieldErrors({}); setCode(''); }} type="button">
                  Forgot password?
                </button>
              </>
            ) : (
              <Input
                label="Phone or Email"
                type="text"
                inputMode={(phone || email).includes('@') ? 'email' : 'text'}
                placeholder="Phone number or email address"
                value={phone || email}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.includes('@')) { setEmail(val); setPhone(''); }
                  else { setPhone(val); setEmail(''); }
                  if (identifierTouched) validateField('emailOrPhone', val);
                }}
                onBlur={(e) => {
                  setIdentifierTouched(true);
                  validateField('emailOrPhone', e.target.value);
                }}
                error={fieldErrors.emailOrPhone || error}
                icon={(phone || email).includes('@') ? <Mail size={16} strokeWidth={1.5} /> : <Phone size={16} strokeWidth={1.5} />}
                autoFocus
                autoComplete="username"
              />
            )}
            <Button type="submit" size="lg" isLoading={loading}>
              {mode === 'signin' ? 'Continue' : 'Create Account'}
            </Button>
            <button className={styles.modeToggle} onClick={toggleMode} type="button">
              {mode === 'signin'
                ? <span>Don&apos;t have an account? <span className={styles.modeToggleBold}>Sign up</span></span>
                : <span>Already have an account? <span className={styles.modeToggleBold}>Sign in</span></span>}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form
            onSubmit={(e) => { e.preventDefault(); verifyOtp(); }}
            className={styles.form}
          >
            <OtpInput
              value={code}
              onChange={(val) => {
                setCode(val);
                setFieldErrors((prev) => ({ ...prev, code: '' }));
                if (val.length === 6 && step === 'otp') {
                  verifyOtp(val);
                }
              }}
              error={fieldErrors.code || error}
              autoFocus
            />
            <button
              type="button"
              className={styles.resendText}
              onClick={resendOtp}
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
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
              icon={<Mail size={16} strokeWidth={1.5} />}
              autoComplete="email"
            />
            <Input
              label="Full Name"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={error}
              icon={<User size={16} strokeWidth={1.5} />}
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
              icon={<MapPin size={16} strokeWidth={1.5} />}
              autoComplete="street-address"
            />
            <Button type="submit" size="lg" isLoading={loading}>
              Complete Setup
            </Button>
          </form>
        )}

        {step === 'reset' && !resetSent && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              const cleaned = (phone || email).trim();
              if (!cleaned || !validateField('emailOrPhone', cleaned)) { setError('Enter a valid email or phone number.'); return; }
              
              const isEmail = cleaned.includes('@');
              const check = await fetch('/api/auth/check-resident', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isEmail ? { email: cleaned } : { phoneNumber: cleaned }),
              });
              const checkData = await check.json();
              if (!checkData.exists) {
                setError('No account found with this email or phone number.');
                return;
              }

              setLoading(true);
              try {
                const res = await fetch('/api/auth/forgot-password', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(isEmail ? { email: cleaned } : { phoneNumber: cleaned }),
                });
                const data = await res.json();
                if (!data.ok) { setError(data.error?.message || 'Something went wrong.'); return; }
                setResetSent(true);
                setCode('');
              } catch { setError('Network error.'); }
              finally { setLoading(false); }
            }}
            className={styles.form}
          >
            <Input
              label="Email or Phone"
              type="text"
              inputMode={(phone || email).includes('@') ? 'email' : 'text'}
              placeholder="you@example.com or 080 1234 5678"
              value={phone || email}
              onChange={(e) => {
                const val = e.target.value;
                if (val.includes('@')) { setEmail(val); setPhone(''); }
                else { setPhone(val); setEmail(''); }
                if (identifierTouched) validateField('emailOrPhone', val);
              }}
              onBlur={(e) => {
                setIdentifierTouched(true);
                validateField('emailOrPhone', e.target.value);
              }}
              error={fieldErrors.emailOrPhone || error}
              icon={<Mail size={16} strokeWidth={1.5} />}
              autoFocus
              autoComplete="username"
            />
            <Button type="submit" size="lg" isLoading={loading}>
              Send Reset Code
            </Button>
            <button className={styles.modeToggle} onClick={() => { setStep('phone'); setResetSent(false); setError(''); }} type="button">
              <span className={styles.modeToggleBold}>← Back to sign in</span>
            </button>
          </form>
        )}

        {step === 'reset' && resetSent && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              if (code.length !== 6) { setError('Enter the 6-digit code.'); return; }
              if (newPassword.length < 8) { setError('Use at least 8 characters with a letter and a number.'); return; }
              if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
              setLoading(true);
              try {
                const identifier = (phone || email).trim();
                const isEmail = identifier.includes('@');
                const res = await fetch('/api/auth/reset-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...(isEmail ? { email: identifier } : { phoneNumber: identifier }),
                    code,
                    password: newPassword,
                  }),
                });
                const data = await res.json();
                if (!data.ok) { setError(data.error?.message || 'Reset failed.'); return; }
                setStep('phone'); setResetSent(false); setCode(''); setNewPassword(''); setConfirmPassword('');
                setError('');
              } catch { setError('Network error.'); }
              finally { setLoading(false); }
            }}
            className={styles.form}
          >
            <Input
              label="Verification Code"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setFieldErrors({}); }}
              error={fieldErrors.code || error}
              icon={<Hash size={16} strokeWidth={1.5} />}
              maxLength={6}
              autoFocus
            />
            <Input
              label="New Password"
              type="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); validateField('newPassword', e.target.value); }}
              error={fieldErrors.newPassword}
              icon={<Lock size={16} strokeWidth={1.5} />}
              autoComplete="new-password"
            />
            {newPassword && (
              <div className={styles.passwordRules}>
                {passwordRules.map((rule) => (
                  <span key={rule.key} className={`${styles.ruleItem} ${passwordChecks[rule.key] ? styles.ruleMet : ''}`}>
                    <Check size={12} strokeWidth={2} className={passwordChecks[rule.key] ? styles.checkIconMet : styles.checkIcon} />
                    {rule.label}
                  </span>
                ))}
              </div>
            )}
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); validateField('confirmPassword', e.target.value); }}
              error={fieldErrors.confirmPassword}
              icon={<Lock size={16} strokeWidth={1.5} />}
              autoComplete="new-password"
            />
            <Button type="submit" size="lg" isLoading={loading}>
              Reset Password
            </Button>
            <button className={styles.modeToggle} onClick={() => { setStep('phone'); setResetSent(false); setError(''); }} type="button">
              <span className={styles.modeToggleBold}>← Back to sign in</span>
            </button>
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
