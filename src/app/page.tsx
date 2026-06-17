'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check, FileCheck, FileSearch, UserRoundCheck, ShieldCheck } from 'lucide-react';

import { LandingHeader } from '@/components/landing/LandingHeader';
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
      <LandingHeader />
      <main className={styles.page}>

        {/* ─── 1. Hero ─── */}
        <section className={styles.heroSection}>
          <div className={styles.heroInner}>
            <div className={`${styles.heroText} ${animIn ? styles.heroTextVisible : ''}`}>
              <div className={styles.govBadge}>Lagos State Government</div>
              <h1 className={styles.heroHeadline}>
                Manage your waste, stay in control.
              </h1>
              <p className={styles.heroCopy}>
                Track waste collection, report sanitation issues, pay bills, and receive
                LAWMA updates from one simple app.
              </p>
              <div className={styles.heroActions}>
                <button className={styles.primaryCta} onClick={() => router.push('/login')} type="button">
                  Get started
                </button>
                <button className={styles.secondaryCta} onClick={() => router.push('/login?mode=signin')} type="button">
                  I already have an account
                </button>
              </div>
            </div>
              <div className={`${styles.heroVisual} ${animIn ? styles.heroVisualVisible : ''}`}>
                <div className={styles.phoneMockup}>
                  <Image
                    src="/assets/landing/photos/Hero Section phone mockup.png"
                    alt="LAWMA app on mobile"
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>
              </div>
          </div>
        </section>

        {/* ─── 2. Every report matters — status flow ─── */}
        <section className={styles.statusSection}>
          <div className={styles.sectionInner}>
            <h2 className={styles.sectionHeading}>Every report matters.</h2>
            <p className={styles.statusSub}>
              Every report gets a ticket number so residents can track progress from submission to resolution.
            </p>
            <div className={styles.statusFlow} aria-label="Report lifecycle">
              <div className={styles.statusStep}>
                <span className={styles.statusIcon} aria-hidden="true">
                  <FileCheck size={24} strokeWidth={1.75} />
                </span>
                <span className={styles.statusLabel}>Submitted</span>
              </div>
              <span className={styles.statusConnector} aria-hidden="true" />
              <div className={styles.statusStep}>
                <span className={styles.statusIcon} aria-hidden="true">
                  <FileSearch size={24} strokeWidth={1.75} />
                </span>
                <span className={styles.statusLabel}>In Review</span>
              </div>
              <span className={styles.statusConnector} aria-hidden="true" />
              <div className={styles.statusStep}>
                <span className={styles.statusIcon} aria-hidden="true">
                  <UserRoundCheck size={24} strokeWidth={1.75} />
                </span>
                <span className={styles.statusLabel}>Assigned</span>
              </div>
              <span className={styles.statusConnector} aria-hidden="true" />
              <div className={styles.statusStep}>
                <span className={`${styles.statusIcon} ${styles.statusIconActive}`} aria-hidden="true">
                  <ShieldCheck size={24} strokeWidth={1.75} />
                </span>
                <span className={`${styles.statusLabel} ${styles.statusLabelActive}`}>Resolved</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. Built for Lagos residents — photo + checklist ─── */}
        <section className={styles.trustSection}>
          <div className={styles.sectionInner}>
            <div className={styles.trustGrid}>
              <div className={styles.trustImgWrap}>
                <Image
                  src="/assets/landing/photos/LAWMA trucks.png"
                  alt="LAWMA waste collection trucks"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className={styles.trustContent}>
                <h2 className={styles.sectionHeading}>Built for Lagos residents.</h2>
                <ul className={styles.trustList}>
                  <li className={styles.trustItem}>
                    <Check size={22} strokeWidth={2.5} color="var(--color-primary)" />
                    Track your assigned PSP operator
                  </li>
                  <li className={styles.trustItem}>
                    <Check size={22} strokeWidth={2.5} color="var(--color-primary)" />
                    Secure payments via Flutterwave
                  </li>
                  <li className={styles.trustItem}>
                    <Check size={22} strokeWidth={2.5} color="var(--color-primary)" />
                    Report missed pickup or illegal dumping
                  </li>
                  <li className={styles.trustItem}>
                    <Check size={22} strokeWidth={2.5} color="var(--color-primary)" />
                    Get real-time updates from LAWMA
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. How it works — 3 numbered steps ─── */}
        <section className={styles.howSection}>
          <div className={styles.sectionInner}>
            <h2 className={styles.sectionHeading}>How it works.</h2>
            <div className={styles.stepsGrid}>
              <div className={styles.step}>
                <span className={styles.stepNumber}>01</span>
                <h3 className={styles.stepTitle}>Create your resident profile</h3>
                <p className={styles.stepDesc}>Sign up with your phone number and set your address and Local Government Area.</p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>02</span>
                <h3 className={styles.stepTitle}>Check schedules, report issues, or pay bills</h3>
                <p className={styles.stepDesc}>Use the dashboard to manage your waste collection, payments, and reports.</p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>03</span>
                <h3 className={styles.stepTitle}>Track updates and receive notifications</h3>
                <p className={styles.stepDesc}>Stay informed with real-time updates on your reports, payments, and collection schedule.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 5. CTA Footer — dark bg ─── */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaHeadline}>Help keep Lagos cleaner, one report at a time.</h2>
            <p className={styles.ctaSub}>Join residents across Lagos using LAWMA to build a cleaner city.</p>
            <div className={styles.ctaActions}>
              <button className={styles.ctaPrimary} onClick={() => router.push('/login')} type="button">
                Get started
              </button>
                <button className={styles.ctaSecondary} onClick={() => router.push('/login?mode=signin')} type="button">
                Sign in →
              </button>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
