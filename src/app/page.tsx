'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { OnboardingOverlay } from '@/components/ui/OnboardingOverlay';
import styles from './page.module.css';

const ONBOARDING_KEY = 'lawma-onboarding-seen';

function PhoneMockup() {
  return (
    <div className={styles.phoneFrame}>
      <div className={styles.phoneNotch} />
      <div className={styles.phoneScreen}>
        <div className={styles.mockupHeader}>
          <div className={styles.mockupAvatar} />
          <div className={styles.mockupLines}>
            <div className={styles.mockupLineShort} />
            <div className={styles.mockupLineLong} />
          </div>
        </div>
        <div className={styles.mockupCard}>
          <div className={styles.mockupCardTop}>
            <div className={styles.mockupTag} />
            <div className={styles.mockupDot} />
          </div>
          <div className={styles.mockupCardLine} />
          <div className={styles.mockupCardLineHalf} />
        </div>
        <div className={styles.mockupActions}>
          <div className={styles.mockupBtn} />
          <div className={styles.mockupBtnOutline} />
        </div>
      </div>
    </div>
  );
}

function PhotoPlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div className={`${styles.photoCard} ${className || ''}`}>
      <div className={styles.photoGradient} />
      <span className={styles.photoLabel}>{label}</span>
    </div>
  );
}

