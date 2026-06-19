'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, MapPin, Home, ChevronLeft, Mail, Phone } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LAGOS_LGAS } from '@/constants';
import { completeOnboarding } from './actions';
import styles from './page.module.css';

function Slide1Svg() {
  return (
    <svg width="100" height="100" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="73" width="92" height="8" rx="4" fill="#e96419" fillOpacity="0.10"/>
      <rect x="6" y="40" width="54" height="30" rx="5" fill="#e96419"/>
      <rect x="56" y="48" width="30" height="22" rx="5" fill="#bf5214"/>
      <rect x="60" y="52" width="21" height="12" rx="3" fill="#fde8d5" fillOpacity="0.88"/>
      <circle cx="20" cy="72" r="9" fill="#5c2d0e"/>
      <circle cx="20" cy="72" r="4.5" fill="#f6c49a"/>
      <circle cx="68" cy="72" r="9" fill="#5c2d0e"/>
      <circle cx="68" cy="72" r="4.5" fill="#f6c49a"/>
      <rect x="14" y="46" width="24" height="18" rx="3" fill="white" fillOpacity="0.92"/>
      <rect x="14" y="46" width="24" height="6" rx="3" fill="#bf5214"/>
      <rect x="18" y="43" width="2.5" height="5" rx="1.25" fill="#8c3c0e"/>
      <rect x="31" y="43" width="2.5" height="5" rx="1.25" fill="#8c3c0e"/>
      <rect x="16" y="56" width="4" height="2" rx="1" fill="#e96419" fillOpacity="0.45"/>
      <rect x="22" y="56" width="4" height="2" rx="1" fill="#e96419" fillOpacity="0.45"/>
      <rect x="28" y="56" width="4" height="2" rx="1" fill="#e96419" fillOpacity="0.45"/>
      <rect x="16" y="60" width="4" height="2" rx="1" fill="#e96419" fillOpacity="0.45"/>
      <rect x="22" y="60" width="4" height="2" rx="1" fill="#e96419" fillOpacity="0.45"/>
      <circle cx="82" cy="36" r="3.5" fill="#e96419" fillOpacity="0.18"/>
      <circle cx="10" cy="32" r="2.5" fill="#e96419" fillOpacity="0.12"/>
      <circle cx="90" cy="58" r="2" fill="#e96419" fillOpacity="0.22"/>
    </svg>
  );
}

function Slide2Svg() {
  return (
    <svg width="100" height="100" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="8" width="46" height="78" rx="9" fill="#fde8d5" stroke="#e96419" strokeWidth="2"/>
      <rect x="25" y="17" width="36" height="58" rx="4" fill="white" fillOpacity="0.9"/>
      <rect x="29" y="22" width="28" height="5" rx="2.5" fill="#f6c49a" fillOpacity="0.8"/>
      <rect x="29" y="31" width="20" height="3" rx="1.5" fill="#e96419" fillOpacity="0.2"/>
      <rect x="29" y="37" width="24" height="3" rx="1.5" fill="#e96419" fillOpacity="0.2"/>
      <rect x="29" y="43" width="18" height="3" rx="1.5" fill="#e96419" fillOpacity="0.2"/>
      <rect x="29" y="50" width="28" height="1" rx="0.5" fill="#e96419" fillOpacity="0.15"/>
      <rect x="29" y="54" width="14" height="4" rx="2" fill="#e96419" fillOpacity="0.25"/>
      <rect x="47" y="54" width="10" height="4" rx="2" fill="#e96419" fillOpacity="0.5"/>
      <rect x="29" y="62" width="28" height="7" rx="3.5" fill="#e96419"/>
      <circle cx="68" cy="18" r="11" fill="#e96419"/>
      <path d="M63 18.5 L66.5 22 L73 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="22" cy="74" r="9" fill="#fde8d5" stroke="#e96419" strokeWidth="1.5"/>
      <text x="22" y="78" textAnchor="middle" fontSize="10" fontWeight="700" fill="#e96419" fontFamily="Arial,sans-serif">\u20a6</text>
    </svg>
  );
}

