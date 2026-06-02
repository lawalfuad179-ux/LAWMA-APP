'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ProductTour.module.css';

const steps = [
  {
    title: 'Next Pickup Card',
    description: 'See your next collection day and stay updated on your waste pickup schedule.',
    target: 'pickup',
  },
  {
    title: 'Report Issue',
    description: 'Report missed pickups, illegal dumping, or sanitation issues with photos and location.',
    target: 'report',
  },
  {
    title: 'Pay Bills',
    description: 'Pay securely through Flutterwave and receive digital receipts for every transaction.',
    target: 'payments',
  },
  {
    title: 'Notifications',
    description: 'Receive collection reminders, complaint updates, and important LAWMA announcements.',
    target: 'notifications',
  },
];

type Props = {
  onComplete: () => void;
  onSkip: () => void;
};

export function ProductTour({ onComplete, onSkip }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const handleNext = useCallback(() => {
    if (step < steps.length - 1) {
      setExiting(true);
      setTimeout(() => {
        setStep((s) => s + 1);
        setExiting(false);
      }, 300);
    } else {
      onComplete();
      router.push('/dashboard');
    }
  }, [step, onComplete, router]);

  const current = steps[step];

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <button className={styles.skip} onClick={onSkip} type="button">Skip tour</button>

        <div className={`${styles.stage} ${exiting ? styles.exit : styles.enter}`} key={step}>
          <div className={styles.visual}>
            <svg viewBox="0 0 120 100" fill="none" className={styles.svg}>
              {step === 0 && (
                <><rect x="10" y="15" width="100" height="70" rx="8" stroke="currentColor" strokeWidth="1" /><text x="60" y="35" textAnchor="middle" fontSize="9" fill="currentColor">MON</text><text x="60" y="45" textAnchor="middle" fontSize="9" fill="currentColor">TUE</text><text x="60" y="55" textAnchor="middle" fontSize="9" fill="currentColor">WED</text><circle cx="30" cy="39" r="12" fill="currentColor" opacity="0.15" /><circle cx="30" cy="39" r="4" fill="currentColor" /></>
              )}
              {step === 1 && (
                <><circle cx="60" cy="40" r="25" stroke="currentColor" strokeWidth="1" /><circle cx="60" cy="34" r="8" stroke="currentColor" strokeWidth="1" /><path d="M45 65 Q60 55 75 65" stroke="currentColor" strokeWidth="1" /><rect x="85" y="25" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1" /></>
              )}
              {step === 2 && (
                <><rect x="20" y="20" width="80" height="60" rx="6" stroke="currentColor" strokeWidth="1" /><text x="60" y="45" textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor">NGN</text><rect x="35" y="60" width="50" height="16" rx="3" fill="currentColor" opacity="0.15" /></>
              )}
              {step === 3 && (
                <><rect x="15" y="15" width="90" height="70" rx="8" stroke="currentColor" strokeWidth="1" /><circle cx="30" cy="35" r="3" fill="currentColor" /><rect x="40" y="31" width="50" height="8" rx="4" fill="currentColor" opacity="0.2" /><circle cx="30" cy="55" r="3" fill="currentColor" /><rect x="40" y="51" width="50" height="8" rx="4" fill="currentColor" opacity="0.2" /></>
              )}
            </svg>
          </div>
          <h2 className={styles.title}>{current.title}</h2>
          <p className={styles.description}>{current.description}</p>
        </div>

        <div className={styles.footer}>
          <div className={styles.dots}>
            {steps.map((_, i) => (
              <span key={i} className={`${styles.dot} ${i === step ? styles.dotActive : ''}`} />
            ))}
          </div>
          <button className={styles.nextButton} onClick={handleNext} type="button">
            {step < steps.length - 1 ? 'Next' : 'Go to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
