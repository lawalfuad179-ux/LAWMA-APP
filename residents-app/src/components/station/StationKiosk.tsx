'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  Check,
  History,
  LogOut,
  Radio,
  ScanLine,
  Truck,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './StationKiosk.module.css';

type Tricycle = {
  id: string;
  rfidTag: string;
  plateNumber: string;
  operatorName: string;
  zone: string;
  walletBalanceKobo: number;
};

type Receipt = {
  receiptCode: string;
  tricycle: { rfidTag: string; plateNumber: string; operatorName: string };
  grossWeightGrams: number;
  rateKoboPerKg: number;
  feeKobo: number;
  balanceBeforeKobo: number;
  balanceAfterKobo: number;
  status: 'SETTLED' | 'FLAGGED_NEGATIVE' | 'VOID';
  flagged: boolean;
  flagReason: string | null;
};

type HistoryEvent = {
  id: string;
  receiptCode: string;
  rfidTag: string;
  plateNumber: string;
  operatorName: string;
  grossWeightGrams: number;
  feeKobo: number;
  balanceAfterKobo: number;
  status: 'SETTLED' | 'FLAGGED_NEGATIVE' | 'VOID';
  createdAt: string;
};

type Step = 'armed' | 'weigh' | 'receipt' | 'topup' | 'history';

type Props = {
  operatorName: string;
  stationName: string;
  initialToday: { passes: number; weightGrams: number; feesKobo: number };
  initialTricycles: Tricycle[];
  // For the live fee preview only — the server re-prices on every weigh.
  rateKoboPerKg: number | null;
};

