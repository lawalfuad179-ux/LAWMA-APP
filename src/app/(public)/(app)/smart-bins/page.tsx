'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, Truck, CreditCard, MapPin, Package, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import styles from './page.module.css';

const BIN_TYPES = [
  { value: 'green', label: 'Keep Lagos Clean (Green) — General waste' },
  { value: 'blue', label: 'Lagos Recycles (Blue) — Recyclables only' },
];

const QUANTITY_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  label: `${n} bin${n > 1 ? 's' : ''} — ₦${(n * 10000).toLocaleString('en-NG')}`,
}));

const BIN_INFO: Record<string, { name: string; desc: string; color: string }> = {
  green: {
    name: 'Keep Lagos Clean',
    desc: 'General household waste. Collected weekly by your assigned PSP operator.',
    color: '#2d6a2d',
  },
  blue: {
    name: 'Lagos Recycles',
    desc: 'Recyclables only — plastics, paper, glass, metal. Sorted at collection.',
    color: '#1a4e8c',
  },
};

/* ─────────────────────────── Verify Sheet ─────────────────────────── */

type VerifyStatus = 'verifying' | 'success' | 'failed';

type OrderDetails = {
  binType: string;
  binLabel: string;
  quantity: number;
  amountNaira: number;
  deliveryAddress: string;
};

function BinVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txRef = searchParams.get('tx_ref');
  const transactionId = searchParams.get('transaction_id');
  const urlStatus = searchParams.get('status');

  const isBinOrder = txRef?.startsWith('lawma_bin_') ?? false;

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<VerifyStatus>('verifying');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retriesRef = useRef(0);
  const MAX_RETRIES = 10;

  const checkStatus = useCallback(async () => {
    if (!txRef) return;
    try {
      const params = new URLSearchParams({ tx_ref: txRef });
      if (transactionId) params.set('transaction_id', transactionId);
      if (urlStatus) params.set('status', urlStatus);
      const res = await fetch(`/api/bins/verify?${params}`);
      const data = await res.json();

      if (data.status === 'SUCCESSFUL') {
        setOrder({
          binType: data.binType,
          binLabel: data.binLabel,
          quantity: data.quantity,
          amountNaira: data.amountNaira,
          deliveryAddress: data.deliveryAddress,
        });
        setStatus('success');
      } else if (data.status === 'FAILED' || data.status === 'INVALID') {
        setStatus('failed');
      } else {
        retriesRef.current += 1;
        if (retriesRef.current >= MAX_RETRIES) {
          setStatus('failed');
        } else {
          timerRef.current = setTimeout(checkStatus, 3000);
        }
      }
    } catch {
      retriesRef.current += 1;
      if (retriesRef.current >= MAX_RETRIES) {
        setStatus('failed');
      } else {
        timerRef.current = setTimeout(checkStatus, 3000);
      }
    }
  }, [txRef, transactionId, urlStatus]);

  useEffect(() => {
    if (!isBinOrder) return;
    setOpen(true);
    setStatus('verifying');
    setOrder(null);
    retriesRef.current = 0;
    checkStatus();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isBinOrder, checkStatus]);

  const close = useCallback(() => {
    setOpen(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    router.replace('/smart-bins', { scroll: false });
  }, [router]);

  if (!open) return null;

  return (
    <>
      <div
        className={styles.backdrop}
        onClick={() => { if (status !== 'verifying') close(); }}
      />
      <div className={styles.sheet} role="dialog" aria-modal="true">
        <div className={styles.handle} />
        <div className={styles.sheetContent}>

          {status === 'verifying' && (
            <>
              <div className={styles.spinner} />
              <h2 className={styles.sheetTitle}>Verifying your order…</h2>
              <p className={styles.sheetSubtitle}>Please wait while we confirm your payment.</p>
            </>
          )}

          {status === 'success' && order && (
            <>
              <div className={styles.successIcon}>
                <CheckCircle2 size={56} strokeWidth={1.5} color="var(--color-primary)" />
              </div>
              <h2 className={styles.sheetTitle}>Order Confirmed!</h2>
              <p className={styles.sheetSubtitle}>
                ₦{order.amountNaira.toLocaleString('en-NG')} paid — {order.quantity} {order.binLabel} bin{order.quantity !== 1 ? 's' : ''} on the way.
              </p>
              {order.deliveryAddress && (
                <div className={styles.deliveryRow}>
                  <MapPin size={14} strokeWidth={1.5} />
                  <span>{order.deliveryAddress}</span>
                </div>
              )}
              <div className={styles.binChip} style={{
                background: order.binType === 'green' ? '#2d6a2d18' : '#1a4e8c18',
                color: order.binType === 'green' ? '#2d6a2d' : '#1a4e8c',
                borderColor: order.binType === 'green' ? '#2d6a2d40' : '#1a4e8c40',
              }}>
                {order.binType === 'green' ? '● Green Bin' : '● Blue Bin'} · {order.binLabel}
              </div>
              <Button size="lg" onClick={close}>Done</Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className={styles.failedIcon}>
                <XCircle size={56} strokeWidth={1.5} color="var(--color-error)" />
              </div>
              <h2 className={styles.sheetTitle}>Payment Not Confirmed</h2>
              <p className={styles.sheetSubtitle}>
                We couldn&apos;t verify your payment. If money left your account, it will be reversed automatically within 3–5 business days.
              </p>
              <div className={styles.failedActions}>
                <Button
                  size="lg"
                  onClick={() => {
                    retriesRef.current = 0;
                    setStatus('verifying');
                    checkStatus();
                  }}
                >
                  Check Again
                </Button>
                <Button size="lg" variant="secondary" onClick={close}>Dismiss</Button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}

function BinVerifySheet() {
  return (
    <Suspense fallback={null}>
      <BinVerifyContent />
    </Suspense>
  );
}

/* ─────────────────────────── Main Page ─────────────────────────── */

export default function SmartBinsPage() {
  const [binType, setBinType] = useState('green');
  const [quantity, setQuantity] = useState('1');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prefilling, setPrefilling] = useState(true);

  useEffect(() => {
    fetch('/api/profile/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.data) {
          if (d.data.address) setAddress(d.data.address);
        }
      })
      .catch(() => {})
      .finally(() => setPrefilling(false));
  }, []);

  const totalNaira = parseInt(quantity, 10) * 10000;
  const info = BIN_INFO[binType];

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!address.trim()) { setError('Please enter a delivery address.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/bins/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          binType,
          quantity: parseInt(quantity, 10),
          deliveryAddress: address.trim(),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error?.message || 'Order failed. Please try again.');
        return;
      }
      window.location.href = data.data.checkoutUrl;
    } catch {
      setError('Could not connect. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <BinVerifySheet />

      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Smart Bins</h1>
          <p className={styles.subtitle}>Official LAWMA bins for Lagos State tenements.</p>
        </div>

        <div className={styles.features}>
          <div className={styles.featurePill}><Package size={14} strokeWidth={1.5} /><span>Easy Ordering</span></div>
          <div className={styles.featurePill}><Truck size={14} strokeWidth={1.5} /><span>Fast Delivery</span></div>
          <div className={styles.featurePill}><CreditCard size={14} strokeWidth={1.5} /><span>Secure Payment</span></div>
        </div>

        <div className={styles.splitLayout}>
          <div className={styles.splitLeft}>
            <Card className={styles.formCard}>
              <div className={styles.formHeader}>
                <ShoppingBag size={18} strokeWidth={1.5} />
                <span className={styles.formTitle}>Place your order</span>
              </div>

              <form onSubmit={handleOrder} className={styles.form}>
                <Select
                  label="Bin type"
                  options={BIN_TYPES}
                  value={binType}
                  onChange={(e) => setBinType(e.target.value)}
                />

                <Select
                  label="Quantity"
                  options={QUANTITY_OPTIONS}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />

                <Input
                  label="Delivery address"
                  placeholder="Your full street address"
                  value={prefilling ? 'Loading…' : address}
                  onChange={(e) => setAddress(e.target.value)}
                  icon={<MapPin size={16} strokeWidth={1.5} />}
                  helpText="Prefilled from your profile. Edit if different."
                  disabled={prefilling}
                />

                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Total</span>
                  <span className={styles.totalAmount}>₦{totalNaira.toLocaleString('en-NG')}</span>
                </div>

                {error && (
                  <div className={styles.errorBox}>
                    <AlertCircle size={15} strokeWidth={1.5} />
                    <span>{error}</span>
                  </div>
                )}

                <Button size="lg" isLoading={loading} type="submit">
                  Pay ₦{totalNaira.toLocaleString('en-NG')} — Order Now
                </Button>

                <p className={styles.disclaimer}>
                  Payment processed securely via Flutterwave. LAWMA may integrate additional payment methods in future.
                </p>
              </form>
            </Card>

            <Card className={styles.infoCard}>
              <p className={styles.infoText}>
                <strong>For Lagos State tenements only.</strong> Bins include a geotagging feature for easier collection tracking. Delivery is to your registered address. Contact LAWMA at <a href="tel:08130358535" className={styles.infoLink}>0813-035-8535</a> for order support.
              </p>
            </Card>
          </div>

          <div className={styles.splitRight}>
            <div className={styles.previewCard}>
              <div className={styles.binImgWrap}>
                <img
                  src="/assets/bins/bin-green.png"
                  alt="Keep Lagos Clean green bin"
                  className={`${styles.binImg} ${binType === 'green' ? styles.binImgVisible : ''}`}
                />
                <img
                  src="/assets/bins/bin-blue.png"
                  alt="Lagos Recycles blue bin"
                  className={`${styles.binImg} ${binType === 'blue' ? styles.binImgVisible : ''}`}
                />
              </div>

              <div className={styles.previewMeta}>
                <span
                  className={styles.previewBadge}
                  style={{ background: info.color + '18', color: info.color, borderColor: info.color + '40' }}
                >
                  {binType === 'green' ? '● Green Bin' : '● Blue Bin'}
                </span>
                <p className={styles.previewName}>{info.name}</p>
                <p className={styles.previewDesc}>{info.desc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
