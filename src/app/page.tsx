'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { OnboardingOverlay } from '@/components/ui/OnboardingOverlay';
import styles from './page.module.css';

const ONBOARDING_KEY = 'lawma-onboarding-seen';

export default function LandingPage() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) {
    return null;
  }

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
          <div className={styles.container}>
            <div className={styles.hero}>
              <div className={styles.badge}>Lagos State Government</div>
              <h1 className={styles.title}>LAWMA</h1>
              <p className={styles.subtitle}>
                Waste Management and Environmental Services for Lagos Residents
              </p>
            </div>

            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>Schedule</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>Report Issues</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>Pay Bills</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>Recycling Guide</span>
              </div>
            </div>

            <button className={styles.ctaButton} onClick={handleGetStarted} type="button">
              Get Started
            </button>

            <button className={styles.loginButton} onClick={() => router.push('/login')} type="button">
              Already have an account? Sign in
            </button>

            <p className={styles.disclaimer}>
              By continuing, you agree to receive SMS notifications from LAWMA regarding your waste collection services.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
