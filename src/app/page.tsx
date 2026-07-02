'use client';

import { useState, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Check, FileCheck, FileSearch, UserRoundCheck, ShieldCheck } from 'lucide-react';

import { LandingHeader } from '@/components/landing/LandingHeader';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import styles from './page.module.css';

// ── Scroll-triggered fade+rise wrapper ───────────────────────────────────────

const FadeUp = memo(function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px 0px' });
  const reduced = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
});

// ── Word-by-word headline reveal ─────────────────────────────────────────────

const WordByWord = memo(function WordByWord({ text, className }: { text: string; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <span className={className}>{text.replace(/\n/g, ' ')}</span>;

  // split on spaces, preserving \n as explicit breaks
  const tokens = text.split(/(\n| )/).filter(Boolean);
  let wordCount = 0;
  return (
    <span className={className}>
      {tokens.map((token, i) => {
        if (token === '\n') return <br key={`br-${i}`} />;
        if (token === ' ') return <span key={`sp-${i}`}>{' '}</span>;
        const delay = 0.1 + wordCount++ * 0.07;
        return (
          <motion.span
            key={i}
            className={styles.wordSpan}
            initial={{ opacity: 0, filter: 'blur(5px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.4, delay, ease: 'easeOut' }}
          >
            {token}
          </motion.span>
        );
      })}
    </span>
  );
});

// ── Hover-beam card ─────────────────────────────────────────────────────────

const BeamCard = memo(function BeamCard({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [beam, setBeam] = useState<React.CSSProperties>({});
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      onMouseMove={
        reduced
          ? undefined
          : (e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - r.left) / r.width) * 100;
              const y = ((e.clientY - r.top) / r.height) * 100;
              setBeam({
                background: `radial-gradient(circle at ${x}% ${y}%, color-mix(in srgb, var(--color-primary) 12%, var(--color-surface)), color-mix(in srgb, var(--color-primary) 2%, var(--color-surface)) 70%)`,
              });
            }
      }
      onMouseLeave={() => setBeam({})}
      style={beam}
      initial={{ opacity: 0, y: reduced ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
});

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();

  return (
    <>
      <LandingHeader />
      <main className={styles.page}>

        {/* ─── 1. Hero ─── */}
        <section className={styles.heroSection}>
          <AuroraBackground />
          <div className={styles.heroInner}>
            <div className={styles.heroContent}>
              <div className={styles.heroText}>

                <motion.img
                  src="/assets/landing/photos/lagos-state-government.png"
                  alt="Lagos State Government"
                  className={styles.govBadge}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />

                <h1 className={styles.heroHeadline}>
                  <WordByWord text={"Manage your waste,\nstay in control."} />
                </h1>

                <motion.p
                  className={styles.heroCopy}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
                >
                  Track waste collection, report sanitation issues, pay bills, and receive
                  LAWMA updates from one simple app.
                </motion.p>
              </div>

              <motion.div
                className={styles.heroActions}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.72, ease: 'easeOut' }}
              >
                <button
                  className={`${styles.primaryCta} ${styles.sweepBtn}`}
                  onClick={() => router.push('/login?mode=signup')}
                  type="button"
                >
                  Get started
                </button>
                <button
                  className={styles.secondaryCta}
                  onClick={() => router.push('/login?mode=signin')}
                  type="button"
                >
                  I already have an account
                </button>
              </motion.div>

              <motion.div
                className={styles.phoneMockup}
                role="img"
                aria-label="LAWMA app dashboard preview on mobile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </section>

        {/* ─── 2. Every report matters ─── */}
        <section className={styles.statusSection}>
          <div className={styles.sectionInner}>
            <motion.h2
              className={styles.sectionHeading}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              Every report matters.
            </motion.h2>
            <motion.p
              className={styles.statusSub}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45, delay: 0.08, ease: 'easeOut' }}
            >
              Every report gets a ticket number so residents can track progress from submission to resolution.
            </motion.p>

            {/* keep original DOM structure so nth-child CSS still works */}
            <div className={styles.statusFlow} aria-label="Report lifecycle">
              <motion.div
                className={styles.statusStep}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: 0, ease: 'easeOut' }}
              >
                <span className={styles.statusIcon} aria-hidden="true">
                  <FileCheck size={24} strokeWidth={1.75} />
                </span>
                <span className={styles.statusLabel}>Submitted</span>
              </motion.div>

              <motion.span
                className={styles.statusConnector}
                aria-hidden="true"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.12, ease: 'easeOut' }}
              />

              <motion.div
                className={styles.statusStep}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: 0.16, ease: 'easeOut' }}
              >
                <span className={styles.statusIcon} aria-hidden="true">
                  <FileSearch size={24} strokeWidth={1.75} />
                </span>
                <span className={styles.statusLabel}>In Review</span>
              </motion.div>

              <motion.span
                className={styles.statusConnector}
                aria-hidden="true"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.24, ease: 'easeOut' }}
              />

              <motion.div
                className={styles.statusStep}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: 0.28, ease: 'easeOut' }}
              >
                <span className={styles.statusIcon} aria-hidden="true">
                  <UserRoundCheck size={24} strokeWidth={1.75} />
                </span>
                <span className={styles.statusLabel}>Assigned</span>
              </motion.div>

              <motion.span
                className={styles.statusConnector}
                aria-hidden="true"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.36, ease: 'easeOut' }}
              />

              <motion.div
                className={styles.statusStep}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
              >
                <span className={`${styles.statusIcon} ${styles.statusIconActive}`} aria-hidden="true">
                  <ShieldCheck size={24} strokeWidth={1.75} />
                </span>
                <span className={`${styles.statusLabel} ${styles.statusLabelActive}`}>Resolved</span>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── 3. Built for Lagos ─── */}
        <section className={styles.trustSection}>
          <div className={styles.sectionInner}>
            <div className={styles.trustGrid}>
              <motion.div
                className={styles.trustImgWrap}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <Image
                  src="/assets/landing/photos/LAWMA trucks.png"
                  alt="LAWMA waste collection trucks"
                  fill
                  sizes="(max-width: 768px) 100vw, 520px"
                  style={{ objectFit: 'cover' }}
                  className={styles.trustImg}
                />
              </motion.div>

              <div className={styles.trustContent}>
                <FadeUp>
                  <h2 className={styles.sectionHeading}>Built for Lagos residents.</h2>
                </FadeUp>
                <ul className={styles.trustList}>
                  {[
                    'Track your assigned PSP operator',
                    'Secure payments via Flutterwave',
                    'Report missed pickup or illegal dumping',
                    'Get real-time updates from LAWMA',
                  ].map((text, i) => (
                    <motion.li
                      key={text}
                      className={styles.trustItem}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
                    >
                      <Check size={22} strokeWidth={2.5} color="var(--color-primary)" />
                      {text}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. How it works ─── */}
        <section className={styles.howSection}>
          <div className={styles.sectionInner}>
            <FadeUp>
              <h2 className={styles.sectionHeading}>How it works.</h2>
            </FadeUp>
            <div className={styles.stepsGrid}>
              <BeamCard className={styles.step} delay={0}>
                <span className={styles.stepNumber}>01</span>
                <h3 className={styles.stepTitle}>Create your resident profile</h3>
                <p className={styles.stepDesc}>Sign up with your phone number and set your address and Local Government Area.</p>
              </BeamCard>
              <BeamCard className={styles.step} delay={0.08}>
                <span className={styles.stepNumber}>02</span>
                <h3 className={styles.stepTitle}>Check schedules, report issues, or pay bills</h3>
                <p className={styles.stepDesc}>Use the dashboard to manage your waste collection, payments, and reports.</p>
              </BeamCard>
              <BeamCard className={styles.step} delay={0.16}>
                <span className={styles.stepNumber}>03</span>
                <h3 className={styles.stepTitle}>Track updates and receive notifications</h3>
                <p className={styles.stepDesc}>Stay informed with real-time updates on your reports, payments, and collection schedule.</p>
              </BeamCard>
              <BeamCard className={`${styles.step} ${styles.stepReward}`} delay={0.24}>
                <span className={styles.stepNumber}>04</span>
                <h3 className={styles.stepTitle}>Pay with the app and earn discounts</h3>
                <p className={styles.stepDesc}>Every bill paid through the LAWMA app earns you reward points — redeemable as a discount on your next bill.</p>
              </BeamCard>
            </div>
          </div>
        </section>

        {/* ─── 5. Community Carousel ─── */}
        <section className={styles.communitySection}>
          <div className={styles.communityInner}>
            <FadeUp>
              <h2 className={styles.communityHeading}>Stay informed. Stay involved.</h2>
            </FadeUp>
            <FadeUp delay={0.08}>
              <p className={styles.communitySub}>Tips, campaigns, and events from LAWMA.</p>
            </FadeUp>
            <div className={styles.carouselTrack}>
              <div className={`${styles.carouselCard} ${styles.sheenCard}`}>
                <span className={`${styles.carouselChip} ${styles.chipRecycling}`}>Recycling Tips</span>
                <h3 className={styles.carouselCardTitle}>Separate before you dispose</h3>
                <p className={styles.carouselCardBody}>Rinse plastics, flatten cardboard. Small steps at home make a big difference for Lagos.</p>
              </div>
              <div className={`${styles.carouselCard} ${styles.sheenCard}`}>
                <span className={`${styles.carouselChip} ${styles.chipCampaign}`}>Community Campaign</span>
                <h3 className={styles.carouselCardTitle}>Adopt a Street</h3>
                <p className={styles.carouselCardBody}>Join LAWMA&apos;s Adopt a Street initiative. Keep your street spotless as a community — one street at a time.</p>
              </div>
              <div className={`${styles.carouselCard} ${styles.sheenCard}`}>
                <span className={`${styles.carouselChip} ${styles.chipEnvironmental}`}>Environmental Day</span>
                <h3 className={styles.carouselCardTitle}>Last Saturday of every month</h3>
                <p className={styles.carouselCardBody}>Residents dedicate a few hours to clearing frontages and shared spaces. LAWMA-mandated Community Sanitation Day.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. CTA Footer ─── */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaBeams} aria-hidden="true" />
          <div className={styles.ctaInner}>
            <FadeUp>
              <h2 className={styles.ctaHeadline}>Help keep Lagos cleaner, one report at a time.</h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className={styles.ctaSub}>Join residents across Lagos using LAWMA to build a cleaner city.</p>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className={styles.ctaActions}>
                <button
                  className={`${styles.ctaPrimary} ${styles.sweepBtn}`}
                  onClick={() => router.push('/login?mode=signup')}
                  type="button"
                >
                  Get started
                </button>
                <button
                  className={styles.ctaSecondary}
                  onClick={() => router.push('/login?mode=signin')}
                  type="button"
                >
                  Sign in →
                </button>
              </div>
            </FadeUp>
          </div>
        </section>

      </main>
    </>
  );
}
