'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Recycle, Search } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './CenterKiosk.module.css';

type Material = 'PLASTIC' | 'PAPER' | 'CARDBOARD' | 'METAL' | 'GLASS';
type Rate = { material: Material; koboPerKg: number };
type Resident = { id: string; name: string | null };

type Receipt = {
  receiptCode: string;
  residentName: string | null;
  material: Material;
  weightGrams: number;
  amountKobo: number;
  pointsAwarded: number;
  newBalance: number;
  flagged: boolean;
  flagReason: string | null;
};

type Step = 'lookup' | 'register' | 'weigh' | 'receipt';

type Props = {
  operatorName: string;
  centerName: string;
  initialToday: { dropOffs: number; weightGrams: number; amountKobo: number };
};

const PHONE_FIELD_ID = 'kiosk-phone';

const naira = (kobo: number) =>
  `₦${(kobo / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

const kg = (grams: number) => `${(grams / 1000).toFixed(1)}kg`;

export function CenterKiosk({ operatorName, centerName, initialToday }: Props) {
  const [step, setStep] = useState<Step>('lookup');
  const [rates, setRates] = useState<Rate[]>([]);
  const [today, setToday] = useState(initialToday);

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [resident, setResident] = useState<Resident | null>(null);
  const [residentToday, setResidentToday] = useState<{ weightGrams: number; capGrams: number } | null>(null);

  const [material, setMaterial] = useState<Material | null>(null);
  const [weightKg, setWeightKg] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/center/rates')
      .then((r) => r.json())
      .then((j) => { if (j.ok) setRates(j.data.rates); })
      .catch(() => {});
  }, []);

  const refreshShift = useCallback(() => {
    fetch('/api/center/session')
      .then((r) => r.json())
      .then((j) => { if (j.ok) setToday(j.data.today); })
      .catch(() => {});
  }, []);

  const reset = useCallback(() => {
    setStep('lookup');
    setPhone('');
    setName('');
    setResident(null);
    setResidentToday(null);
    setMaterial(null);
    setWeightKg('');
    setReceipt(null);
    setError(null);
    // Put the cursor straight back in the phone field — the next person in the
    // queue is already standing there, and autoFocus won't re-fire because the
    // component never unmounts between residents.
    requestAnimationFrame(() => {
      document.getElementById(PHONE_FIELD_ID)?.focus();
    });
  }, []);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/center/resident?phone=${encodeURIComponent(phone)}`);
      const json = await res.json();
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      if (json.data.found) {
        setResident(json.data.resident);
        setResidentToday(json.data.today);
        setStep('weigh');
      } else {
        setStep('register');
      }
    } catch {
      setError('Network problem. Check the connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/center/resident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, name }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      setResident(json.data.resident);
      setResidentToday({ weightGrams: 0, capGrams: 50_000 });
      setStep('weigh');
    } catch {
      setError('Network problem. Check the connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleWeigh(e: React.FormEvent) {
    e.preventDefault();
    if (!resident || !material) return;
    const grams = Math.round(parseFloat(weightKg) * 1000);
    if (!Number.isFinite(grams) || grams <= 0) {
      setError('Enter the weight in kilograms.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/center/dropoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ residentId: resident.id, material, weightGrams: grams }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      setReceipt(json.data);
      setStep('receipt');
      refreshShift();
    } catch {
      setError('Network problem. The drop-off was not recorded — try again.');
    } finally {
      setBusy(false);
    }
  }

  const activeRate = rates.find((r) => r.material === material) ?? null;
  const parsedKg = parseFloat(weightKg);
  const previewKobo =
    activeRate && Number.isFinite(parsedKg) && parsedKg > 0
      ? Math.floor(parsedKg * activeRate.koboPerKg)
      : null;

  const overCap =
    residentToday && residentToday.weightGrams >= residentToday.capGrams;

  const stepIndex = { lookup: 0, register: 0, weigh: 1, receipt: 2 }[step];

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <Recycle size={18} strokeWidth={2} />
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandTitle}>{centerName} Collection Centre</span>
            <span className={styles.brandSub}>Buy-back counter · {operatorName}</span>
          </span>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.shiftStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{today.dropOffs}</span>
              <span className={styles.statLabel}>Today</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{kg(today.weightGrams)}</span>
              <span className={styles.statLabel}>Weighed</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{naira(today.amountKobo)}</span>
              <span className={styles.statLabel}>Paid out</span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={async () => {
              await fetch('/api/center/session', { method: 'DELETE' });
              window.location.reload();
            }}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className={styles.body}>
        <div className={styles.panel}>
          <div className={styles.steps} aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={[
                  styles.stepDot,
                  i === stepIndex ? styles.stepDotActive : '',
                  i < stepIndex ? styles.stepDotDone : '',
                ].filter(Boolean).join(' ')}
              />
            ))}
          </div>

          {/* ── Step 1: find the person ───────────────────────────────── */}
          {step === 'lookup' && (
            <div className={styles.card}>
              <h1 className={styles.title}>Find resident</h1>
              <p className={styles.subtitle}>
                Enter their phone number. New here? We&apos;ll register them in one step.
              </p>
              <form className={styles.form} onSubmit={handleLookup}>
                <Input
                  id={PHONE_FIELD_ID}
                  label="Phone number"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  placeholder="0801 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  icon={<Search size={18} strokeWidth={1.5} />}
                />
                <Button type="submit" size="lg" isLoading={busy} disabled={phone.length < 10}>
                  Continue
                </Button>
              </form>
              {error && <p className={styles.error}>{error}</p>}
            </div>
          )}

          {/* ── Step 1b: walk-up registration ─────────────────────────── */}
          {step === 'register' && (
            <div className={styles.card}>
              <h1 className={styles.title}>New resident</h1>
              <p className={styles.subtitle}>
                <strong>{phone}</strong>{' '}isn&apos;t registered yet. Add their name — they can
                claim this account and their credit from the LAWMA app later.
              </p>
              <form className={styles.form} onSubmit={handleRegister}>
                <Input
                  label="Full name"
                  autoFocus
                  autoComplete="off"
                  placeholder="e.g. Ngozi Okafor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <div className={styles.actions}>
                  <Button type="button" variant="ghost" size="lg" onClick={reset}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className={styles.grow}
                    isLoading={busy}
                    disabled={name.trim().length < 2}
                  >
                    Register &amp; weigh
                  </Button>
                </div>
              </form>
              {error && <p className={styles.error}>{error}</p>}
            </div>
          )}

          {/* ── Step 2: weigh it ──────────────────────────────────────── */}
          {step === 'weigh' && resident && (
            <div className={styles.card}>
              <div className={`${styles.resident} ${overCap ? styles.capWarn : ''}`}>
                <div>
                  <div className={styles.residentName}>{resident.name ?? 'Resident'}</div>
                  <div className={styles.residentMeta}>{phone}</div>
                </div>
                {residentToday && (
                  <div className={styles.residentMeta}>
                    {kg(residentToday.weightGrams)} / {kg(residentToday.capGrams)} today
                  </div>
                )}
              </div>

              <form className={styles.form} onSubmit={handleWeigh}>
                <div>
                  <span className={styles.label}>
                    Material
                    <span className={styles.labelNote}>Indicative rates — LAWMA sets final pricing</span>
                  </span>
                  <div className={styles.materials}>
                    {rates.map((r) => (
                      <button
                        key={r.material}
                        type="button"
                        onClick={() => setMaterial(r.material)}
                        className={[
                          styles.material,
                          material === r.material ? styles.materialActive : '',
                        ].filter(Boolean).join(' ')}
                        aria-pressed={material === r.material}
                      >
                        <span className={styles.materialName}>
                          {r.material.charAt(0) + r.material.slice(1).toLowerCase()}
                        </span>
                        <span className={styles.materialRate}>{naira(r.koboPerKg)}/kg</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Weight (kg)"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />

                <div className={styles.payout}>
                  <span className={styles.payoutLabel}>Credit to resident</span>
                  <span
                    className={`${styles.payoutValue} ${previewKobo === null ? styles.payoutMuted : ''}`}
                  >
                    {previewKobo === null ? '₦—' : naira(previewKobo)}
                  </span>
                </div>

                <div className={styles.actions}>
                  <Button type="button" variant="ghost" size="lg" onClick={reset}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className={styles.grow}
                    isLoading={busy}
                    disabled={!material || previewKobo === null}
                  >
                    Confirm drop-off
                  </Button>
                </div>
              </form>
              {error && <p className={styles.error}>{error}</p>}
            </div>
          )}

          {/* ── Step 3: receipt ───────────────────────────────────────── */}
          {step === 'receipt' && receipt && (
            <div className={styles.card}>
              <div className={styles.receiptTop}>
                <span className={styles.tick}>
                  <Check size={26} strokeWidth={2.5} />
                </span>
                <div className={styles.receiptAmount}>{naira(receipt.amountKobo)}</div>
                <div className={styles.receiptWho}>
                  credited to {receipt.residentName ?? 'resident'}
                </div>
              </div>

              <div className={styles.receiptRows}>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptKey}>Receipt</span>
                  <span className={`${styles.receiptVal} ${styles.code}`}>{receipt.receiptCode}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptKey}>Material</span>
                  <span className={styles.receiptVal}>
                    {receipt.material.charAt(0) + receipt.material.slice(1).toLowerCase()} · {kg(receipt.weightGrams)}
                  </span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptKey}>Wallet balance</span>
                  <span className={styles.receiptVal}>{naira(receipt.newBalance * 100)}</span>
                </div>
              </div>

              {receipt.flagged && (
                <div className={styles.flag}>
                  <AlertTriangle size={16} className={styles.flagIcon} />
                  <span>
                    <span className={styles.flagTitle}>Flagged for supervisor review. </span>
                    {receipt.flagReason} — the resident has still been credited.
                  </span>
                </div>
              )}

              <div className={styles.form}>
                <Button size="lg" onClick={reset} autoFocus>
                  Next resident
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
