'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check } from 'lucide-react';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import styles from './page.module.css';

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    requestAnimationFrame(() => setAnimIn(true));
  }, []);

  if (!mounted) return null;

  return (
    <>
      <ThemeToggle />
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
                  <button className={styles.primaryCta} onClick={() => router.push('/login')} type="button">
                    Get Started
                  </button>
                  <button className={styles.secondaryCta} onClick={() => router.push('/login?mode=signin')} type="button">
                    I already have an account
                  </button>
                </div>
              </div>
              <div className={`${styles.heroVisual} ${animIn ? styles.heroVisualVisible : ''}`}>
                <div className={styles.phoneFrame}>
                  <div className={styles.phoneNotch} />
                  <div className={styles.phoneScreenImg}>
                    <Image
                      src="/assets/landing/mockups/schedule.png"
                      alt="LAWMA app schedule screen"
                      fill
                      style={{ objectFit: 'cover', objectPosition: 'top' }}
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── 2. Trust / Local Context ─── */}
          <section className={styles.trustSection}>
            <div className={styles.sectionInner}>
              <div className={styles.trustGrid}>
                <div className={styles.trustImgWrap}>
                  <Image
                    src="/assets/landing/photos/truck.png"
                    alt="LAWMA waste collection truck on a Lagos street"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.trustContent}>
                  <h2 className={styles.sectionHeading}>Built for Lagos residents.</h2>
                  <ul className={styles.trustList}>
                    <li className={styles.trustItem}>
                      <Check size={20} strokeWidth={2.5} color="var(--color-primary)" />
                      Track your assigned PSP operator
                    </li>
                    <li className={styles.trustItem}>
                      <Check size={20} strokeWidth={2.5} color="var(--color-primary)" />
                      Secure payments via Flutterwave
                    </li>
                    <li className={styles.trustItem}>
                      <Check size={20} strokeWidth={2.5} color="var(--color-primary)" />
                      Report missed pickup or illegal dumping
                    </li>
                    <li className={styles.trustItem}>
                      <Check size={20} strokeWidth={2.5} color="var(--color-primary)" />
                      Get real-time updates from LAWMA
                    </li>
                  </ul>
                </div>
                <div className={styles.trustImgWrap2}>
                  <Image
                    src="/assets/landing/photos/neighbourhood.png"
                    alt="A clean, well-maintained Lagos neighbourhood"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
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
                  <div className={styles.mockupImgWrap}>
                    <Image
                      src="/assets/landing/mockups/schedule.png"
                      alt="Collection schedule screen"
                      fill
                      style={{ objectFit: 'cover', objectPosition: 'top' }}
                    />
                  </div>
                </div>
                <div className={styles.showcaseBlock}>
                  <div className={styles.showcaseText}>
                    <h3 className={styles.showcaseTitle}>Report Waste Issues</h3>
                    <p className={styles.showcaseDesc}>
                      Report missed pickups or illegal dumping with photos and GPS location. Every report gets a trackable ticket number.
                    </p>
                  </div>
                  <div className={styles.mockupImgWrap}>
                    <Image
                      src="/assets/landing/mockups/reports.png"
                      alt="Report issue screen"
                      fill
                      style={{ objectFit: 'cover', objectPosition: 'top' }}
                    />
                  </div>
                </div>
                <div className={styles.showcaseBlock}>
                  <div className={styles.showcaseText}>
                    <h3 className={styles.showcaseTitle}>Pay Waste Bills</h3>
                    <p className={styles.showcaseDesc}>
                      View outstanding bills and pay securely through Flutterwave. Download receipts and track payment history.
                    </p>
                  </div>
                  <div className={styles.mockupImgWrap}>
                    <Image
                      src="/assets/landing/mockups/payments.png"
                      alt="Payments screen"
                      fill
                      style={{ objectFit: 'cover', objectPosition: 'top' }}
                    />
                  </div>
                </div>
                <div className={styles.showcaseBlock}>
                  <div className={styles.showcaseText}>
                    <h3 className={styles.showcaseTitle}>Receive LAWMA Updates</h3>
                    <p className={styles.showcaseDesc}>
                      Get notified about schedule changes, complaint status updates, and important announcements from LAWMA.
                    </p>
                  </div>
                  <div className={styles.showcasePhotoWrap}>
                    <Image
                      src="/assets/landing/photos/community.png"
                      alt="Community engagement in Lagos"
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
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
                  <Check size={24} strokeWidth={1.5} color="var(--color-primary)" />
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>2</span>
                  <h3 className={styles.stepTitle}>Check schedules, report issues, or pay bills</h3>
                  <p className={styles.stepDesc}>Use the dashboard to manage your waste collection, payments, and reports.</p>
                </div>
                <div className={styles.stepArrow}>
                  <Check size={24} strokeWidth={1.5} color="var(--color-primary)" />
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
                <div className={styles.confidenceImgWrap}>
                  <Image
                    src="/assets/landing/photos/operations.png"
                    alt="Waste collection operations in Lagos"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
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
                <button className={styles.primaryCta} onClick={() => router.push('/login')} type="button">
                  Start Using LAWMA
                </button>
                <button className={styles.secondaryCta} onClick={() => router.push('/login?mode=signin')} type="button">
                  Sign In
                </button>
              </div>
            </div>
          </section>
        </main>
    </>
  );
}
