'use client';

import { useState } from 'react';
import { Recycle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './CenterLogin.module.css';

type Props = {
  // The station reuses this sign-in wholesale — same operators, same session,
  // different copy and landing route.
  title?: string;
  subtitle?: string;
  cta?: string;
  redirectTo?: string;
  placeholderCode?: string;
};

export function CenterLogin({
  title = 'Collection centre',
  subtitle = 'Staff sign-in for the buy-back counter.',
  cta = 'Open counter',
  redirectTo = '/center',
  placeholderCode = 'SIM01',
}: Props) {
  const [staffCode, setStaffCode] = useState('');
  const [passcode, setPasscode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/center/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffCode, passcode }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      // Full reload so the server component re-reads the new session cookie.
      window.location.href = redirectTo;
    } catch {
      setError('Network problem. Check the connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <span className={styles.mark}>
          <Recycle size={22} strokeWidth={2} />
        </span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Staff code"
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            placeholder={placeholderCode}
            value={staffCode}
            onChange={(e) => setStaffCode(e.target.value.toUpperCase())}
          />
          <Input
            label="Passcode"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder="••••"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />
          <Button
            type="submit"
            size="lg"
            isLoading={busy}
            disabled={!staffCode || !passcode}
          >
            {cta}
          </Button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
