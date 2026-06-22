'use client';

import { useState } from 'react';
import { Phone, MessageCircle, AlertCircle, Truck } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { PSP_DIRECTORY } from '@/constants/psp-directory';
import type { LagosLga } from '@/constants';

import styles from './PspContactCard.module.css';

type Props = {
  lga: LagosLga | null;
  address: string | null;
};

export function PspContactCard({ lga, address }: Props) {
  const toast = useToast();
  const [reporting, setReporting] = useState(false);

  if (!lga) return null;
  const psp = PSP_DIRECTORY[lga];
  if (!psp) return null;

  async function reportMissed() {
    if (!lga || !address) {
      toast('Set your address in profile to report missed pickups.', 'warning');
      return;
    }
    setReporting(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueType: 'MISSED_PICKUP',
          area: lga,
          address,
          description: `Missed pickup by ${psp.name}.`,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast('Missed pickup reported. LAWMA will follow up.', 'success');
      } else if (data.error?.code === 'duplicate') {
        toast('You already reported this in the last 48 hours.', 'info');
      } else {
        toast(data.error?.message || 'Could not file the report.', 'error');
      }
    } catch {
      toast('Network error. Please try again.', 'error');
    } finally {
      setReporting(false);
    }
  }

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <Truck size={18} strokeWidth={1.6} />
        </div>
        <div>
          <p className={styles.eyebrow}>Your PSP operator</p>
          <h2 className={styles.pspName}>{psp.name}</h2>
          <p className={styles.zone}>{psp.zone} · {lga}</p>
        </div>
      </div>

      <div className={styles.actions}>
        <a href={`tel:${psp.phone}`} className={styles.actionLink}>
          <Phone size={15} strokeWidth={1.6} />
          <span>Call</span>
        </a>
        {psp.whatsapp ? (
          <a
            href={`https://wa.me/${psp.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionLink}
          >
            <MessageCircle size={15} strokeWidth={1.6} />
            <span>WhatsApp</span>
          </a>
        ) : null}
      </div>

      <Button
        variant="secondary"
        size="md"
        onClick={reportMissed}
        isLoading={reporting}
        className={styles.reportBtn}
      >
        <AlertCircle size={15} strokeWidth={1.6} />
        Report missed pickup
      </Button>
    </Card>
  );
}
