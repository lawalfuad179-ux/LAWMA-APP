'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { OnboardingOverlay } from '@/components/ui/OnboardingOverlay';
import styles from './page.module.css';

const ONBOARDING_KEY = 'lawma-onboarding-seen';

function HomeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    requestAnimationFrame(() => setAnimIn(true));
  }, []);

  function handleGetStarted() {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (seen) {
      router.push('/login');
    } else {
      setShowOnboarding(true);
    }
  }

  function handleOnboardingComplete() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
    router.push('/login');
  }

  function handleOnboardingSkip() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
    router.push('/login');
  }

  if (!mounted) return null;

  return (
    <>
      <ThemeToggle />

      {showOnboarding ? (
        <OnboardingOverlay
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      ) : (
        <div className={styles.page}>
          <div className={styles.bgPattern} />
          <div className={`${styles.container} ${animIn ? styles.visible : ''}`}>
            <div className={styles.hero}>
              <div className={styles.insignia}>
                <img src="/favicon.png" alt="" className={styles.faviconBadge} />
              </div>
              <span className={styles.badge}>Lagos State Government</span>
              <img src="/logo-light.png" alt="LAWMA" className={`${styles.logo} ${styles.logoLight}`} />
              <img src="/logo-dark.png" alt="LAWMA" className={`${styles.logo} ${styles.logoDark}`} />
              <p className={styles.subtitle}>
                Waste collection, reporting, and payments for Lagos residents.
              </p>
            </div>

            <div className={styles.features}>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>
                  <HomeIcon />
                </div>
                <div className={styles.featureText}>
                  <span className={styles.featureLabel}>Collection Schedule</span>
                  <span className={styles.featureDesc}>View pickup days</span>
                </div>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>
                  <CameraIcon />
                </div>
                <div className={styles.featureText}>
                  <span className={styles.featureLabel}>Report Issues</span>
                  <span className={styles.featureDesc}>Photo and location</span>
                </div>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>
                  <CreditCardIcon />
                </div>
                <div className={styles.featureText}>
                  <span className={styles.featureLabel}>Pay Bills</span>
                  <span className={styles.featureDesc}>Digital payments</span>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.ctaButton} onClick={handleGetStarted} type="button">
                Get Started
              </button>
              <button className={styles.loginButton} onClick={() => router.push('/login')} type="button">
                I already have an account
              </button>
            </div>

            <p className={styles.disclaimer}>
              By continuing, you agree to receive SMS notifications from LAWMA.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
