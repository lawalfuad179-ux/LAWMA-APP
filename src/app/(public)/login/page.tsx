'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, Lock, User, MapPin, Check } from 'lucide-react';

import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AddressInput } from '@/components/ui/AddressInput';
import { Select } from '@/components/ui/Select';
import { LAGOS_LGAS } from '@/constants';
import { validateEmailOrPhone, validateEmail, passwordRules, getPasswordErrors, type FieldErrors } from '@/lib/validators/validation';
import { OtpInput } from '@/components/ui/OtpInput';
import { PasswordRulesChecklist } from '@/components/ui/PasswordRulesChecklist';
import { useToast } from '@/context/ToastContext';

import { completeOnboarding } from '../onboarding/actions';
import styles from './page.module.css';

type Step = 'phone' | 'otp' | 'profile' | 'reset' | 'password-signin' | 'password-signup' | 'create-password';
type Mode = 'signin' | 'signup';

function AuthContent() {
  const router = useRouter();
  const toast = useToast();
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
  const reducedMotion = useReducedMotion();

  // Profile fields (signup)
  const [name, setName] = useState('');
  const [lga, setLga] = useState('');
  const [address, setAddress] = useState('');
  const [addressCoords, setAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);
  // Password signup state
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupLga, setSignupLga] = useState('');
  // null = unknown (OTP not yet sent), true/false = from OTP send response
  const [residentHasPassword, setResidentHasPassword] = useState<boolean | null>(null);
  // true = arrived at create-password after OTP was verified (session exists)
  // false = arrived via button click (no session — must submit OTP code in form)
  const [createPasswordHasSession, setCreatePasswordHasSession] = useState(false);
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [passwordChecks, setPasswordChecks] = useState<Record<string, boolean>>({});

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verifyInFlight = useRef(false);
  const verifyOtpRef = useRef<() => Promise<void>>(async () => {});

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
    // AnimatePresence (keyed on `step`) owns the exit/enter animation now;
    // state resets run immediately while the outgoing step animates out.
    verifyInFlight.current = false;
    if (to === 'phone') { setCode(''); setIdentifierTouched(false); }
    if (to === 'password-signup') {
      // Preserve phone/email from step 1 for submission — no re-entry needed
      const rawDigits = normalizePhone(phone).replace(/\D/g, '');
      const localPhone = rawDigits.startsWith('234') ? '0' + rawDigits.slice(3) : rawDigits.startsWith('0') ? rawDigits : rawDigits ? '0' + rawDigits : '';
      setSignupPhone(localPhone);
      setSignupEmail(email.trim().toLowerCase() || '');
      setSignupLga('');
      setName('');
      setNewPassword('');
      setConfirmPassword('');
      setFieldErrors({});
    }
    if (to === 'password-signin') {
      setNewPassword('');
      setFieldErrors({});
    }
    if (to === 'create-password') {
      setNewPassword('');
      setConfirmPassword('');
      setPasswordChecks({});
      setFieldErrors({});
    }
    setStep(to);
    setError('');
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
    const isEmailField = !!(cleanedEmail && !cleanedPhone);

    if (!cleanedPhone && !cleanedEmail) {
      setError('Enter your phone number or email.');
      return;
    }

    setLoading(true);
    try {
      // Always check resident status first — determines routing for both modes
      const checkRes = await fetch('/api/auth/check-resident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEmailField ? { email: cleanedEmail } : { phoneNumber: cleanedPhone }),
      });
      const checkData = await checkRes.json();

      if (mode === 'signup') {
        if (checkData.exists) {
          setError('An account with this email/phone number already exists. Sign in instead.');
          return;
        }
      }

      if (mode === 'signin') {
        if (!checkData.exists) {
          setError('No account found. Create one instead.');
          return;
        }

        setResidentHasPassword(checkData.hasPassword);
        // OTP is the primary sign-in path — always send a code, regardless of
        // whether the resident has a password. Users who prefer password can
        // tap "Sign in with password instead" on the OTP screen.
      }

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
      } else if (mode === 'signin' && residentHasPassword === false) {
        // Existing user with no password — OTP verified, session exists
        setCreatePasswordHasSession(true);
        switchStep('create-password');
      } else {
        toast('Login successful', 'success');
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
    if (addressCoords) {
      formData.set('latitude', String(addressCoords.lat));
      formData.set('longitude', String(addressCoords.lng));
    }

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

  const identifier = (phone || email).trim();
  const identifierValid = identifier.length > 0 && !validateEmailOrPhone(identifier);
  const passwordAllChecksPass = Object.values(passwordChecks).length > 0 && Object.values(passwordChecks).every(Boolean);

  function validateField(field: string, value: string) {
    let msg: string | null = null;
    if (field === 'emailOrPhone') msg = validateEmailOrPhone(value);
    if (field === 'email' || field === 'signupEmail') msg = value ? (validateEmail(value)) : null;
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
      <AuroraBackground />
      <div className={styles.card}>
        <div className={styles.cardNav}>
          <button className={styles.backBtn} onClick={() => router.push('/')} type="button" aria-label="Back to home">
            <ArrowLeft size={18} strokeWidth={1.5} />
            <span className={styles.backText}>Back</span>
          </button>
        </div>

        <div className={styles.logoCircle}>
          <img src="/favicon.png" alt="" className={styles.logoFavicon} />
        </div>

        <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          className={styles.stepWrap}
          initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
        <div className={styles.stage}>
          {step === 'phone' && (
            <div className={styles.header}>
              <h1 className={styles.title}>{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>
              <p className={styles.subtitle}>
                {mode === 'signin'
                  ? 'Use your phone or email to sign in.'
                  : 'Use your phone or email to get started.'}
              </p>
            </div>
          )}

          {step === 'otp' && (
            <div className={styles.header}>
              <h1 className={styles.title}>{email && !phone ? 'Check your inbox' : 'Check your messages'}</h1>
              <p className={styles.subtitle}>
                We sent a 6-digit code to your {email && !phone ? 'email address' : 'phone number'}.
                {mode === 'signin' && residentHasPassword === false && " Verify it and you'll set your password next."}
              </p>
            </div>
          )}

          {step === 'profile' && (
            <div className={styles.header}>
              <h1 className={styles.title}>Complete your profile</h1>
              <p className={styles.subtitle}>Set up your account for waste collection services.</p>
            </div>
          )}

          {step === 'password-signin' && (
            <div className={styles.header}>
              <h1 className={styles.title}>Sign in with password</h1>
              <p className={styles.subtitle}>Enter your password to continue.</p>
            </div>
          )}

          {step === 'password-signup' && (
            <div className={styles.header}>
              <h1 className={styles.title}>Create account</h1>
              <p className={styles.subtitle}>Fill in your details and choose a password.</p>
            </div>
          )}

          {step === 'create-password' && (
            <div className={styles.header}>
              <h1 className={styles.title}>Create a password</h1>
              <p className={styles.subtitle}>Set a password for your account so you can sign in faster next time.</p>
            </div>
          )}

          {step === 'reset' && !resetSent && (
            <div className={styles.header}>
              <h1 className={styles.title}>Reset your password</h1>
              <p className={styles.subtitle}>Enter your email or phone number and we&apos;ll send you a reset code.</p>
            </div>
          )}

          {step === 'reset' && resetSent && (
            <div className={styles.header}>
              <h1 className={styles.title}>Enter verification code</h1>
              <p className={styles.subtitle}>
                We sent a 6-digit code to your {(phone || email).includes('@') ? 'email address' : 'phone number'}. Enter it below and choose a new password.
              </p>
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
            <Button type="submit" size="lg" isLoading={loading} disabled={!identifierValid}>
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
            <Button type="submit" size="lg" isLoading={loading} disabled={code.length < 6}>
              Verify
            </Button>
            {mode === 'signup' && (
              <button
                type="button"
                className={styles.modeToggle}
                onClick={() => switchStep('password-signup')}
              >
                <span className={styles.modeToggleBold}>Create account with password instead</span>
              </button>
            )}
            {mode === 'signin' && residentHasPassword === true && (
              <button
                type="button"
                className={styles.modeToggle}
                onClick={() => switchStep('password-signin')}
              >
                <span className={styles.modeToggleBold}>Sign in with password instead</span>
              </button>
            )}
            {mode === 'signin' && residentHasPassword === false && (
              <button
                type="button"
                className={styles.modeToggle}
                onClick={() => {
                  setCreatePasswordHasSession(false);
                  switchStep('create-password');
                }}
              >
                <span className={styles.modeToggleBold}>Set up a password instead</span>
              </button>
            )}
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
            <AddressInput
              label="Street Address"
              placeholder="Your home or estate address"
              value={address}
              onChange={setAddress}
              onLocationSelect={setAddressCoords}
              error={error}
              icon={<MapPin size={16} strokeWidth={1.5} />}
              autoComplete="street-address"
            />
            <Button type="submit" size="lg" isLoading={loading} disabled={!email || !name || !lga || !address}>
              Complete Setup
            </Button>
          </form>
        )}

        {step === 'password-signin' && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              const pwd = newPassword;
              if (!pwd) { setError('Enter your password.'); return; }
              const cleanedPhone = normalizePhone(phone);
              const cleanedEmail = email.trim().toLowerCase();
              setLoading(true);
              try {
                const res = await fetch('/api/auth/signin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(
                    cleanedEmail && !cleanedPhone
                      ? { email: cleanedEmail, password: pwd }
                      : { phoneNumber: cleanedPhone, password: pwd }
                  ),
                });
                const data = await res.json();
                if (!data.ok) {
                  if (data.error?.code === 'no_password') {
                    setError('No password set for this account.');
                  } else {
                    setError(data.error?.message || 'Sign in failed.');
                  }
                  return;
                }
                toast('Login successful', 'success');
                router.push('/dashboard');
              } catch {
                setError('Network error. Please check your connection.');
              } finally {
                setLoading(false);
              }
            }}
            className={styles.form}
          >
            <Input
              label="Password"
              type="password"
              placeholder="Your password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
              error={error}
              icon={<Lock size={16} strokeWidth={1.5} />}
              autoFocus
              autoComplete="current-password"
            />
            <button className={styles.forgotLink} onClick={() => { switchStep('reset'); }} type="button">
              Forgot password?
            </button>
            <Button type="submit" size="lg" isLoading={loading} disabled={!newPassword}>
              Sign In
            </Button>
            <button className={styles.modeToggle} onClick={() => switchStep('otp')} type="button">
              <span className={styles.modeToggleBold}>← Back to OTP verification</span>
            </button>
          </form>
        )}

        {step === 'password-signup' && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              const passwordErrors = getPasswordErrors(newPassword);
              if (passwordErrors.length > 0) { setError(passwordErrors[0]); return; }
              if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
              const cleanedPhone = normalizePhone(phone);
              const cleanedEmail = email.trim().toLowerCase();
              setLoading(true);
              try {
                const res = await fetch('/api/auth/signup', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    password: newPassword,
                    ...(cleanedPhone ? { phoneNumber: cleanedPhone } : {}),
                    ...(cleanedEmail && !cleanedPhone ? { email: cleanedEmail } : {}),
                  }),
                });
                const data = await res.json();
                if (!data.ok) {
                  setError(data.error?.message || 'Sign up failed.');
                  return;
                }
                const method = cleanedPhone ? 'phone' : 'email';
                router.push(`/onboarding?method=${method}`);
              } catch {
                setError('Network error. Please check your connection.');
              } finally {
                setLoading(false);
              }
            }}
            className={styles.form}
          >
            <div>
              <Input
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); validateField('newPassword', e.target.value); }}
                error={fieldErrors.newPassword}
                icon={<Lock size={16} strokeWidth={1.5} />}
                autoFocus
                autoComplete="new-password"
              />
              <PasswordRulesChecklist password={newPassword} />
            </div>
            {Object.values(passwordChecks).length > 0 && Object.values(passwordChecks).every(Boolean) && (
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); validateField('confirmPassword', e.target.value); }}
                error={fieldErrors.confirmPassword || (error && !fieldErrors.newPassword ? error : '')}
                icon={<Lock size={16} strokeWidth={1.5} />}
                autoComplete="new-password"
              />
            )}
            {error && !fieldErrors.confirmPassword && !fieldErrors.newPassword && (
              <p style={{ fontSize: 'var(--body-small-font-size)', color: 'var(--color-error)', margin: 0 }} role="alert">{error}</p>
            )}
            <Button
              type="submit"
              size="lg"
              isLoading={loading}
              disabled={!passwordAllChecksPass || !confirmPassword || confirmPassword !== newPassword}
            >
              Create Account
            </Button>
            <button className={styles.modeToggle} onClick={() => switchStep('otp')} type="button">
              <span className={styles.modeToggleBold}>← Back to OTP verification</span>
            </button>
          </form>
        )}

        {step === 'create-password' && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              const passwordErrors = getPasswordErrors(newPassword);
              if (passwordErrors.length > 0) { setError(passwordErrors[0]); return; }
              if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

              const cleanedPhone = normalizePhone(phone);
              const cleanedEmail = email.trim().toLowerCase();
              const isEmailField = !!(cleanedEmail && !cleanedPhone);

              setLoading(true);
              try {
                let res: Response;
                if (createPasswordHasSession) {
                  // Arrived via OTP verify — session already exists
                  res = await fetch('/api/auth/set-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: newPassword }),
                  });
                } else {
                  // Arrived via button — backend verifies valid OTP exists in DB
                  res = await fetch('/api/auth/create-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...(isEmailField ? { email: cleanedEmail } : { phoneNumber: cleanedPhone }),
                      password: newPassword,
                    }),
                  });
                }
                const data = await res.json();
                if (!data.ok) {
                  setError(data.error?.message || 'Failed to set password.');
                  return;
                }

                toast('Password created. Welcome back!', 'success');
                router.push('/dashboard');
              } catch {
                setError('Network error. Please try again.');
              } finally {
                setLoading(false);
              }
            }}
            className={styles.form}
          >
            <div>
              <Input
                label="New Password"
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); validateField('newPassword', e.target.value); }}
                error={fieldErrors.newPassword}
                icon={<Lock size={16} strokeWidth={1.5} />}
                autoFocus={createPasswordHasSession}
                autoComplete="new-password"
              />
              <PasswordRulesChecklist password={newPassword} />
            </div>
            {passwordAllChecksPass && (
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); validateField('confirmPassword', e.target.value); }}
                error={fieldErrors.confirmPassword || (error && !fieldErrors.newPassword ? error : '')}
                icon={<Lock size={16} strokeWidth={1.5} />}
                autoComplete="new-password"
              />
            )}
            {error && !fieldErrors.confirmPassword && !fieldErrors.newPassword && (
              <p style={{ fontSize: 'var(--body-small-font-size)', color: 'var(--color-error)', margin: 0 }} role="alert">{error}</p>
            )}
            <Button
              type="submit"
              size="lg"
              isLoading={loading}
              disabled={!passwordAllChecksPass || !confirmPassword || confirmPassword !== newPassword}
            >
              Create Password & Sign In
            </Button>
            <button className={styles.modeToggle} onClick={() => switchStep('otp')} type="button">
              <span className={styles.modeToggleBold}>← Back to OTP verification</span>
            </button>
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
            <Button type="submit" size="lg" isLoading={loading} disabled={!identifierValid}>
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
            <OtpInput
              label="Enter OTP"
              value={code}
              onChange={(val) => { setCode(val); setFieldErrors({}); }}
              error={fieldErrors.code || error}
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
            <Button
              type="submit"
              size="lg"
              isLoading={loading}
              disabled={code.length < 6 || !passwordAllChecksPass || !confirmPassword || confirmPassword !== newPassword}
            >
              Reset Password
            </Button>
            <button className={styles.modeToggle} onClick={() => { setStep('phone'); setResetSent(false); setError(''); }} type="button">
              <span className={styles.modeToggleBold}>← Back to sign in</span>
            </button>
          </form>
        )}
        </motion.div>
        </AnimatePresence>
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