const naira = (kobo: number) => {
  const sign = kobo < 0 ? '−' : '';
  return `${sign}₦${Math.abs(kobo / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
};

const kg = (grams: number) => `${(grams / 1000).toFixed(1)}kg`;

/** Whole grams from the attendant's kg entry — money never rides on a float. */
function gramsFrom(input: string): number | null {
  const n = parseFloat(input);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 1000);
}

const TOPUP_PRESETS_KOBO = [200_000, 500_000, 1_000_000];

export function StationKiosk({
  operatorName,
  stationName,
  initialToday,
  initialTricycles,
  rateKoboPerKg,
}: Props) {
  const [step, setStep] = useState<Step>('armed');
  const [today, setToday] = useState(initialToday);
  const [tricycles, setTricycles] = useState<Tricycle[]>(initialTricycles);

  // The tag being "read" during the simulated RFID pass, then the vehicle.
  const [scanningTag, setScanningTag] = useState<string | null>(null);
  const [tricycle, setTricycle] = useState<Tricycle | null>(null);
  const [typedTag, setTypedTag] = useState('');

  const [kgInput, setKgInput] = useState('');
  // While the scale "settles", the readout jitters around the entered weight
  // and then locks — the moment the fee becomes real.
  const [settling, setSettling] = useState(false);
  const [displayGrams, setDisplayGrams] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const [topupKobo, setTopupKobo] = useState<number | null>(null);
  const [topupCustom, setTopupCustom] = useState('');
  const [topupDone, setTopupDone] = useState<number | null>(null);

  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const held = timers.current;
    return () => held.forEach(clearTimeout);
  }, []);

  const refreshFleet = useCallback(() => {
    fetch('/api/station/detect')
      .then((r) => r.json())
      .then((j) => { if (j.ok) setTricycles(j.data.tricycles); })
      .catch(() => {});
  }, []);

  const reset = useCallback(() => {
    setStep('armed');
    setScanningTag(null);
    setTricycle(null);
    setTypedTag('');
    setKgInput('');
    setSettling(false);
    setDisplayGrams(null);
    setReceipt(null);
    setTopupKobo(null);
    setTopupCustom('');
    setTopupDone(null);
    setError(null);
  }, []);

  /** The simulated RFID read: ~1.2s of "reading tag…", then the vehicle card. */
  const detect = useCallback((t: Tricycle) => {
    setError(null);
    setScanningTag(t.rfidTag);
    timers.current.push(
      setTimeout(() => {
        setTricycle(t);
        setScanningTag(null);
        setStep('weigh');
      }, 1200),
    );
  }, []);

  async function handleTypedDetect(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/station/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfidTag: typedTag }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      detect(json.data.tricycle);
    } catch {
      setError('Network problem. Check the connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleWeigh(e: React.FormEvent) {
    e.preventDefault();
    if (!tricycle) return;
    const grams = gramsFrom(kgInput);
    if (grams === null) return;

    setError(null);
    setSettling(true);

    // Scale settle: jitter around the true reading, tightening each tick,
    // then lock. Pure theatre — the POST carries the typed value.
    const ticks = 9;
    for (let i = 0; i < ticks; i++) {
      timers.current.push(
        setTimeout(() => {
          const spread = (ticks - 1 - i) / ticks;
          const jitter = Math.round(grams * spread * 0.08 * (Math.random() * 2 - 1));
          setDisplayGrams(grams + jitter);
        }, 110 * i),
      );
    }

    timers.current.push(
      setTimeout(async () => {
        setDisplayGrams(grams);
        setBusy(true);
        try {
          const res = await fetch('/api/station/weigh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tricycleId: tricycle.id, weightGrams: grams }),
          });
          const json = await res.json();
          if (!json.ok) {
            setError(json.error.message);
            setSettling(false);
            return;
          }
          const r: Receipt = json.data;
          setReceipt(r);
          // Keep the in-hand vehicle current — "Top up now" from the receipt
          // must start from the post-fee balance, not the balance at detect.
          setTricycle((t) => (t ? { ...t, walletBalanceKobo: r.balanceAfterKobo } : t));
          setStep('receipt');
          setToday((t) => ({
            passes: t.passes + 1,
            weightGrams: t.weightGrams + r.grossWeightGrams,
            feesKobo: t.feesKobo + r.feeKobo,
          }));
          refreshFleet();
        } catch {
          setError('Network problem. The weigh-in was not recorded — try again.');
          setSettling(false);
        } finally {
          setBusy(false);
        }
      }, 110 * ticks + 250),
    );
  }

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault();
    if (!tricycle) return;
    const customNaira = parseFloat(topupCustom);
    const amountKobo =
      topupKobo ?? (Number.isFinite(customNaira) && customNaira > 0 ? Math.round(customNaira * 100) : null);
    if (!amountKobo || amountKobo <= 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/station/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tricycleId: tricycle.id, amountKobo }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      setTopupDone(json.data.balanceAfterKobo);
      setTricycle((t) => (t ? { ...t, walletBalanceKobo: json.data.balanceAfterKobo } : t));
      refreshFleet();
    } catch {
      setError('Network problem. The top-up was not recorded — try again.');
    } finally {
      setBusy(false);
    }
  }

  function openHistory() {
    setStep('history');
    setError(null);
    setHistoryLoading(true);
    fetch('/api/station/history')
      .then((r) => r.json())
      .then((j) => { if (j.ok) setHistory(j.data.events); })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }

  function openTopup(t: Tricycle) {
    setTricycle(t);
    setTopupKobo(null);
    setTopupCustom('');
    setTopupDone(null);
    setError(null);
    setStep('topup');
  }

  const grams = gramsFrom(kgInput);
  const previewFee =
    grams !== null && rateKoboPerKg !== null
      ? Math.floor((grams / 1000) * rateKoboPerKg)
      : null;

  const stepIndex = { armed: 0, weigh: 1, receipt: 2, topup: -1, history: -1 }[step];

  const identity = tricycle && (
    <div className={`${styles.vehicle} ${tricycle.walletBalanceKobo < 0 ? styles.vehicleNegative : ''}`}>
      <span className={styles.vehicleMark} aria-hidden="true">
        <Truck size={19} strokeWidth={1.8} />
      </span>
      <div className={styles.vehicleInfo}>
        <div className={styles.vehicleName}>{tricycle.operatorName}</div>
        <div className={styles.vehicleMeta}>
          {tricycle.plateNumber} · {tricycle.zone}
        </div>
      </div>
      <div className={styles.vehicleRight}>
        <span className={styles.tagChip}>{tricycle.rfidTag}</span>
        <span
          className={`${styles.balance} ${tricycle.walletBalanceKobo < 0 ? styles.balanceNegative : ''}`}
        >
          {naira(tricycle.walletBalanceKobo)}
        </span>
      </div>
    </div>
  );

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <ScanLine size={18} strokeWidth={2} />
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandTitle}>{stationName}</span>
            <span className={styles.brandSub}>Weighbridge console · {operatorName}</span>
          </span>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.shiftStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{today.passes}</span>
              <span className={styles.statLabel}>Tricycles</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{kg(today.weightGrams)}</span>
              <span className={styles.statLabel}>Tonnage</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{naira(today.feesKobo)}</span>
              <span className={styles.statLabel}>Fees docked</span>
            </div>
          </div>
          <span className={styles.headerDivider} aria-hidden="true" />

          <div className={styles.headerActions}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => (step === 'history' ? reset() : openHistory())}
            >
              <span className={styles.btnWithIcon}>
                <History size={15} strokeWidth={1.8} />
                Bridge log
              </span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={async () => {
                await fetch('/api/center/session', { method: 'DELETE' });
                window.location.reload();
              }}
            >
              <span className={styles.btnWithIcon}>
                <LogOut size={15} strokeWidth={1.8} />
                Sign out
              </span>
            </Button>
          </div>
        </div>
      </header>

      <main className={styles.body}>
        <div className={styles.panel}>
          {stepIndex >= 0 && (
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
          )}

          {/* ── Step 1: bridge armed, waiting for a tag ───────────────── */}
          {step === 'armed' && (
            <div className={styles.card}>
              <div className={styles.armedTop}>
                <span className={`${styles.pulseRing} ${scanningTag ? styles.pulseReading : ''}`}>
                  <Radio size={22} strokeWidth={1.8} />
                </span>
                <div className={styles.armedText}>
                  <h1 className={styles.title}>
                    {scanningTag ? 'Reading tag…' : 'Bridge armed'}
                  </h1>
                  <p className={styles.armedSub}>
                    {scanningTag ? (
                      <span className={styles.tagChip}>{scanningTag}</span>
                    ) : (
                      'Drive onto the bridge — the tag reads automatically. Tap a tricycle to simulate a pass.'
                    )}
                  </p>
                </div>
              </div>

              <div className={styles.fleet}>
                {tricycles.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={styles.fleetCard}
                    onClick={() => detect(t)}
                    disabled={!!scanningTag}
                  >
                    <span className={styles.fleetAvatar} aria-hidden="true">
                      {t.operatorName.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className={styles.fleetInfo}>
                      <span className={styles.fleetName}>{t.operatorName}</span>
                      <span className={styles.fleetMeta}>{t.plateNumber}</span>
                    </span>
                    <span className={styles.fleetRight}>
                      <span className={styles.tagChip}>{t.rfidTag}</span>
                      <span
                        className={`${styles.balance} ${
                          t.walletBalanceKobo < 100_000 ? styles.balanceLow : ''
                        } ${t.walletBalanceKobo < 0 ? styles.balanceNegative : ''}`}
                      >
                        {naira(t.walletBalanceKobo)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <form className={styles.tagForm} onSubmit={handleTypedDetect}>
                <Input
                  label="Or enter a tag manually"
                  autoComplete="off"
                  autoCapitalize="characters"
                  placeholder="TRC-4F2A9B"
                  value={typedTag}
                  onChange={(e) => setTypedTag(e.target.value.toUpperCase())}
                />
                <Button
                  type="submit"
                  size="lg"
                  variant="ghost"
                  isLoading={busy}
                  disabled={typedTag.length < 3 || !!scanningTag}
                >
                  Read tag
                </Button>
              </form>
              {error && <p className={styles.error}>{error}</p>}
            </div>
          )}

          {/* ── Step 2: on the bridge — weigh and dock ────────────────── */}
          {step === 'weigh' && tricycle && (
            <div className={styles.card}>
              {identity}

              <form className={styles.form} onSubmit={handleWeigh}>
                <div className={styles.scale}>
                  <span className={styles.scaleLabel}>
                    Bridge reading
                    <span className={styles.labelNote}>Indicative tipping rate — LAWMA sets final pricing</span>
                  </span>
                  <div className={styles.scaleRow}>
                    <span className={`${styles.scaleDisplay} ${settling ? styles.scaleSettling : ''}`}>
                      {settling && displayGrams !== null
                        ? (displayGrams / 1000).toFixed(1)
                        : kgInput || '0.0'}
                      <span className={styles.scaleUnit}>kg</span>
                    </span>
                    <input
                      className={styles.kgInput}
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      autoFocus
                      placeholder="0.0"
                      value={kgInput}
                      onChange={(e) => setKgInput(e.target.value)}
                      disabled={settling}
                      aria-label="Load weight in kilograms"
                    />
                  </div>
                </div>

                <div className={styles.payout}>
                  <div className={styles.payoutLeft}>
                    <span className={styles.payoutTitle}>Tipping fee</span>
                    <span className={styles.payoutBreakdown}>
                      {previewFee !== null && rateKoboPerKg !== null
                        ? `${kgInput}kg × ${naira(rateKoboPerKg)}/kg · docked from wallet`
                        : 'Enter the load weight'}
                    </span>
                  </div>
                  <span className={`${styles.payoutValue} ${previewFee === null ? styles.payoutMuted : ''}`}>
                    {previewFee === null ? '₦—' : naira(previewFee)}
                  </span>
                </div>

                <div className={styles.actions}>
                  <Button type="button" variant="ghost" size="lg" onClick={reset} disabled={settling}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={() => openTopup(tricycle)}
                    disabled={settling}
                  >
                    <span className={styles.btnWithIcon}>
                      <Banknote size={15} strokeWidth={1.8} />
                      Top up
                    </span>
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className={styles.grow}
                    isLoading={busy || settling}
                    disabled={grams === null}
                  >
                    Settle &amp; dock fee
                  </Button>
                </div>
              </form>
              {error && <p className={styles.error}>{error}</p>}
            </div>
          )}

          {/* ── Step 3: docked — the receipt ──────────────────────────── */}
          {step === 'receipt' && receipt && (
            <div className={styles.card}>
              <div className={styles.receiptTop}>
                <span className={`${styles.tick} ${receipt.flagged ? styles.tickWarn : ''}`}>
                  {receipt.flagged
                    ? <AlertTriangle size={24} strokeWidth={2.2} />
                    : <Check size={26} strokeWidth={2.5} />}
                </span>
                <div className={styles.receiptAmount}>{naira(receipt.feeKobo)}</div>
                <div className={styles.receiptWho}>
                  docked from <strong>{receipt.tricycle.operatorName}</strong>&apos;s wallet ·{' '}
                  {receipt.tricycle.plateNumber}
                </div>
                <span className={styles.codeChip}>{receipt.receiptCode}</span>
              </div>

              <div className={styles.receiptRows}>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptKey}>Load weighed</span>
                  <span className={styles.receiptVal}>{kg(receipt.grossWeightGrams)}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptKey}>Tipping rate</span>
                  <span className={styles.receiptVal}>{naira(receipt.rateKoboPerKg)}/kg</span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptKey}>Wallet before</span>
                  <span className={styles.receiptVal}>{naira(receipt.balanceBeforeKobo)}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptKey}>Wallet after</span>
                  <span
                    className={`${styles.receiptVal} ${
                      receipt.balanceAfterKobo < 0 ? styles.balanceNegative : ''
                    }`}
                  >
                    {naira(receipt.balanceAfterKobo)}
                  </span>
                </div>
              </div>

              {receipt.flagged && (
                <div className={styles.flag}>
                  <AlertTriangle size={16} className={styles.flagIcon} />
                  <span>
                    <span className={styles.flagTitle}>Flagged for supervisor review. </span>
                    {receipt.flagReason} — the pass has still been settled.
                  </span>
                </div>
              )}

              <div className={styles.actions}>
                {receipt.balanceAfterKobo < 0 && tricycle && (
                  <Button type="button" variant="ghost" size="lg" onClick={() => openTopup(tricycle)}>
                    <span className={styles.btnWithIcon}>
                      <Banknote size={15} strokeWidth={1.8} />
                      Top up now
                    </span>
                  </Button>
                )}
                <Button size="lg" className={styles.grow} onClick={reset} autoFocus>
                  Next tricycle
                </Button>
              </div>
            </div>
          )}

          {/* ── Top-up: cash over the counter onto the tag's wallet ───── */}
          {step === 'topup' && tricycle && (
            <div className={styles.card}>
              <h1 className={styles.title}>Top up wallet</h1>
              <div className={styles.form}>{identity}</div>

              {topupDone !== null ? (
                <>
                  <div className={styles.receiptTop}>
                    <span className={styles.tick}>
                      <Check size={26} strokeWidth={2.5} />
                    </span>
                    <div className={styles.receiptAmount}>{naira(topupDone)}</div>
                    <div className={styles.receiptWho}>new wallet balance</div>
                  </div>
                  <div className={styles.form}>
                    <Button size="lg" onClick={reset} autoFocus>
                      Back to bridge
                    </Button>
                  </div>
                </>
              ) : (
                <form className={styles.form} onSubmit={handleTopup}>
                  <div className={styles.presets} role="radiogroup" aria-label="Top-up amount">
                    {TOPUP_PRESETS_KOBO.map((k) => (
                      <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={topupKobo === k}
                        className={`${styles.preset} ${topupKobo === k ? styles.presetActive : ''}`}
                        onClick={() => {
                          setTopupKobo(k);
                          setTopupCustom('');
                        }}
                      >
                        {naira(k)}
                      </button>
                    ))}
                  </div>
                  <Input
                    label="Or a custom amount (₦)"
                    type="number"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="e.g. 3000"
                    value={topupCustom}
                    onChange={(e) => {
                      setTopupCustom(e.target.value);
                      setTopupKobo(null);
                    }}
                  />
                  <div className={styles.actions}>
                    <Button type="button" variant="ghost" size="lg" onClick={reset}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      className={styles.grow}
                      isLoading={busy}
                      disabled={topupKobo === null && !(parseFloat(topupCustom) > 0)}
                    >
                      Record cash top-up
                    </Button>
                  </div>
                </form>
              )}
              {error && <p className={styles.error}>{error}</p>}
            </div>
          )}

          {/* ── Bridge log: today's passes at this station ─────────────── */}
          {step === 'history' && (
            <div className={styles.card}>
              <div className={styles.historyHead}>
                <h1 className={styles.title}>Today&apos;s bridge log</h1>
                <span className={styles.historyCount}>
                  {historyLoading ? '…' : `${history.length} pass${history.length === 1 ? '' : 'es'}`}
                </span>
              </div>

              {historyLoading ? (
                <p className={styles.subtitle}>Loading the log…</p>
              ) : history.length === 0 ? (
                <p className={styles.subtitle}>
                  No tricycles weighed yet today. Passes appear here as the bridge records them.
                </p>
              ) : (
                <div className={styles.historyList}>
                  {history.map((ev) => (
                    <div className={styles.historyRow} key={ev.id}>
                      <span className={styles.historyAvatar} aria-hidden="true">
                        {ev.operatorName.trim().charAt(0).toUpperCase()}
                      </span>
                      <div className={styles.historyMeta}>
                        <span className={styles.historyName}>
                          {ev.operatorName} · {ev.plateNumber}
                        </span>
                        <span className={styles.historySub}>
                          {new Date(ev.createdAt).toLocaleTimeString('en-NG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {kg(ev.grossWeightGrams)} · {ev.rfidTag}
                        </span>
                      </div>
                      <div className={styles.historyRight}>
                        <span className={styles.historyFee}>{naira(-ev.feeKobo)}</span>
                        {ev.status === 'FLAGGED_NEGATIVE' && (
                          <span className={`${styles.chip} ${styles.chipFlag}`}>In arrears</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.form}>
                <Button size="lg" onClick={reset}>
                  Back to bridge
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
