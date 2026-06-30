'use client';

import { Phone, MessageCircle, Truck } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { PSP_DIRECTORY } from '@/constants/psp-directory';
import type { LagosLga } from '@/constants';

import styles from './PspContactCard.module.css';

type Props = {
  lga: LagosLga | null;
};

export function PspContactCard({ lga }: Props) {
  if (!lga) return null;
  const psp = PSP_DIRECTORY[lga];
  if (!psp) return null;

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
    </Card>
  );
}