function Slide3Svg() {
  return (
    <svg width="100" height="100" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="46" cy="72" rx="22" ry="5" fill="#e96419" fillOpacity="0.10"/>
      <ellipse cx="34" cy="68" rx="16" ry="7" fill="#d9ccbf" fillOpacity="0.55"/>
      <ellipse cx="50" cy="66" rx="12" ry="6" fill="#c9bdb1" fillOpacity="0.5"/>
      <ellipse cx="42" cy="63" rx="9" ry="4.5" fill="#d4c8bb" fillOpacity="0.5"/>
      <path d="M46 10 C34 10 26 18.5 26 28.5 C26 43 46 64 46 64 C46 64 66 43 66 28.5 C66 18.5 58 10 46 10 Z" fill="#e96419"/>
      <circle cx="46" cy="29" r="10" fill="white" fillOpacity="0.9"/>
      <rect x="44.5" y="23" width="3" height="7.5" rx="1.5" fill="#e96419"/>
      <circle cx="46" cy="34" r="1.75" fill="#e96419"/>
      <rect x="60" y="54" width="22" height="26" rx="3" fill="#fde8d5" stroke="#e96419" strokeWidth="1.5"/>
      <rect x="66" y="51" width="10" height="6" rx="2.5" fill="#e96419"/>
      <rect x="64" y="65" width="14" height="2" rx="1" fill="#e96419" fillOpacity="0.4"/>
      <rect x="64" y="70" width="10" height="2" rx="1" fill="#e96419" fillOpacity="0.4"/>
      <rect x="64" y="75" width="12" height="2" rx="1" fill="#e96419" fillOpacity="0.4"/>
    </svg>
  );
}

