'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Recycle, Search } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './CenterKiosk.module.css';

type Material = 'PLASTIC' | 'PAPER' | 'CARDBOARD' | 'METAL' | 'GLASS';
type Rate = { material: Material; koboPerKg: number };
type Resident = { id: string; name: string | null };

type ReceiptLine = {
  material: Material;
  weightGrams: number;
  rateKoboPerKg: number;
  amountKobo: number;
};

type Receipt = {
  receiptCode: string;
  residentName: string | null;
  lines: ReceiptLine[];
  totalWeightGrams: number;
  totalAmountKobo: number;
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

const titleCase = (m: string) => m.charAt(0) + m.slice(1).toLowerCase();

/** Whole grams from the operator's kg entry — money never rides on a float. */
function gramsFrom(input: string): number | null {
  const n = parseFloat(input);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 1000);
}

export function CenterKiosk({ operatorName, centerName, initialToday }: Props) {
  const [step, setStep] = useState<Step>('lookup');
  const [rates, setRates] = useState<Rate[]>([]);
  const [today, setToday] = useState(initialToday);

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [resident, setResident] = useState<Resident | null>(null);
  const [residentToday, setResidentToday] = useState<{ weightGrams: number; capGrams: number } | null>(null);

  // Raw kg strings keyed by material — a resident brings one sack holding
  // several materials, so the counter tallies them all before committing.
  const [weights, setWeights] = useState<Partial<Record<Material, string>>>({});
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
    setWeights({});
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
    if (!resident || tallyLines.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/center/dropoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId: resident.id,
          lines: tallyLines.map((l) => ({ material: l.material, weightGrams: l.weightGrams })),
        }),
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

  // Priced client-side purely to show the operator a live total; the server
  // re-prices from the rate table and its numbers are the ones that count.
  const tallyLines = rates.flatMap((r) => {
    const grams = gramsFrom(weights[r.material] ?? '');
    if (grams === null) return [];
    return [{
      material: r.material,
      weightGrams: grams,
      amountKobo: Math.floor((grams / 1000) * r.koboPerKg),
    }];
  });

  const previewKobo = tallyLines.length
    ? tallyLines.reduce((s, l) => s + l.amountKobo, 0)
    : null;
  const previewGrams = tallyLines.reduce((s, l) => s + l.weightGrams, 0);

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
                <span className={styles.avatar} aria-hidden="true">
                  {(resident.name?.trim().charAt(0) || 'R').toUpperCase()}
                </span>
                <div className={styles.residentInfo}>
                  <div className={styles.residentName}>{resident.name ?? 'Resident'}</div>
                  <div className={styles.residentMeta}>{phone}</div>
                </div>
                {residentToday && (
                  <div className={styles.capMeter}>
                    <span className={styles.capText}>
                      {kg(residentToday.weightGrams)} / {kg(residentToday.capGrams)} today
                    </span>
                    <span
                      className={styles.capTrack}
                      role="meter"
                      aria-label="Daily drop-off limit used"
                      aria-valuemin={0}
                      aria-valuemax={residentToday.capGrams}
                      aria-valuenow={Math.min(residentToday.weightGrams, residentToday.capGrams)}
                    >
                      <span
                        className={`${styles.capFill} ${overCap ? styles.capFillMax : ''}`}
                        style={{
                          width: `${Math.min(100, (residentToday.weightGrams / residentToday.capGrams) * 100)}%`,
                        }}
                      />
                    </span>
                  </div>
                )}
              </div>

              <form className={styles.form} onSubmit={handleWeigh}>
                <div>
                  <span className={styles.label}>
                    Weigh each material
                    <span className={styles.labelNote}>Indicative rates — LAWMA sets final pricing</span>
                  </span>
                  <div className={styles.materials}>
                    {rates.map((r) => {
                      const raw = weights[r.material] ?? '';
                      const grams = gramsFrom(raw);
                      const amount = grams === null ? null : Math.floor((grams / 1000) * r.koboPerKg);
                      const fieldId = `kg-${r.material.toLowerCase()}`;
                      return (
                        <div
                          key={r.material}
                          className={[
                            styles.material,
                            grams !== null ? styles.materialActive : '',
                          ].filter(Boolean).join(' ')}
                        >
                          <label className={styles.materialHead} htmlFor={fieldId}>
                            <span className={styles.materialName}>{titleCase(r.material)}</span>
                            <span className={styles.materialRate}>{naira(r.koboPerKg)}/kg</span>
                          </label>

                          <span className={styles.kgField}>
                            <input
                              id={fieldId}
                              className={styles.kgInput}
                              type="number"
                              inputMode="decimal"
                              step="0.1"
                              min="0"
                              placeholder="0.0"
                              value={raw}
                              onChange={(e) =>
                                setWeights((w) => ({ ...w, [r.material]: e.target.value }))
                              }
                              aria-label={`${titleCase(r.material)} weight in kilograms`}
                            />
                            <span className={styles.kgSuffix}>kg</span>
                          </span>

                          <span
                            className={[
                              styles.lineAmount,
                              amount === null ? styles.lineAmountEmpty : '',
                            ].filter(Boolean).join(' ')}
                          >
                            {amount === null ? '—' : naira(amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.payout}>
                  <span className={styles.payoutLabel}>
                    Credit to resident
                    {tallyLines.length > 0 && (
                      <span className={styles.payoutBreakdown}>
                        {tallyLines.length} material{tallyLines.length > 1 ? 's' : ''} · {kg(previewGrams)}
                      </span>
                    )}
                  </span>
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
                    disabled={previewKobo === null}
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
                <div className={styles.receiptAmount}>{naira(receipt.totalAmountKobo)}</div>
                <div className={styles.receiptWho}>
                  credited to {receipt.residentName ?? 'resident'}
                </div>
              </div>

              <div className={styles.receiptRows}>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptKey}>Receipt</span>
                  <span className={`${styles.receiptVal} ${styles.code}`}>{receipt.receiptCode}</span>
                </div>

                {/* Itemised, so the resident can check what they were paid for. */}
                {receipt.lines.map((l) => (
                  <div className={styles.receiptRow} key={l.material}>
                    <span className={styles.receiptKey}>
                      {titleCase(l.material)} · {kg(l.weightGrams)}
                    </span>
                    <span className={styles.receiptVal}>{naira(l.amountKobo)}</span>
                  </div>
                ))}

                {receipt.lines.length > 1 && (
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptKey}>Total weighed</span>
                    <span className={styles.receiptVal}>{kg(receipt.totalWeightGrams)}</span>
                  </div>
                )}

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
