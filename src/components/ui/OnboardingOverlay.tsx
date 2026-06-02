'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './OnboardingOverlay.module.css';

const steps = [
  {
    title: 'Collection Schedule',
    description: 'View your assigned pickup days and PSP operator. Get notified before each collection.',
    illustration: (
      <svg viewBox="0 0 120 100" fill="none" className={styles.svg}>
        <rect x="10" y="15" width="100" height="70" rx="8" stroke="currentColor" strokeWidth="1" fill="none" />
        <text x="60" y="35" textAnchor="middle" fontSize="9" fill="currentColor">MON</text>
        <text x="60" y="45" textAnchor="middle" fontSize="9" fill="currentColor">TUE</text>
        <text x="60" y="55" textAnchor="middle" fontSize="9" fill="currentColor">WED</text>
        <text x="60" y="65" textAnchor="middle" fontSize="9" fill="currentColor">THU</text>
        <text x="60" y="75" textAnchor="middle" fontSize="9" fill="currentColor">FRI</text>
        <circle cx="30" cy="39" r="12" fill="currentColor" opacity="0.2" />
        <circle cx="30" cy="39" r="4" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Report Issues',
    description: 'Report missed pickups or illegal dumping with photos and location. Track resolution in real time.',
    illustration: (
      <svg viewBox="0 0 120 100" fill="none" className={styles.svg}>
        <circle cx="60" cy="40" r="25" stroke="currentColor" strokeWidth="1" fill="none" />
        <circle cx="60" cy="34" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M45 65 Q60 55 75 65" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="85" y="25" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="95" cy="35" r="5" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    title: 'Digital Payments',
    description: 'View waste bills and pay securely through Flutterwave. Track your payment history.',
    illustration: (
      <svg viewBox="0 0 120 100" fill="none" className={styles.svg}>
        <rect x="20" y="20" width="80" height="60" rx="6" stroke="currentColor" strokeWidth="1" fill="none" />
        <text x="60" y="45" textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor">NGN</text>
        <text x="60" y="55" textAnchor="middle" fontSize="8" fill="currentColor">Waste Bill</text>
        <rect x="35" y="60" width="50" height="16" rx="3" fill="currentColor" opacity="0.15" />
        <text x="60" y="72" textAnchor="middle" fontSize="7" fontWeight="600" fill="currentColor">PAY NOW</text>
      </svg>
    ),
  },
];

type Props = {
  onComplete: () => void;
  onSkip: () => void;
};

export function OnboardingOverlay({ onComplete, onSkip }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const goTo = useCallback((index: number, dir: 'next' | 'prev') => {
    if (transitioning) return;
    setDirection(dir);
    setTransitioning(true);
    setTimeout(() => {
      setStep(index);
      setTransitioning(false);
    }, 400);
  }, [transitioning]);

  const handleNext = useCallback(() => {
    if (step < steps.length - 1) {
      goTo(step + 1, 'next');
    } else {
      onComplete();
      router.push('/login');
    }
  }, [step, goTo, onComplete, router]);

  const slideClass = transitioning
    ? direction === 'next'
      ? styles.slideOutLeft
      : styles.slideOutRight
    : styles.active;

  const enterClass = transitioning
    ? direction === 'next'
      ? styles.enterRight
      : styles.enterLeft
    : '';

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <button className={styles.skip} onClick={onSkip} type="button">Skip</button>

        <div className={styles.stage}>
          <div className={`${styles.content} ${slideClass}`}>
            <div className={styles.illustration}>{steps[step].illustration}</div>
            <h2 className={styles.title}>{steps[step].title}</h2>
            <p className={styles.description}>{steps[step].description}</p>
          </div>
          <div className={`${styles.content} ${enterClass}`}>
            <div className={styles.illustration}>
              {steps[step < steps.length - 1 ? step + 1 : 0].illustration}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.dots}>
            {steps.map((_, i) => (
              <span
                key={i}
                className={`${styles.dot} ${i === step ? styles.dotActive : ''}`}
                onClick={() => i !== step && goTo(i, i > step ? 'next' : 'prev')}
              />
            ))}
          </div>
          <button className={styles.nextButton} onClick={handleNext} type="button">
            {step < steps.length - 1 ? 'Next' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}