const SLIDES = [
  { title: 'Know your pickup day', subText: "See your LGA's exact collection schedule before you miss it.", illustration: <Slide1Svg /> },
  { title: 'Pay bills in seconds', subText: 'No queues, no stress. Settle your waste management bills right here.', illustration: <Slide2Svg /> },
  { title: 'Report, track, resolve', subText: 'Spotted illegal dumping? File a complaint and watch it get handled.', illustration: <Slide3Svg /> },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const method = searchParams.get('method') as 'phone' | 'email' | null;

  // method=phone → signed up with phone, now needs email + address
  // method=email → signed up with email, now needs phone + address
  // null / 'otp'  → OTP flow, needs name + lga + address
  const isPasswordFlow = method === 'phone' || method === 'email';

  const [step, setStep] = useState(1);
  const [animKey, setAnimKey] = useState(0);

  const [name, setName] = useState('');
  const [lga, setLga] = useState('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const lgaOptions = LAGOS_LGAS.map((l) => ({ value: l, label: l }));

  function goTo(nextStep: number) {
    setAnimKey((k) => k + 1);
    setStep(nextStep);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (isPasswordFlow) {
      if (method === 'phone' && !contactEmail.trim().includes('@')) {
        next.email = 'Enter a valid email address';
      }
      if (method === 'email') {
        const digits = contactPhone.replace(/\D/g, '');
        if (!digits || digits.length < 10) next.phone = 'Enter a valid phone number';
      }
    } else {
      if (!name.trim() || name.trim().length < 2) next.name = 'Please enter your full name';
      if (!lga) next.lga = 'Please select your LGA';
    }

    if (!address.trim() || address.trim().length < 5) next.address = 'Please enter your street address';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    const formData = new FormData();
    formData.set('address', address.trim());

    if (isPasswordFlow) {
      if (method === 'phone' && contactEmail.trim()) {
        formData.set('email', contactEmail.trim().toLowerCase());
      }
      if (method === 'email' && contactPhone.trim()) {
        const digits = contactPhone.replace(/\D/g, '');
        const normalized = '+234' + (digits.startsWith('0') ? digits.slice(1) : digits);
        formData.set('phoneNumber', normalized);
      }
    } else {
      formData.set('name', name.trim());
      formData.set('lga', lga);
    }

    setLoading(true);
    try {
      const result = await completeOnboarding(formData);
      if (!result.ok) {
        if (result.error.fieldErrors) {
          setErrors(result.error.fieldErrors);
        } else {
          setServerError(result.error.message);
        }
        return;
      }
      router.push('/dashboard');
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <div className={styles.logoCircle}>
            <img src="/favicon.png" alt="" className={styles.logoFavicon} />
          </div>
          <ThemeToggle className={styles.toggleInCard} />
        </div>

        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            {[1, 2].map((s) => (
              <div key={s} className={`${styles.segment} ${s <= step ? styles.segmentActive : ''}`} />
            ))}
          </div>
          <span className={styles.stepLabel}>Step {step} of 2</span>
        </div>

        {step === 1 && (
          <button className={styles.backBtn} onClick={() => router.push('/login')} type="button">
            <ChevronLeft size={18} strokeWidth={1.5} />
            Back
          </button>
        )}
        {step === 2 && (
          <button className={styles.backBtn} onClick={() => goTo(1)} type="button">
            <ChevronLeft size={18} strokeWidth={1.5} />
            Back
          </button>
        )}

        <div key={animKey} className={styles.stepContent}>
          {step === 1 && (
            <>
              <div className={styles.stepHeader}>
                <h1 className={styles.title}>Lagos, meet your waste companion</h1>
                <p className={styles.subtitle}>
                  LAWMA makes managing your household waste simple, transparent, and stress-free.
                </p>
              </div>
              <div className={styles.tiles}>
                {SLIDES.map((slide) => (
                  <div key={slide.title} className={styles.tile}>
                    <div className={styles.tileIconIllustration}>
                      {slide.illustration}
                    </div>
                    <div className={styles.tileText}>
                      <span className={styles.tileLabel}>{slide.title}</span>
                      <span className={styles.tileDesc}>{slide.subText}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button size="lg" onClick={() => goTo(2)} type="button">
                Continue
              </Button>
              <button className={styles.skipLink} onClick={() => router.push('/dashboard')} type="button">
                Skip for now
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className={styles.stepHeader}>
                <h1 className={styles.title}>One last thing</h1>
                <p className={styles.subtitle}>
                  {isPasswordFlow
                    ? 'Add your street address and one more contact so we can reach you.'
                    : 'We need a few details to personalise your experience and connect you to the right services in your area.'}
                </p>
              </div>
              <form onSubmit={handleSubmit} className={styles.form}>
                {!isPasswordFlow && (
                  <>
                    <Input
                      label="Full Name"
                      placeholder="e.g. Amaka Osei"
                      value={name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setName(val);
                        if (/\d/.test(val)) {
                          setErrors((prev) => ({ ...prev, name: 'Name cannot contain numbers' }));
                        } else {
                          setErrors((prev) => ({ ...prev, name: undefined }));
                        }
                      }}
                      error={errors.name}
                      icon={<User size={16} strokeWidth={1.5} />}
                      autoFocus
                      autoComplete="name"
                    />
                    <Select
                      label="Local Government Area"
                      options={lgaOptions}
                      placeholder="Select your LGA"
                      value={lga}
                      onChange={(e) => {
                        setLga(e.target.value);
                        if (errors.lga) setErrors((prev) => ({ ...prev, lga: undefined }));
                      }}
                      error={errors.lga}
                      icon={<MapPin size={16} strokeWidth={1.5} />}
                    />
                  </>
                )}
                {method === 'phone' && (
                  <Input
                    label="Email Address"
                    type="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    error={errors.email}
                    icon={<Mail size={16} strokeWidth={1.5} />}
                    autoFocus
                    autoComplete="email"
                  />
                )}
                {method === 'email' && (
                  <Input
                    label="Phone Number"
                    type="tel"
                    inputMode="tel"
                    placeholder="080 1234 5678"
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value.replace(/[^\d]/g, ''));
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    error={errors.phone}
                    prefix="+234"
                    autoFocus
                    autoComplete="tel"
                  />
                )}
                <Input
                  label="Street Address"
                  placeholder="e.g. 14 Bode Thomas Street, Surulere"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
                  }}
                  error={errors.address}
                  icon={<Home size={16} strokeWidth={1.5} />}
                  autoComplete="street-address"
                />
                {serverError && <p className={styles.serverError}>{serverError}</p>}
                <Button type="submit" size="lg" isLoading={loading}>Finish Setup</Button>
                <button className={styles.skipLink} onClick={() => router.push('/dashboard')} type="button">
                  Skip for now
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <OnboardingContent />
    </Suspense>
  );
}