function FeatureMockup({ label }: { label: string }) {
  return (
    <div className={styles.featureMockup}>
      <div className={styles.featureMockGrad} />
      <div className={styles.featureMockContent}>
        <div className={styles.featureMockBar} />
        <div className={styles.featureMockBarShort} />
      </div>
    </div>
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
      {!showOnboarding && <ThemeToggle />}
      {showOnboarding ? (
        <OnboardingOverlay
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      ) : (
        <main className={styles.page}>
          {/* ─── 1. Hero ─── */}
          <section className={styles.heroSection}>
            <div className={styles.heroInner}>
              <div className={`${styles.heroText} ${animIn ? styles.heroTextVisible : ''}`}>
                <div className={styles.govBadge}>Lagos State Government</div>
                <h1 className={styles.heroHeadline}>
                  Cleaner streets start with easier reporting.
                </h1>
                <p className={styles.heroCopy}>
                  Track waste collection, report sanitation issues, pay bills, and receive
                  LAWMA updates from one simple mobile-first app.
                </p>
                <div className={styles.heroActions}>
                  <button className={styles.primaryCta} onClick={() => router.push('/login?mode=signup')} type="button">
                    Get Started
                  </button>
                  <button className={styles.secondaryCta} onClick={() => router.push('/login?mode=signin')} type="button">
                    I already have an account
                  </button>
                </div>
              </div>
              <div className={`${styles.heroVisual} ${animIn ? styles.heroVisualVisible : ''}`}>
                <PhoneMockup />
              </div>
            </div>
          </section>

          {/* ─── 2. Trust / Local Context ─── */}
          <section className={styles.trustSection}>
            <div className={styles.sectionInner}>
              <div className={styles.trustGrid}>
                <PhotoPlaceholder label="LAWMA waste collection truck on a Lagos street" className={styles.trustPhoto1} />
                <div className={styles.trustContent}>
                  <h2 className={styles.sectionHeading}>Built for Lagos residents.</h2>
                  <ul className={styles.trustList}>
                    <li className={styles.trustItem}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Track your assigned PSP operator
                    </li>
                    <li className={styles.trustItem}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Secure payments via Flutterwave
                    </li>
                    <li className={styles.trustItem}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Report missed pickup or illegal dumping
                    </li>
                    <li className={styles.trustItem}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Get real-time updates from LAWMA
                    </li>
                  </ul>
                </div>
                <PhotoPlaceholder label="A clean, well-maintained Lagos neighbourhood" className={styles.trustPhoto2} />
              </div>
            </div>
          </section>

          {/* ─── 3. Feature Showcase ─── */}
          <section className={styles.featuresSection}>
            <div className={styles.sectionInner}>
              <h2 className={styles.sectionHeading}>Everything you need in one place.</h2>
              <div className={styles.showcaseGrid}>
                <div className={styles.showcaseBlock}>
                  <div className={styles.showcaseText}>
                    <h3 className={styles.showcaseTitle}>Track Collection Schedule</h3>
                    <p className={styles.showcaseDesc}>
                      View your assigned pickup days and PSP operator. Get notified before each collection so you never miss a pickup.
                    </p>
                  </div>
                  <FeatureMockup label="Schedule" />
                </div>
                <div className={styles.showcaseBlock}>
                  <div className={styles.showcaseText}>
                    <h3 className={styles.showcaseTitle}>Report Waste Issues</h3>
                    <p className={styles.showcaseDesc}>
                      Report missed pickups or illegal dumping with photos and GPS location. Every report gets a trackable ticket number.
                    </p>
                  </div>
                  <FeatureMockup label="Report" />
                </div>
                <div className={styles.showcaseBlock}>
                  <div className={styles.showcaseText}>
                    <h3 className={styles.showcaseTitle}>Pay Waste Bills</h3>
                    <p className={styles.showcaseDesc}>
                      View outstanding bills and pay securely through Flutterwave. Download receipts and track payment history.
                    </p>
                  </div>
                  <FeatureMockup label="Payment" />
                </div>
                <div className={styles.showcaseBlock}>
                  <div className={styles.showcaseText}>
                    <h3 className={styles.showcaseTitle}>Receive LAWMA Updates</h3>
                    <p className={styles.showcaseDesc}>
                      Get notified about schedule changes, complaint status updates, and important announcements from LAWMA.
                    </p>
                  </div>
                  <PhotoPlaceholder label="Community engagement in Lagos" className={styles.showcasePhoto} />
                </div>
              </div>
            </div>
          </section>

          {/* ─── 4. How It Works ─── */}
          <section className={styles.howSection}>
            <div className={styles.sectionInner}>
              <h2 className={styles.sectionHeading}>How it works.</h2>
              <div className={styles.stepsGrid}>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>1</span>
                  <h3 className={styles.stepTitle}>Create your resident profile</h3>
                  <p className={styles.stepDesc}>Sign up with your phone number and set your address and Local Government Area.</p>
                </div>
                <div className={styles.stepArrow}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>2</span>
                  <h3 className={styles.stepTitle}>Check schedules, report issues, or pay bills</h3>
                  <p className={styles.stepDesc}>Use the dashboard to manage your waste collection, payments, and reports.</p>
                </div>
                <div className={styles.stepArrow}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>3</span>
                  <h3 className={styles.stepTitle}>Track updates and receive notifications</h3>
                  <p className={styles.stepDesc}>Stay informed with real-time updates on your reports, payments, and collection schedule.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ─── 5. Reporting Confidence ─── */}
          <section className={styles.confidenceSection}>
            <div className={styles.sectionInner}>
              <div className={styles.confidenceGrid}>
                <PhotoPlaceholder label="Waste collection operations in Lagos" className={styles.confidencePhoto} />
                <div className={styles.confidenceContent}>
                  <h2 className={styles.sectionHeading}>Every report matters.</h2>
                  <p className={styles.confidenceCopy}>
                    Every report gets a ticket number, so residents can track progress clearly from submission to resolution.
                  </p>
                  <div className={styles.timeline}>
                    <div className={styles.timelineStep}>
                      <span className={styles.timelineDot} />
                      <span className={styles.timelineLabel}>Submitted</span>
                    </div>
                    <div className={styles.timelineStep}>
                      <span className={styles.timelineDot} />
                      <span className={styles.timelineLabel}>In Review</span>
                    </div>
                    <div className={styles.timelineStep}>
                      <span className={styles.timelineDot} />
                      <span className={styles.timelineLabel}>Assigned</span>
                    </div>
                    <div className={styles.timelineStep}>
                      <span className={`${styles.timelineDot} ${styles.timelineDotActive}`} />
                      <span className={styles.timelineLabel}>Resolved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── 6. Final CTA ─── */}
          <section className={styles.ctaSection}>
            <div className={styles.ctaOverlay} />
            <div className={styles.ctaInner}>
              <h2 className={styles.ctaHeadline}>Help keep Lagos cleaner, one report at a time.</h2>
              <div className={styles.ctaActions}>
                <button className={styles.primaryCta} onClick={() => router.push('/login?mode=signup')} type="button">
                  Start Using LAWMA
                </button>
                <button className={styles.secondaryCta} onClick={() => router.push('/login?mode=signin')} type="button">
                  Sign In
                </button>
              </div>
            </div>
          </section>
        </main>
      )}
    </>
  );
}
