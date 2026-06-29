'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Truck, CreditCard, MapPin, Package, AlertCircle } from 'lucide-react';
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
    <div className={styles.page}>
      {/* Page header — always full width */}
      <div className={styles.header}>
        <h1 className={styles.title}>Smart Bins</h1>
        <p className={styles.subtitle}>Official LAWMA bins for Lagos State tenements.</p>
      </div>

      <div className={styles.features}>
        <div className={styles.featurePill}><Package size={14} strokeWidth={1.5} /><span>Easy Ordering</span></div>
        <div className={styles.featurePill}><Truck size={14} strokeWidth={1.5} /><span>Fast Delivery</span></div>
        <div className={styles.featurePill}><CreditCard size={14} strokeWidth={1.5} /><span>Secure Payment</span></div>
      </div>

      {/* Split layout: form left, preview right on desktop */}
      <div className={styles.splitLayout}>

        {/* ── Left: Form + Info ── */}
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

        {/* ── Right: Bin image preview (desktop sticky, mobile above form) ── */}
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
  );
}
