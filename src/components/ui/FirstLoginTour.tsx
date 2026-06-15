'use client';

import { Calendar, Receipt, Megaphone, Bell, MessageSquare, Leaf } from 'lucide-react';
import styles from './FirstLoginTour.module.css';

const FEATURES = [
  { Icon: Calendar, label: 'Know your pickup day', desc: "See your LGA's exact collection schedule before you miss it." },
  { Icon: Receipt, label: 'Pay bills in seconds', desc: 'No queues, no stress. Settle your waste management bills right here.' },
  { Icon: Megaphone, label: 'Report, track, resolve', desc: 'Spotted illegal dumping? File a complaint and watch it get handled.' },
  { Icon: Bell, label: 'Pickup reminders', desc: 'Get notified the evening before your collection day. Never miss a pickup again.' },
  { Icon: MessageSquare, label: 'Complaint updates', desc: 'Track every status change on your filed reports straight to your inbox.' },
  { Icon: Leaf, label: 'Recycling tips', desc: 'Weekly tips to help you sort smarter, reduce waste, and live a little greener.' },
];

type Props = {
  onDismiss: () => void;
};

export function FirstLoginTour({ onDismiss }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Welcome to LAWMA</h2>
        <p className={styles.subtitle}>
          Here&apos;s what you can do with your waste management companion.
        </p>
        <div className={styles.grid}>
          {FEATURES.map(({ Icon, label, desc }) => (
            <div key={label} className={styles.tile}>
              <div className={styles.tileIcon}><Icon size={18} strokeWidth={1.5} /></div>
              <div className={styles.tileText}>
                <span className={styles.tileLabel}>{label}</span>
                <span className={styles.tileDesc}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
        <button className={styles.dismissBtn} onClick={onDismiss} type="button">
          Got it
        </button>
      </div>
    </div>
  );
}
