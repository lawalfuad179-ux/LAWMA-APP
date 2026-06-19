'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Pencil, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { COMPLAINT_STATUS_LABELS } from '@/constants';
import styles from './SwipeableComplaintCard.module.css';

type Props = {
  complaint: {
    id: string;
    ticketId: string;
    status: string;
    issueType: string;
    address: string;
    createdAt: Date;
  };
  onDelete: (id: string) => void;
};

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 160;

export function SwipeableComplaintCard({ complaint, onDelete }: Props) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const [offsetX, setOffsetX] = useState(0);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const snapClosed = useCallback(() => {
    setOpen(false);
    setOffsetX(0);
    setConfirming(false);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    isDragging.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentX.current = e.touches[0].clientX;
    const delta = startX.current - currentX.current;
    const clamped = Math.max(0, Math.min(delta, ACTION_WIDTH + 20));
    setOffsetX(clamped);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (offsetX >= SWIPE_THRESHOLD) {
      setOpen(true);
      setOffsetX(ACTION_WIDTH);
    } else {
      snapClosed();
    }
  }, [offsetX, snapClosed]);

  const onPointerStart = useCallback((e: React.PointerEvent) => {
    startX.current = e.clientX;
    currentX.current = e.clientX;
    isDragging.current = true;
    (e.target as HTMLElement).style.cursor = 'grabbing';
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    currentX.current = e.clientX;
    const delta = startX.current - currentX.current;
    const clamped = Math.max(0, Math.min(delta, ACTION_WIDTH + 20));
    setOffsetX(clamped);
  }, []);

  const onPointerEnd = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    (e.target as HTMLElement).style.cursor = '';
    if (offsetX >= SWIPE_THRESHOLD) {
      setOpen(true);
      setOffsetX(ACTION_WIDTH);
    } else {
      snapClosed();
    }
  }, [offsetX, snapClosed]);

  const handleDeleteClick = () => {
    setConfirming(true);
  };

  const handleConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(complaint.id);
      }
    } catch {
      // Silently fail
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  const badgeVariant = complaint.status === 'RESOLVED' ? 'success' as const
    : complaint.status === 'IN_REVIEW' ? 'warning' as const
    : complaint.status === 'ASSIGNED' ? 'warning' as const
    : 'info' as const;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {/* Confirmation overlay */}
      {confirming && (
        <div className={styles.confirmOverlay}>
          <AlertTriangle size={18} strokeWidth={1.5} className={styles.confirmIcon} />
          <p className={styles.confirmText}>Delete this report?</p>
          <div className={styles.confirmActions}>
            <button
              className={styles.confirmCancel}
              onClick={snapClosed}
              type="button"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              className={styles.confirmDelete}
              onClick={handleConfirmDelete}
              type="button"
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {!confirming && (
        <div
          className={styles.actions}
          style={{ width: ACTION_WIDTH }}
        >
          <Link
            href={`/complaints/${complaint.id}/edit`}
            className={styles.actionBtn}
            style={{ background: 'var(--color-primary)' }}
            aria-label="Edit"
          >
            <Pencil size={18} strokeWidth={1.5} />
            <span>Edit</span>
          </Link>
          <button
            className={styles.actionBtn}
            style={{ background: 'var(--color-error)' }}
            onClick={handleDeleteClick}
            type="button"
            aria-label="Delete"
          >
            <Trash2 size={18} strokeWidth={1.5} />
            <span>Delete</span>
          </button>
        </div>
      )}

      <div
        className={styles.cardContent}
        style={{
          transform: `translateX(${confirming ? 0 : open ? -ACTION_WIDTH : -offsetX}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.25s cubic-bezier(0.34, 1.06, 0.64, 1)',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onPointerDown={onPointerStart}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <Link href={`/complaints/${complaint.id}`} className={styles.link}>
          <Card className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.ticketId}>{complaint.ticketId}</span>
              <span className={styles.date}>
                {new Date(complaint.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <span className={styles.issueType}>{complaint.issueType.replace(/_/g, ' ')}</span>
            <span className={styles.address}>{complaint.address}</span>
            <div>
              <Badge
                label={COMPLAINT_STATUS_LABELS[complaint.status] || complaint.status}
                variant={badgeVariant}
              />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
