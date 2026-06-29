import Link from 'next/link';
import { Phone, User, MapPin, Home, Mail } from 'lucide-react';
import styles from './ProfileCompletionCard.module.css';

interface Props {
  name: string | null;
  lga: string | null;
  address: string | null;
  email: string | null;
  phoneNumber: string | null;
}

export function ProfileCompletionCard({ name, lga, address, email, phoneNumber }: Props) {
  const steps = [
    { label: 'Phone number', done: !!phoneNumber, Icon: Phone },
    { label: 'Full name', done: !!name, Icon: User },
    { label: 'Local Government Area', done: !!lga, Icon: MapPin },
    { label: 'Home address', done: !!address, Icon: Home },
    { label: 'Email address', done: !!email, Icon: Mail },
  ];

  const score = steps.filter((s) => s.done).length;
  if (score === 5) return null;

  const incomplete = steps.filter((s) => !s.done);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 5);

  return (
    <Link href="/profile" className={styles.card}>
      <div className={styles.ring} aria-label={`Profile ${score} of 5 steps complete`}>
        <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--color-outline-variant)" strokeWidth="4.5" />
          <circle
            cx="32" cy="32" r={radius}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 32 32)"
            style={{ transition: 'stroke-dashoffset 500ms ease' }}
          />
        </svg>
        <span className={styles.ringText}>
          <span className={styles.ringScore}>{score}</span>
          <span className={styles.ringDenom}>/5</span>
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.bodyTop}>
          <p className={styles.title}>Complete your profile</p>
          <span className={styles.remaining}>{incomplete.length} step{incomplete.length !== 1 ? 's' : ''} left</span>
        </div>
        <ul className={styles.steps}>
          {incomplete.map((s) => (
            <li key={s.label} className={styles.stepTodo}>
              <s.Icon size={12} strokeWidth={1.75} />
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
