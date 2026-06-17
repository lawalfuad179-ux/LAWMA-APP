'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, MessageSquare, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

type Prefs = {
  emailComplaintUpdates: boolean;
  emailPaymentReceipts: boolean;
  emailCollectionReminders: boolean;
  emailAnnouncements: boolean;
  smsComplaintUpdates: boolean;
  smsCollectionReminders: boolean;
  smsDelayedPickup: boolean;
};

const DEFAULT_PREFS: Prefs = {
  emailComplaintUpdates: true,
  emailPaymentReceipts: true,
  emailCollectionReminders: true,
  emailAnnouncements: false,
  smsComplaintUpdates: true,
  smsCollectionReminders: true,
  smsDelayedPickup: true,
};

type ToggleProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon: React.ReactNode;
};

function Toggle({ checked, onChange, label, icon }: ToggleProps) {
  return (
    <button
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
      type="button"
      role="switch"
      aria-checked={checked}
    >
      <span className={styles.toggleIcon}>{icon}</span>
      <span className={styles.toggleLabel}>{label}</span>
      <span className={styles.toggleTrack}>
        <span className={styles.toggleThumb} />
      </span>
    </button>
  );
}

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setPrefs(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = useCallback((key: keyof Prefs, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  }, []);

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      if (!data.ok) { setError('Failed to save preferences.'); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => router.back()} type="button" aria-label="Go back">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <h1 className={styles.title}>Notification Preferences</h1>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : (
        <>
          {saved && (
            <div className={styles.successBanner}>
              <Check size={16} strokeWidth={2} /> Preferences saved.
            </div>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionEyebrow}>
                <Mail size={15} strokeWidth={1.5} />
                <span>Email Notifications</span>
              </div>
            </div>
            <div className={styles.toggleList}>
              <Toggle
                checked={prefs.emailComplaintUpdates}
                onChange={(v) => set('emailComplaintUpdates', v)}
                label="Complaint status updates"
                icon={<Mail size={15} strokeWidth={1.5} />}
              />
              <Toggle
                checked={prefs.emailPaymentReceipts}
                onChange={(v) => set('emailPaymentReceipts', v)}
                label="Payment receipts"
                icon={<Mail size={15} strokeWidth={1.5} />}
              />
              <Toggle
                checked={prefs.emailCollectionReminders}
                onChange={(v) => set('emailCollectionReminders', v)}
                label="Collection reminders"
                icon={<Mail size={15} strokeWidth={1.5} />}
              />
              <Toggle
                checked={prefs.emailAnnouncements}
                onChange={(v) => set('emailAnnouncements', v)}
                label="LAWMA announcements"
                icon={<Mail size={15} strokeWidth={1.5} />}
              />
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionEyebrow}>
                <MessageSquare size={15} strokeWidth={1.5} />
                <span>SMS Notifications</span>
              </div>
            </div>
            <div className={styles.toggleList}>
              <Toggle
                checked={prefs.smsComplaintUpdates}
                onChange={(v) => set('smsComplaintUpdates', v)}
                label="Complaint status updates"
                icon={<MessageSquare size={15} strokeWidth={1.5} />}
              />
              <Toggle
                checked={prefs.smsCollectionReminders}
                onChange={(v) => set('smsCollectionReminders', v)}
                label="Collection reminders"
                icon={<MessageSquare size={15} strokeWidth={1.5} />}
              />
              <Toggle
                checked={prefs.smsDelayedPickup}
                onChange={(v) => set('smsDelayedPickup', v)}
                label="Delayed pickup alerts"
                icon={<MessageSquare size={15} strokeWidth={1.5} />}
              />
            </div>
          </section>

          {error && <p className={styles.error}>{error}</p>}

          <Button size="lg" isLoading={saving} onClick={handleSave} type="button">
            Save preferences
          </Button>
        </>
      )}
    </div>
  );
}
